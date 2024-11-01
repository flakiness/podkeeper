package main

import (
	"fmt"
	"log"
	"net/http"
	"os"
	"os/exec"
	"os/signal"
	"strconv"
	"sync"
	"syscall"
	"time"

	"github.com/gorilla/websocket"
)

var upgrader = websocket.Upgrader{
	ReadBufferSize:  1024,
	WriteBufferSize: 1024,
	CheckOrigin: func(r *http.Request) bool {
		return true // Allow all connections for this example
	},
}

func printUsage() {
	fmt.Println("Usage: process_manager <command-to-run>")
	fmt.Println("Example: process_manager python3 script.py")
}

func getEnvWithDefault(key, defaultValue string) string {
	if value, exists := os.LookupEnv(key); exists {
		return value
	}
	return defaultValue
}

func main() {
	if len(os.Args) <= 1 {
		printUsage()
		os.Exit(1)
	}

	// Parse command line arguments
	command := os.Args[1]
	args := os.Args[2:]

	// Get configuration from environment variables
	port, _ := strconv.Atoi(getEnvWithDefault("DEADMANSWITCH_PORT", "54321"))
	wsSuffix := getEnvWithDefault("DEADMANSWITCH_SUFFIX", "")

	connectionTimeoutSeconds, _ := strconv.Atoi(getEnvWithDefault("DEADMANSWITCH_TIMEOUT", "10"))

	// Channel to coordinate shutdown
	cmdFinished := make(chan struct{})
	clientConnected := make(chan struct{})
	clientDisconnected := make(chan struct{})

	// Start the child process
	cmd := exec.Command(command, args...)
	cmd.Stdout = os.Stdout
	cmd.Stderr = os.Stderr
	cmd.Stdin = os.Stdin

	if err := cmd.Start(); err != nil {
		log.Fatalf("Failed to start process: %v", err)
	}

	// Handle process completion
	go func() {
		cmd.Wait()
		close(cmdFinished)
	}()

	// Setup WebSocket handler
	var mutex sync.Mutex
	has_client := false
	http.HandleFunc("/"+wsSuffix, func(w http.ResponseWriter, r *http.Request) {
		var had_clients bool
		mutex.Lock()
		had_clients = has_client
		mutex.Unlock()

		if had_clients {
			http.NotFound(w, r)
			return
		}
		conn, err := upgrader.Upgrade(w, r, nil)
		if err != nil {
			log.Printf("[deadmanswitch] Failed to upgrade connection: %v", err)
			return
		}
		defer conn.Close()

		mutex.Lock()
		has_client = true
		mutex.Unlock()

		close(clientConnected)

		for {
			_, _, err := conn.ReadMessage()
			if err != nil {
				// Break the loop if an error occurs (e.g., if the connection is closed)
				close(clientDisconnected)
				break
			}
		}
	})

	// Start HTTP server
	server := &http.Server{
		Addr: fmt.Sprintf(":%d", port),
	}

	go func() {
		if err := server.ListenAndServe(); err != http.ErrServerClosed {
			log.Printf("[deadmanswitch] Server error: %v", err)
		}
	}()

	log.Printf("[deadmanswitch] Waiting %d seconds on ws://localhost:%d/%s for client", connectionTimeoutSeconds, port, wsSuffix)
	// Handle OS signals
	sigChan := make(chan os.Signal, 1)
	signal.Notify(sigChan, syscall.SIGINT, syscall.SIGTERM)

	// Set up connection timeout
	connetionTimer := time.NewTimer(time.Duration(connectionTimeoutSeconds) * time.Second)
	go func() {
		log.Printf("[deadmanswitch] expecting client connect...")
		<-clientConnected
		log.Printf("[deadmanswitch] yeah client connected")
		connetionTimer.Stop()
	}()

	select {
	case <-connetionTimer.C:
		log.Printf("[deadmanswitch] still no client after %d seconds - closing.", connectionTimeoutSeconds)
	case sig := <-sigChan:
		log.Printf("[deadmanswitch] Received %v, exiting", sig)
	case <-clientDisconnected:
		log.Println("[deadmanswitch] client disconnected, terminating process")
	case <-cmdFinished:
		log.Println("[deadmanswitch] process finished")
	}

	log.Println("[deadmanswitch] Shutting down...")

	// Shutdown the server
	server.Close()
	connetionTimer.Stop()

	// Give the process a chance to terminate gracefully
	if cmd.Process != nil {
		processShutdownTimer := time.NewTimer(time.Duration(connectionTimeoutSeconds) * time.Second)
		cmd.Process.Signal(syscall.SIGTERM)
		select {
		case <-processShutdownTimer.C:
			cmd.Process.Kill()
		case <-cmdFinished:
			processShutdownTimer.Stop()
		}
	}
}

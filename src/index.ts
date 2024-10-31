import { spawn } from 'child_process';
import WebSocket, { WebSocketServer } from 'ws';

// Helper function to print usage
function printUsage() {
  console.log("Usage: process_manager <command-to-run>");
  console.log("Example: process_manager python3 script.py");
  process.exit(1);
}

// Parse command line arguments
if (process.argv.length <= 2) {
  printUsage();
}

const command = process.argv[2];
const args = process.argv.slice(3);

// Start the child process
const processInstance = spawn(command, args, { stdio: ['inherit', 'inherit', 'inherit'] });

// Create WebSocket server
const port = parseInt(process.env.DCORD_PORT ?? '54321', 10);
const wss = new WebSocketServer({ port });
console.log(`WebSocket server running on ws://localhost:${port}`);

// Handle SIGINT (Ctrl+C) gracefully
process.on('SIGINT', async () => {
  console.log("\nReceived SIGINT, cleaning up...");
  try {
    processInstance.kill('SIGTERM');
  } catch (error) {
    console.error("Error during cleanup:", error);
  }
  process.exit(0);
});

wss.on('connection', (ws) => {
  console.log("New client connected");

  ws.on('close', () => {
    console.log("Client disconnected, terminating process");
    try {
      processInstance.kill('SIGTERM');
    } catch (error) {
      console.error("Error terminating process:", error);
    }
    wss.close();
    // process.exit(0);
  });
});


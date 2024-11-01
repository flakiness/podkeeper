#!/usr/bin/env node

import { spawn } from 'child_process';
import WebSocket, { WebSocketServer } from 'ws';
import { setTimeout } from 'timers/promises';

// Helper function to print usage
function printUsage() {
  console.log("Usage: process_manager <command-to-run>");
  console.log("Example: process_manager python3 script.py");
}

// Parse command line arguments
if (process.argv.length <= 2) {
  printUsage();
  process.exit(1);
}

const command = process.argv[2];
const args = process.argv.slice(3);

// Start the child process
const processInstance = spawn(command, args, { stdio: ['inherit', 'inherit', 'inherit'] });

// Create WebSocket server
const port = parseInt(process.env.DEADMANSWITCH_PORT ?? '54321', 10);
const connectionTimeout = parseInt(process.env.DEADMANSWITCH_TIMEOUT ?? '10', 10);
const wss = new WebSocketServer({ port });

let closeTimeout: NodeJS.Timeout | undefined;
async function close() {
  clearTimeout(closeTimeout);
  try {
    processInstance.kill('SIGTERM');
  } catch (error) {
    console.error("[deadmanswitch] Error terminating process:", error);
  }
  wss.close();
  // Give 5 seconds for clean shutdown, and then force-close.
  await setTimeout(5000, undefined, { ref: false });
  process.exit(0);
}

processInstance.on('exit', () => {
  close();
});

console.log(`[deadmanswitch] Server running on ws://localhost:${port}; waiting ${connectionTimeout}s for client.`);
closeTimeout = global.setTimeout(() => {
  console.log(`[deadmanswitch] still no client after ${connectionTimeout} seconds - closing.`);
  close();
}, connectionTimeout * 1000);

// Handle SIGINT (Ctrl+C) gracefully
process.on('SIGINT', async () => {
  console.log("[deadmanswitch] Received SIGINT, exiting");
  close();
});

process.on('SIGTERM', async () => {
  console.log("[deadmanswitch] Received SIGTERM, exiting");
  close();
});

wss.on('connection', (ws) => {
  clearTimeout(closeTimeout);
  console.log("[deadmanswitch] client connected");

  ws.on('close', () => {
    console.log("[deadmanswitch] client disconnected, terminating process");
    close();
  });
});


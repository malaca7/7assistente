// Polyfill WebSocket before anything else is imported
import WebSocket from 'ws';
if (!globalThis.WebSocket) {
  globalThis.WebSocket = WebSocket;
}

// Discloud Root Entry Point
import './server/index.mjs';


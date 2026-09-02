import './server/websocketPolyfill.mjs';
import WebSocket from 'ws';

if (typeof globalThis !== 'undefined') {
  globalThis.WebSocket = WebSocket;
}

// Discloud Root Entry Point
import './server/index.mjs';



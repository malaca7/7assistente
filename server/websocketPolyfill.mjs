import WebSocket from 'ws';

if (typeof globalThis !== 'undefined') {
  globalThis.WebSocket = WebSocket;
}
if (typeof global !== 'undefined') {
  global.WebSocket = WebSocket;
}
if (typeof window !== 'undefined') {
  window.WebSocket = WebSocket;
}

export { WebSocket };
export default WebSocket;

let WS = (typeof globalThis !== 'undefined' && globalThis.WebSocket) ? globalThis.WebSocket : null;

try {
  const wsModule = await import('ws');
  if (wsModule.default) {
    WS = wsModule.default;
  } else if (wsModule.WebSocket) {
    WS = wsModule.WebSocket;
  }
} catch (e) {
  // Use globalThis.WebSocket if ws package is not installed
}

if (typeof globalThis !== 'undefined' && WS) {
  globalThis.WebSocket = WS;
}
if (typeof global !== 'undefined' && WS) {
  global.WebSocket = WS;
}

export { WS as WebSocket };
export default WS;

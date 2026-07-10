import { useEffect, useRef } from "react";

import { useSocket } from "../context/SocketContext.jsx";

/**
 * Subscribes to a socket event for the lifetime of the component.
 *
 * The handler is held in a ref so callers may pass an inline arrow function
 * without the listener being torn down and re-attached on every render — which
 * would drop events in the gap.
 */
export function useSocketEvent(event, handler) {
  const { socketRef, isReady } = useSocket();
  const handlerRef = useRef(handler);
  handlerRef.current = handler;

  useEffect(() => {
    const socket = socketRef.current;
    if (!socket || !event) return undefined;

    const listener = (...args) => handlerRef.current?.(...args);
    socket.on(event, listener);

    return () => socket.off(event, listener);
    // isReady re-runs this once the socket exists.
  }, [event, socketRef, isReady]);
}

/** Promisified emit-with-ack. Resolves to the server's { ok, ... } response. */
export function useSocketEmit() {
  const { socketRef } = useSocket();

  return (event, payload) =>
    new Promise((resolve) => {
      const socket = socketRef.current;
      if (!socket) return resolve({ ok: false, error: "Not connected" });
      socket.emit(event, payload, resolve);
    });
}

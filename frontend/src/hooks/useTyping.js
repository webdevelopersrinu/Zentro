import { useCallback, useEffect, useRef, useState } from "react";

import { SOCKET_EVENTS, TYPING_THROTTLE_MS } from "../config/index.js";
import { useSocket } from "../context/SocketContext.jsx";
import { useSocketEvent } from "./useSocketEvent.js";

/**
 * Outgoing: one `typing:true` per throttle window, and a `typing:false` once the
 * user goes quiet. Emitting on every keystroke would flood every member's
 * socket for no benefit.
 *
 * Incoming: a set of usernames currently typing, cleared when they stop.
 */
export function useTyping(roomId) {
  const { socketRef } = useSocket();
  const [typists, setTypists] = useState([]);
  const lastSentAt = useRef(0);
  const idleTimer = useRef(null);

  const setTyping = useCallback(
    (isTyping) => {
      socketRef.current?.emit(SOCKET_EVENTS.TYPING, { roomId, isTyping });
    },
    [socketRef, roomId]
  );

  const handleKeystroke = useCallback(() => {
    const now = Date.now();
    if (now - lastSentAt.current > TYPING_THROTTLE_MS) {
      lastSentAt.current = now;
      setTyping(true);
    }

    clearTimeout(idleTimer.current);
    idleTimer.current = setTimeout(() => {
      lastSentAt.current = 0;
      setTyping(false);
    }, TYPING_THROTTLE_MS);
  }, [setTyping]);

  /** Called on send, so the indicator clears instantly rather than after idle. */
  const stopTyping = useCallback(() => {
    clearTimeout(idleTimer.current);
    lastSentAt.current = 0;
    setTyping(false);
  }, [setTyping]);

  useSocketEvent(SOCKET_EVENTS.TYPING, (event) => {
    // The socket is subscribed to every room we belong to, so a typing event
    // may well be about a conversation we are not looking at.
    if (event.roomId !== roomId) return;

    const { username, isTyping } = event;
    setTypists((current) =>
      isTyping
        ? current.includes(username)
          ? current
          : [...current, username]
        : current.filter((name) => name !== username)
    );
  });

  // Switching rooms must not carry the previous room's typists across.
  useEffect(() => {
    setTypists([]);
    return () => clearTimeout(idleTimer.current);
  }, [roomId]);

  return { typists, handleKeystroke, stopTyping };
}

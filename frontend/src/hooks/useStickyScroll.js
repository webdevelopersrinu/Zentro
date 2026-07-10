import { useCallback, useEffect, useRef, useState } from "react";

const NEAR_BOTTOM_PX = 100;

/**
 * Auto-scrolls to the newest message ONLY when the user is already near the
 * bottom. Otherwise it counts what they missed, so we can offer a "↓ N new"
 * pill instead of yanking them away from the message they are reading.
 */
export function useStickyScroll(dependency, itemCount) {
  const containerRef = useRef(null);
  const [pinned, setPinned] = useState(true);
  const [missed, setMissed] = useState(0);
  const lastCount = useRef(itemCount);

  const scrollToBottom = useCallback((behavior = "smooth") => {
    const node = containerRef.current;
    if (!node) return;
    node.scrollTo({ top: node.scrollHeight, behavior });
    setMissed(0);
    setPinned(true);
  }, []);

  const handleScroll = useCallback(() => {
    const node = containerRef.current;
    if (!node) return;

    const distance = node.scrollHeight - node.scrollTop - node.clientHeight;
    const isNearBottom = distance < NEAR_BOTTOM_PX;

    setPinned(isNearBottom);
    if (isNearBottom) setMissed(0);
  }, []);

  // New messages: follow them, or count them.
  useEffect(() => {
    const added = itemCount - lastCount.current;
    lastCount.current = itemCount;
    if (added <= 0) return;

    if (pinned) scrollToBottom("auto");
    else setMissed((count) => count + added);
  }, [itemCount, pinned, scrollToBottom]);

  // Switching rooms always starts at the bottom.
  useEffect(() => {
    setMissed(0);
    setPinned(true);
    scrollToBottom("auto");
  }, [dependency, scrollToBottom]);

  return { containerRef, handleScroll, missed, scrollToBottom };
}

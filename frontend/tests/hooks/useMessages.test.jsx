import { describe, expect, it, vi, beforeEach } from "vitest";
import { renderHook, act, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

import { useSendMessage } from "../../src/hooks/useMessages.js";
import { queryKeys } from "../../src/lib/queryKeys.js";

const ROOM = "r1";
const AUTHOR = { username: "alice" };
const real = { id: "server-1", roomId: ROOM, username: "alice", text: "hi", createdAt: "2026-01-01T00:00:00Z" };

let emit;
vi.mock("../../src/hooks/useSocketEvent.js", () => ({
  useSocketEmit: () => emit,
  useSocketEvent: vi.fn(),
}));

let queryClient;
const wrapper = ({ children }) => (
  <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
);

const messages = () => queryClient.getQueryData(queryKeys.messages(ROOM)) ?? [];

const renderSend = () =>
  renderHook(() => useSendMessage(ROOM, AUTHOR), { wrapper }).result;

beforeEach(() => {
  queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
});

describe("useSendMessage — optimistic send", () => {
  it("shows the bubble before the server has heard of it", async () => {
    let resolveAck;
    emit = vi.fn(() => new Promise((resolve) => (resolveAck = resolve)));
    const { current: send } = renderSend();

    act(() => void send("hi"));

    await waitFor(() => expect(messages()).toHaveLength(1));
    expect(messages()[0]).toMatchObject({ text: "hi", username: "alice", status: "sending" });

    await act(async () => resolveAck({ ok: true, message: real }));
  });

  it("promotes the placeholder to the real message when the ack wins the race", async () => {
    emit = vi.fn().mockResolvedValue({ ok: true, message: real });
    const { current: send } = renderSend();

    await act(async () => void (await send("hi")));

    expect(messages()).toHaveLength(1);
    expect(messages()[0].id).toBe("server-1");
    expect(messages()[0].status).toBeUndefined();
  });

  it("drops the placeholder when the broadcast wins the race — never doubles", async () => {
    emit = vi.fn(async () => {
      // The socket broadcast lands before the ack resolves.
      queryClient.setQueryData(queryKeys.messages(ROOM), (list = []) => [...list, real]);
      return { ok: true, message: real };
    });
    const { current: send } = renderSend();

    await act(async () => void (await send("hi")));

    expect(messages()).toHaveLength(1);
    expect(messages()[0].id).toBe("server-1");
  });

  it("marks the bubble failed, keeping the text for a retry", async () => {
    emit = vi.fn().mockResolvedValue({ ok: false, error: "Not a member" });
    const { current: send } = renderSend();

    await act(async () => void (await send("hi")));

    expect(messages()[0]).toMatchObject({ status: "failed", error: "Not a member", text: "hi" });
  });

  it("reports a disconnected socket as a failure rather than hanging", async () => {
    emit = vi.fn().mockResolvedValue({ ok: false, error: "Not connected" });
    const { current: send } = renderSend();

    await act(async () => void (await send("hi")));

    expect(messages()[0].status).toBe("failed");
  });
});

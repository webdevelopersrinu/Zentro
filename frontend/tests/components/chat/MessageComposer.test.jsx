import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import { MessageComposer } from "../../../src/components/chat/MessageComposer.jsx";

const setup = (props = {}) => {
  const onSend = vi.fn();
  const onKeystroke = vi.fn();
  const onStopTyping = vi.fn();

  render(
    <MessageComposer
      roomName="general"
      disabled={false}
      onSend={onSend}
      onKeystroke={onKeystroke}
      onStopTyping={onStopTyping}
      {...props}
    />
  );

  return {
    onSend,
    onKeystroke,
    onStopTyping,
    input: screen.getByRole("textbox", { name: "Message #general" }),
    send: screen.getByRole("button", { name: "Send message" }),
  };
};

describe("MessageComposer", () => {
  it("sends on Enter", async () => {
    const { onSend, input } = setup();

    await userEvent.type(input, "hello{Enter}");

    expect(onSend).toHaveBeenCalledWith("hello");
  });

  it("inserts a newline on Shift+Enter and does NOT send", async () => {
    const { onSend, input } = setup();

    await userEvent.type(input, "line one{Shift>}{Enter}{/Shift}line two");

    expect(onSend).not.toHaveBeenCalled();
    expect(input.value).toBe("line one\nline two");
  });

  it("clears the draft after sending", async () => {
    const { input } = setup();

    await userEvent.type(input, "hello{Enter}");

    expect(input.value).toBe("");
  });

  it("trims whitespace before sending", async () => {
    const { onSend, input } = setup();

    await userEvent.type(input, "  padded  {Enter}");

    expect(onSend).toHaveBeenCalledWith("padded");
  });

  it("refuses to send an empty or whitespace-only message", async () => {
    const { onSend, input, send } = setup();

    expect(send).toBeDisabled();
    await userEvent.type(input, "   {Enter}");

    expect(onSend).not.toHaveBeenCalled();
  });

  it("enables the send button once there is text", async () => {
    const { input, send } = setup();

    await userEvent.type(input, "hi");

    expect(send).toBeEnabled();
  });

  it("reports keystrokes so typing can be broadcast, and stops on send", async () => {
    const { onKeystroke, onStopTyping, input } = setup();

    await userEvent.type(input, "hi");
    expect(onKeystroke).toHaveBeenCalled();

    await userEvent.type(input, "{Enter}");
    expect(onStopTyping).toHaveBeenCalledOnce();
  });

  it("disables itself while the socket is down", () => {
    const { input, send } = setup({ disabled: true });

    expect(input).toBeDisabled();
    expect(send).toBeDisabled();
    expect(input).toHaveAttribute("placeholder", "Reconnecting…");
  });
});

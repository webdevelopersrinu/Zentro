import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import { Button } from "../../../src/components/ui/Button.jsx";

describe("Button", () => {
  it("is reachable by its accessible name", () => {
    render(<Button>Create room</Button>);
    expect(screen.getByRole("button", { name: "Create room" })).toBeInTheDocument();
  });

  it("calls onClick when pressed", async () => {
    const onClick = vi.fn();
    render(<Button onClick={onClick}>Join</Button>);

    await userEvent.click(screen.getByRole("button"));

    expect(onClick).toHaveBeenCalledOnce();
  });

  it("does not fire while loading, and announces its busy state", async () => {
    const onClick = vi.fn();
    render(
      <Button loading onClick={onClick}>
        Join
      </Button>
    );

    const button = screen.getByRole("button");
    expect(button).toBeDisabled();
    expect(button).toHaveAttribute("aria-busy", "true");

    await userEvent.click(button);
    expect(onClick).not.toHaveBeenCalled();
  });

  it("does not fire when disabled", async () => {
    const onClick = vi.fn();
    render(
      <Button disabled onClick={onClick}>
        Join
      </Button>
    );

    await userEvent.click(screen.getByRole("button"));
    expect(onClick).not.toHaveBeenCalled();
  });

  it("keeps its label visible while loading, so the layout cannot jump", () => {
    render(<Button loading>Join</Button>);
    expect(screen.getByText("Join")).toBeVisible();
  });

  it("forwards a ref, so it can be focused programmatically", () => {
    const ref = { current: null };
    render(<Button ref={ref}>Join</Button>);

    expect(ref.current).toBeInstanceOf(HTMLButtonElement);
  });

  it("applies the variant and size classes from its CSS module", () => {
    render(
      <Button variant="danger" size="lg">
        Delete
      </Button>
    );

    const button = screen.getByRole("button");
    expect(button).toHaveClass("button", "danger", "lg");
  });

  it("merges a caller-supplied className instead of dropping it", () => {
    render(<Button className="custom">Join</Button>);
    expect(screen.getByRole("button")).toHaveClass("button", "custom");
  });
});

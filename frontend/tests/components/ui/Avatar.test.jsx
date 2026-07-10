import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import { fireEvent } from "@testing-library/dom";

import { Avatar } from "../../../src/components/ui/Avatar.jsx";

const image = (container) => container.querySelector("img");

describe("Avatar", () => {
  it("renders the image when one is supplied", () => {
    const { container } = render(<Avatar src="https://cdn.test/a.png" name="Alice" />);
    expect(image(container)).toHaveAttribute("src", "https://cdn.test/a.png");
  });

  it("falls back to initials when there is no image", () => {
    render(<Avatar name="Srinu Desetti" />);
    expect(screen.getByText("SD")).toBeInTheDocument();
  });

  // Google's avatar CDN 404s once a user changes their profile picture.
  it("falls back to initials when the image fails to load", () => {
    const { container } = render(<Avatar src="https://cdn.test/gone.png" name="Alice" />);

    fireEvent.error(image(container));

    expect(screen.getByText("A")).toBeInTheDocument();
    expect(image(container)).toBeNull();
  });

  it("uses at most two initials", () => {
    render(<Avatar name="One Two Three Four" />);
    expect(screen.getByText("OT")).toBeInTheDocument();
  });

  it("gives the same person the same colour every time", () => {
    const { container: first } = render(<Avatar name="alice" />);
    const { container: second } = render(<Avatar name="alice" />);
    const { container: other } = render(<Avatar name="bob" />);

    const hue = (c) => c.firstChild.style.getPropertyValue("--avatar-hue");

    expect(hue(first)).toBe(hue(second));
    expect(hue(first)).not.toBe(hue(other));
  });

  it("is decorative — the name is announced by the surrounding text, not twice", () => {
    const { container } = render(<Avatar name="Alice" />);
    expect(container.firstChild).toHaveAttribute("aria-hidden", "true");
  });

  it("lazy-loads and sets explicit dimensions to avoid layout shift", () => {
    const { container } = render(<Avatar src="https://cdn.test/a.png" name="A" size={48} />);
    const img = image(container);

    expect(img).toHaveAttribute("loading", "lazy");
    expect(img).toHaveAttribute("width", "48");
    expect(img).toHaveAttribute("height", "48");
  });
});

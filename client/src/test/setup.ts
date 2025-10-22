import "@testing-library/jest-dom";
import { afterEach, vi } from "vitest";
import { cleanup } from "@testing-library/react";
import i18n from "../AppData/i18n";

i18n.changeLanguage("en");

afterEach(() => {
  cleanup();
});

if (typeof window !== "undefined") {
  if (!window.matchMedia) {
    Object.defineProperty(window, "matchMedia", {
      writable: true,
      value: vi.fn().mockImplementation((query: string) => ({
        matches: false,
        media: query,
        onchange: null,
        addListener: vi.fn(),
        removeListener: vi.fn(),
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
        dispatchEvent: vi.fn(),
      })),
    });
  }

  Object.defineProperty(window, "getComputedStyle", {
    value: vi.fn().mockImplementation(() => ({
      getPropertyValue: () => "",
    })),
  });
}

Object.defineProperty(HTMLElement.prototype, "offsetHeight", {
  configurable: true,
  value: 32,
});

Object.defineProperty(HTMLElement.prototype, "offsetWidth", {
  configurable: true,
  value: 32,
});

Object.defineProperty(HTMLElement.prototype, "scrollHeight", {
  configurable: true,
  value: 32,
});

Object.defineProperty(HTMLElement.prototype, "scrollWidth", {
  configurable: true,
  value: 32,
});

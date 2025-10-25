import { describe, expect, it, vi, beforeEach } from "vitest";

const rootRender = vi.fn();
const rootUnmount = vi.fn();
const createRootSpy = vi.fn(() => ({
  render: rootRender,
  unmount: rootUnmount,
}));

const unstableSetRenderMock = vi.fn();

vi.mock("react-dom/client", async () => {
  const actual = await vi.importActual<typeof import("react-dom/client")>(
    "react-dom/client"
  );
  return {
    ...actual,
    createRoot: createRootSpy,
  };
});

vi.mock("antd", async () => {
  const actual = await vi.importActual<typeof import("antd")>("antd");
  return {
    ...actual,
    unstableSetRender: unstableSetRenderMock,
  };
});

describe("Ant Design React 19 compatibility bridge", () => {
  beforeEach(() => {
    document.body.innerHTML = '<div id="root"></div>';
    createRootSpy.mockClear();
    rootRender.mockClear();
    rootUnmount.mockClear();
    unstableSetRenderMock.mockClear();
    vi.resetModules();
  });

  it("registers antd compatibility render using React createRoot", async () => {
    await import("../main");

    expect(unstableSetRenderMock).toHaveBeenCalledTimes(1);
    const compatRender = unstableSetRenderMock.mock.calls[0][0];
    const container = document.createElement("div");

    const cleanup = compatRender(null, container);
    expect(createRootSpy).toHaveBeenCalledTimes(2); // one for app root, one for wave
    expect(typeof cleanup).toBe("function");

    compatRender(null, container);
    expect(createRootSpy).toHaveBeenCalledTimes(2);

    cleanup();
    expect(rootUnmount).toHaveBeenCalled();
  });
});

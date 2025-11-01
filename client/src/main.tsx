import React from "react";
import { createRoot } from "react-dom/client";
import type { Root } from "react-dom/client";
import { unstableSetRender } from "antd";
import "antd/dist/reset.css";
import "./styles/global.scss";
import "./styles/_fonts.scss";
import "./AppData/i18n/i18n";
import App from "./app/App";

/**
 * Ant Design React 19 render compatibility
 */
const rootCache = new WeakMap<Element | DocumentFragment, Root>();

unstableSetRender((node, container) => {
  const target = container as Element | DocumentFragment;

  let root = rootCache.get(target);
  if (!root) {
    root = createRoot(target as Element);
    rootCache.set(target, root);
  }

  root.render(node);

  return async () => {
    root.unmount();
    rootCache.delete(target);
    return Promise.resolve();
  };

});

/** App entry point */
const container = document.getElementById("root");
if (!container) throw new Error("Root container element not found");

createRoot(container).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);

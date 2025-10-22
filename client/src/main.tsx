import React from "react";
import { createRoot } from "react-dom/client";
import "antd/dist/reset.css";
import "./styles/global.scss";
import "./styles/_fonts.scss";
import "./AppData/i18n/i18n";
import App from "./app/App";

const container = document.getElementById("root");

if (!container) {
  throw new Error("Root container element not found");
}

createRoot(container).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);

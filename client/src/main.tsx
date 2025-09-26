import React from "react";
import { createRoot } from "react-dom/client";
// import { BrowserRouter } from "react-router-dom"
import App from "./App";

// استایل‌های سراسری (اگر قبلاً اضافه شده، همان بماند)
import "./styles/global.scss";

// ✅ این خط را اضافه کن: مقداردهی i18n
import "./AppData/i18n/i18n";

import "./styles/_fonts.scss";
createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);

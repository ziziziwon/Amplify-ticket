import React from "react";
import { createRoot } from "react-dom/client";
import SeatPopupApp from "./screens/SeatPopupApp";
import "./index.css";

const container = document.getElementById("popup-root");
if (!container) {
  throw new Error("Failed to find the popup-root element");
}

const root = createRoot(container);
root.render(
  <React.StrictMode>
    <SeatPopupApp />
  </React.StrictMode>
);

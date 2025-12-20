import React from "react";
import { createRoot } from "react-dom/client";
import { registerSW } from "virtual:pwa-register";
import App from "./App.tsx";
import "./index.css";

// Ensure the PWA service worker is registered so Android can install a true standalone app.
registerSW({ immediate: true });

createRoot(document.getElementById("root")!).render(<App />);


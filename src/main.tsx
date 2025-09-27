// src/main.tsx
import React from "react";
import ReactDOM from "react-dom/client";
import "./index.css";             // <-- Tailwind here
import BevyApp from "./components/BevyApp";  // <-- The component I built for you

ReactDOM.createRoot(document.getElementById("root")!).render(
    <React.StrictMode>
        <BevyApp />
    </React.StrictMode>
);
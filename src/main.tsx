// src/main.tsx
import React from "react";
import ReactDOM from "react-dom/client";
import "./index.css";
import BevyApp from "./components/BevyApp";

ReactDOM.createRoot(document.getElementById("root")!).render(
    <React.StrictMode>
        <BevyApp />
    </React.StrictMode>
);
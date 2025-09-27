import React from "react";
import ReactDOM from "react-dom/client";
import { createBrowserRouter, RouterProvider } from "react-router-dom";
import "./index.css";
import App from "./App";
import Explore from "./pages/Explore";
import Wishlist from "./pages/Wishlist";
import Search from "./pages/Search";
import Bevin from "./pages/Bevin";
import Profile from "./pages/Profile";


const router = createBrowserRouter([
    {
        path: "/",
        element: <App />,
        children: [
            { index: true, element: <Explore /> },
            { path: "wishlist", element: <Wishlist /> },
            { path: "search", element: <Search /> },
            { path: "bevin", element: <Bevin /> },
            { path: "profile/:id?", element: <Profile /> },
        ],
    },
]);


ReactDOM.createRoot(document.getElementById("root")!).render(
    <React.StrictMode>
        <RouterProvider router={router} />
    </React.StrictMode>
);
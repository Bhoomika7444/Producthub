// src/main.jsx
// WHY THIS FILE EXISTS:
//   This is React's entry point. It finds the <div id="root"> in index.html
//   and renders our entire React app inside it.
//   Think of it as "connecting React to the HTML page".

import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import "./index.css";

// ReactDOM.createRoot() finds the <div id="root"> element.
// .render(<App />) puts our App component inside it.
ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);

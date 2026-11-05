import React from "react";
import ReactDOM from "react-dom/client";
import "@fontsource-variable/geist";
import "./styles.css";
import App from "./App";
import "./light-theme.css";

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);

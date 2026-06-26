import React from "react";
import ReactDOM from "react-dom/client";
import ScriptsApp from "./ScriptsApp";
import "../index.css";
import "./scripts.css";

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <ScriptsApp />
  </React.StrictMode>,
);

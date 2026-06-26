import React from "react";
import ReactDOM from "react-dom/client";
import { ConvexProvider, ConvexReactClient } from "convex/react";
import ScriptsApp from "./ScriptsApp";
import "../index.css";
import "./scripts.css";

const convexUrl = import.meta.env.VITE_CONVEX_URL as string | undefined;
const convex = convexUrl ? new ConvexReactClient(convexUrl) : null;

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    {convex ? (
      <ConvexProvider client={convex}>
        <ScriptsApp />
      </ConvexProvider>
    ) : (
      <div className="wrap">
        <h1>Backend not connected</h1>
        <p className="muted">
          Set <code>VITE_CONVEX_URL</code> and run the Convex backend to use the
          script studio.
        </p>
      </div>
    )}
  </React.StrictMode>,
);

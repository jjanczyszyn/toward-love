import React from "react";
import ReactDOM from "react-dom/client";
import OfferingsApp from "./OfferingsApp";
import "../index.css";
import "./offerings.css";
import { getConsent, loadGa } from "../analytics";

// Load Google Analytics only if the visitor previously granted consent on the
// main site (consent is stored in localStorage and shared across pages).
if (getConsent() === "granted") loadGa();

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <OfferingsApp />
  </React.StrictMode>,
);

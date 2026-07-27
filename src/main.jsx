import React from "react";
import { createRoot } from "react-dom/client";
import BootstrapApp from "./BootstrapApp.jsx";
import "./styles.css";
import "./enhancements.css";
import "./typography.css";
import "./thermalPrint.css";
import "./runtime.css";
import "./thermalPrint.js";

createRoot(document.getElementById("root")).render(<BootstrapApp />);

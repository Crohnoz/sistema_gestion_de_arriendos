import React from "react";
import { createRoot } from "react-dom/client";
import RuntimeErrorBoundary from "./RuntimeErrorBoundary.jsx";
import AdminAccessibilityTools from "./AdminAccessibilityTools.jsx";
import "./styles.css";
import "./enhancements.css";
import "./typography.css";
import "./thermalPrint.css";
import "./runtime.css";
import "./authEnhancements.css";
import "./adminAccessibilityTools.css";

const rootElement = document.getElementById("root");
const root = createRoot(rootElement);

const toolsElement = document.createElement("div");
toolsElement.id = "admin-tools-root";
document.body.appendChild(toolsElement);
const toolsRoot = createRoot(toolsElement);
toolsRoot.render(<AdminAccessibilityTools />);

async function bootApplication() {
  try {
    const [{ default: BootstrapApp }] = await Promise.all([
      import("./BootstrapApp.jsx"),
      import("./thermalPrint.js"),
    ]);

    root.render(
      <RuntimeErrorBoundary>
        <BootstrapApp />
      </RuntimeErrorBoundary>,
    );
  } catch (error) {
    console.error("Error al cargar los módulos de la aplicación", error);
    root.render(
      <main className="runtime-center" role="alert">
        <h1>No se pudo cargar el sistema</h1>
        <p>La aplicación encontró un error antes de abrir la pantalla de acceso.</p>
        <pre className="runtime-diagnostic">
          {error?.message || "Error de carga sin detalle"}
        </pre>
        <button type="button" onClick={() => window.location.reload()}>
          Reintentar
        </button>
      </main>,
    );
  }
}

bootApplication();

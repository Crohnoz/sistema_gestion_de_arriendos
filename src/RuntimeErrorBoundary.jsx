import React from "react";

export default class RuntimeErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { error: null };
  }

  static getDerivedStateFromError(error) {
    return { error };
  }

  componentDidCatch(error, info) {
    console.error("Error fatal al iniciar la aplicación", error, info);
  }

  render() {
    if (!this.state.error) return this.props.children;

    return (
      <main className="runtime-center" role="alert">
        <h1>No se pudo iniciar el sistema</h1>
        <p>
          Ocurrió un error al cargar la aplicación. Recargue la página. Si continúa,
          revise que el despliegue tenga configuradas las variables de Supabase.
        </p>
        <pre className="runtime-diagnostic">
          {this.state.error?.message || "Error de inicialización sin detalle"}
        </pre>
        <button type="button" onClick={() => window.location.reload()}>
          Recargar aplicación
        </button>
      </main>
    );
  }
}

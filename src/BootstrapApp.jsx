import { useEffect, useMemo, useState } from "react";
import { createClient } from "@supabase/supabase-js";
import { Database, Eye, LoaderCircle, LockKeyhole, LogIn, LogOut, RefreshCw, ShieldCheck } from "lucide-react";
import RentalAdminApp from "./App.jsx";
import { createEmptyWorkspace, demoSeed } from "./demoSeed";
import { createDebouncedWorkspaceWriter, installPrivateStorageBridge } from "./privateStorageBridge";
import {
  IS_DEMO,
  IS_PRIVATE,
  PRODUCT_NAME,
  STORAGE_KEY,
  SUPABASE_ANON_KEY,
  SUPABASE_URL,
} from "./runtime";

function prepareDemoStorage() {
  try {
    const current = JSON.parse(window.localStorage.getItem(STORAGE_KEY));
    const isEmpty =
      !current ||
      (!current.arrendatarios?.length && !current.cobros?.length && !current.contratos?.length);

    if (isEmpty) {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(demoSeed));
    }
  } catch {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(demoSeed));
  }
}

function LoadingScreen({ message = "Preparando el sistema…" }) {
  return (
    <main className="runtime-center">
      <LoaderCircle className="runtime-spinner" size={42} />
      <h1>{PRODUCT_NAME}</h1>
      <p>{message}</p>
    </main>
  );
}

function LoginScreen({ supabase, error, setError }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);

  async function submit(event) {
    event.preventDefault();
    setSubmitting(true);
    setError("");

    const { error: loginError } = await supabase.auth.signInWithPassword({ email, password });
    if (loginError) setError("El correo o la contraseña no son correctos.");
    setSubmitting(false);
  }

  return (
    <main className="login-page">
      <section className="login-card">
        <div className="login-icon"><LockKeyhole size={36} /></div>
        <span className="login-eyebrow">Acceso privado</span>
        <h1>{PRODUCT_NAME}</h1>
        <p>Ingrese con la cuenta autorizada para administrar los datos reales del edificio.</p>

        <form onSubmit={submit}>
          <label>
            <span>Correo electrónico</span>
            <input
              type="email"
              autoComplete="username"
              required
              value={email}
              onChange={(event) => setEmail(event.target.value)}
            />
          </label>
          <label>
            <span>Contraseña</span>
            <input
              type="password"
              autoComplete="current-password"
              required
              minLength={8}
              value={password}
              onChange={(event) => setPassword(event.target.value)}
            />
          </label>
          {error && <div className="runtime-error" role="alert">{error}</div>}
          <button className="login-submit" type="submit" disabled={submitting}>
            {submitting ? <LoaderCircle className="runtime-spinner" size={20} /> : <LogIn size={20} />}
            {submitting ? "Ingresando…" : "Ingresar"}
          </button>
        </form>

        <div className="security-note">
          <ShieldCheck size={20} />
          <span>Sesión autenticada y datos aislados del entorno de demostración.</span>
        </div>
      </section>
    </main>
  );
}

function DemoBar() {
  function resetDemo() {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(demoSeed));
    window.location.reload();
  }

  return (
    <div className="environment-bar demo-bar">
      <div><Eye size={19} /><strong>Demostración pública</strong><span>Todos los datos son ficticios.</span></div>
      <button onClick={resetDemo}><RefreshCw size={17} /> Reiniciar demo</button>
    </div>
  );
}

function PrivateBar({ email, syncStatus, onLogout }) {
  const statusText = {
    loading: "Cargando datos…",
    saving: "Guardando cambios…",
    saved: "Cambios guardados",
    error: "Error de sincronización",
  }[syncStatus] || "Conectado";

  return (
    <div className="environment-bar private-bar">
      <div>
        <ShieldCheck size={19} />
        <strong>Entorno privado</strong>
        <span>{email}</span>
        <span className={`sync-status ${syncStatus}`}><Database size={16} /> {statusText}</span>
      </div>
      <button onClick={onLogout}><LogOut size={17} /> Cerrar sesión</button>
    </div>
  );
}

export default function BootstrapApp() {
  const [phase, setPhase] = useState(IS_DEMO ? "loading" : "auth-loading");
  const [session, setSession] = useState(null);
  const [error, setError] = useState("");
  const [syncStatus, setSyncStatus] = useState("loading");

  const supabase = useMemo(() => {
    if (!IS_PRIVATE || !SUPABASE_URL || !SUPABASE_ANON_KEY) return null;
    return createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
      auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: true },
    });
  }, []);

  useEffect(() => {
    if (!IS_DEMO) return;
    prepareDemoStorage();
    setPhase("ready");
  }, []);

  useEffect(() => {
    if (!IS_PRIVATE) return;
    if (!supabase) {
      setError("Faltan las variables VITE_SUPABASE_URL y VITE_SUPABASE_ANON_KEY.");
      setPhase("configuration-error");
      return;
    }

    let mounted = true;
    supabase.auth.getSession().then(({ data }) => {
      if (!mounted) return;
      setSession(data.session);
      setPhase(data.session ? "workspace-loading" : "unauthenticated");
    });

    const { data: listener } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      if (!mounted) return;
      setSession(nextSession);
      setPhase(nextSession ? "workspace-loading" : "unauthenticated");
    });

    return () => {
      mounted = false;
      listener.subscription.unsubscribe();
    };
  }, [supabase]);

  useEffect(() => {
    if (!IS_PRIVATE || !supabase || !session?.user) return;

    let active = true;
    let uninstallBridge = null;
    let writer = null;

    async function loadWorkspace() {
      setSyncStatus("loading");
      setError("");

      let { data: workspace, error: selectError } = await supabase
        .from("rental_workspaces")
        .select("id, name, data")
        .eq("owner_id", session.user.id)
        .maybeSingle();

      if (selectError) throw selectError;

      if (!workspace) {
        const created = await supabase
          .from("rental_workspaces")
          .insert({
            owner_id: session.user.id,
            name: "Edificio 23",
            data: createEmptyWorkspace(),
          })
          .select("id, name, data")
          .single();

        if (created.error) throw created.error;
        workspace = created.data;
      }

      if (!active) return;

      writer = createDebouncedWorkspaceWriter({
        supabase,
        workspaceId: workspace.id,
        onStatus: setSyncStatus,
      });

      uninstallBridge = installPrivateStorageBridge({
        initialData: workspace.data || createEmptyWorkspace(),
        onPersist: writer,
      });

      setSyncStatus("saved");
      setPhase("ready");
    }

    loadWorkspace().catch((workspaceError) => {
      console.error(workspaceError);
      if (!active) return;
      setError("No fue posible cargar el espacio privado. Revise la configuración y las políticas de acceso.");
      setPhase("workspace-error");
      setSyncStatus("error");
    });

    return () => {
      active = false;
      writer?.flush?.().catch((flushError) => console.error(flushError));
      writer?.cancel?.();
      uninstallBridge?.();
    };
  }, [session?.user?.id, supabase]);

  async function logout() {
    setPhase("auth-loading");
    await supabase.auth.signOut();
  }

  if (phase === "configuration-error") {
    return <main className="runtime-center"><LockKeyhole size={42} /><h1>Configuración incompleta</h1><p>{error}</p></main>;
  }

  if (phase === "unauthenticated") {
    return <LoginScreen supabase={supabase} error={error} setError={setError} />;
  }

  if (phase === "workspace-error") {
    return <main className="runtime-center"><Database size={42} /><h1>No se pudo abrir el sistema</h1><p>{error}</p><button onClick={logout}>Cerrar sesión</button></main>;
  }

  if (phase !== "ready") {
    return <LoadingScreen message={phase === "workspace-loading" ? "Cargando los datos privados…" : undefined} />;
  }

  return (
    <div className="runtime-shell">
      {IS_DEMO ? (
        <DemoBar />
      ) : (
        <PrivateBar email={session?.user?.email || "Usuario autorizado"} syncStatus={syncStatus} onLogout={logout} />
      )}
      <RentalAdminApp />
    </div>
  );
}

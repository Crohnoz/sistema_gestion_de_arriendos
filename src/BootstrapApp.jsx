import { useEffect, useMemo, useRef, useState } from "react";
import { createClient } from "@supabase/supabase-js";
import {
  Database,
  Eye,
  KeyRound,
  LoaderCircle,
  LockKeyhole,
  LogIn,
  LogOut,
  RefreshCw,
  ShieldCheck,
  UserPlus,
} from "lucide-react";
import RentalAdminApp from "./App.jsx";
import { demoSeed } from "./demoSeed";
import {
  PasswordChangeModal,
  PasswordRecoveryScreen,
} from "./PasswordManagement.jsx";
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
  const params = useMemo(() => new URLSearchParams(window.location.search), []);
  const [mode, setMode] = useState(params.get("invite") === "1" ? "signup" : "login");
  const [email, setEmail] = useState(params.get("email") || "");
  const [password, setPassword] = useState("");
  const [passwordConfirmation, setPasswordConfirmation] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [notice, setNotice] = useState("");

  function switchMode(nextMode) {
    setMode(nextMode);
    setError("");
    setNotice("");
    setPassword("");
    setPasswordConfirmation("");
  }

  async function submitLogin(event) {
    event.preventDefault();
    setSubmitting(true);
    setError("");
    setNotice("");

    const { error: loginError } = await supabase.auth.signInWithPassword({
      email: email.trim().toLowerCase(),
      password,
    });

    if (loginError) setError("El correo o la contraseña no son correctos.");
    setSubmitting(false);
  }

  async function submitSignup(event) {
    event.preventDefault();
    setSubmitting(true);
    setError("");
    setNotice("");

    const normalizedEmail = email.trim().toLowerCase();

    if (password !== passwordConfirmation) {
      setError("Las contraseñas no coinciden.");
      setSubmitting(false);
      return;
    }

    const { data: isInvited, error: invitationError } = await supabase.rpc(
      "rental_email_is_invited",
      { invited_email: normalizedEmail },
    );

    if (invitationError) {
      setError("No fue posible validar la invitación. Intente nuevamente.");
      setSubmitting(false);
      return;
    }

    if (!isInvited) {
      setError("Este correo no tiene una invitación activa para el edificio.");
      setSubmitting(false);
      return;
    }

    const { data, error: signupError } = await supabase.auth.signUp({
      email: normalizedEmail,
      password,
      options: { emailRedirectTo: window.location.origin },
    });

    if (signupError) {
      setError(
        signupError.message.toLowerCase().includes("registered")
          ? "Esta cuenta ya fue creada. Use la opción Ingresar."
          : "No fue posible crear el acceso. Intente nuevamente.",
      );
      setSubmitting(false);
      return;
    }

    if (data.session) {
      setNotice("Acceso creado correctamente. Abriendo el sistema…");
    } else {
      setNotice("Cuenta creada. Revise su correo y confirme el acceso para ingresar.");
    }

    setSubmitting(false);
  }

  async function submitRecovery(event) {
    event.preventDefault();
    setSubmitting(true);
    setError("");
    setNotice("");

    const normalizedEmail = email.trim().toLowerCase();
    const recoveryUrl = `${window.location.origin}/?passwordRecovery=1`;
    const { error: recoveryError } = await supabase.auth.resetPasswordForEmail(
      normalizedEmail,
      { redirectTo: recoveryUrl },
    );

    if (recoveryError) {
      setError("No fue posible enviar el correo de recuperación. Intente nuevamente.");
    } else {
      setNotice("Revise su correo. Si la cuenta existe, recibirá un enlace para crear una contraseña nueva.");
    }

    setSubmitting(false);
  }

  const formSubmit = mode === "login"
    ? submitLogin
    : mode === "signup"
      ? submitSignup
      : submitRecovery;

  return (
    <main className="login-page">
      <section className="login-card">
        <div className="login-icon">
          {mode === "login" ? (
            <LockKeyhole size={36} />
          ) : mode === "signup" ? (
            <UserPlus size={36} />
          ) : (
            <KeyRound size={36} />
          )}
        </div>
        <span className="login-eyebrow">Acceso privado</span>
        <h1>{PRODUCT_NAME}</h1>
        <p>
          {mode === "login"
            ? "Ingrese a la administración del edificio con su correo y contraseña."
            : mode === "signup"
              ? "Cree su contraseña usando el correo que recibió la invitación."
              : "Ingrese su correo para recibir un enlace seguro de recuperación."}
        </p>

        {mode !== "recover" && (
          <div className="auth-tabs" role="tablist" aria-label="Tipo de acceso">
            <button
              type="button"
              className={mode === "login" ? "active" : ""}
              onClick={() => switchMode("login")}
            >
              Ingresar
            </button>
            <button
              type="button"
              className={mode === "signup" ? "active" : ""}
              onClick={() => switchMode("signup")}
            >
              Crear acceso
            </button>
          </div>
        )}

        <form onSubmit={formSubmit}>
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

          {mode !== "recover" && (
            <label>
              <span>{mode === "login" ? "Contraseña" : "Cree una contraseña"}</span>
              <input
                type="password"
                autoComplete={mode === "login" ? "current-password" : "new-password"}
                required
                minLength={12}
                value={password}
                onChange={(event) => setPassword(event.target.value)}
              />
            </label>
          )}

          {mode === "signup" && (
            <label>
              <span>Repita la contraseña</span>
              <input
                type="password"
                autoComplete="new-password"
                required
                minLength={12}
                value={passwordConfirmation}
                onChange={(event) => setPasswordConfirmation(event.target.value)}
              />
            </label>
          )}

          {mode === "login" && (
            <button className="auth-link-button" type="button" onClick={() => switchMode("recover")}>
              ¿Olvidó su contraseña?
            </button>
          )}

          {error && <div className="runtime-error" role="alert">{error}</div>}
          {notice && <div className="runtime-notice" role="status">{notice}</div>}

          <button className="login-submit" type="submit" disabled={submitting}>
            {submitting ? (
              <LoaderCircle className="runtime-spinner" size={20} />
            ) : mode === "login" ? (
              <LogIn size={20} />
            ) : mode === "signup" ? (
              <UserPlus size={20} />
            ) : (
              <KeyRound size={20} />
            )}
            {submitting
              ? "Procesando…"
              : mode === "login"
                ? "Ingresar"
                : mode === "signup"
                  ? "Crear mi acceso"
                  : "Enviar enlace de recuperación"}
          </button>

          {mode === "recover" && (
            <button className="auth-link-button auth-link-centered" type="button" onClick={() => switchMode("login")}>
              Volver a ingresar
            </button>
          )}
        </form>

        <div className="security-note">
          <ShieldCheck size={20} />
          <span>
            La página guarda los cambios directamente en la base privada. No necesita ingresar ni administrar Supabase.
          </span>
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

function PrivateBar({ email, role, syncStatus, onChangePassword, onLogout }) {
  const statusText = {
    loading: "Cargando datos…",
    saving: "Guardando cambios…",
    saved: "Cambios guardados",
    error: "Error de sincronización",
  }[syncStatus] || "Conectado";

  const roleText = {
    owner: "Administrador",
    manager: "Gestor del edificio",
    viewer: "Solo lectura",
  }[role] || "Usuario autorizado";

  return (
    <div className="environment-bar private-bar">
      <div>
        <ShieldCheck size={19} />
        <strong>Entorno privado</strong>
        <span>{email}</span>
        <span className="role-badge">{roleText}</span>
        <span className={`sync-status ${syncStatus}`}><Database size={16} /> {statusText}</span>
      </div>
      <div className="private-bar-actions">
        <button onClick={onChangePassword}><KeyRound size={17} /> Cambiar contraseña</button>
        <button onClick={onLogout}><LogOut size={17} /> Cerrar sesión</button>
      </div>
    </div>
  );
}

export default function BootstrapApp() {
  const recoveryRequested = useMemo(
    () => new URLSearchParams(window.location.search).get("passwordRecovery") === "1",
    [],
  );
  const [phase, setPhase] = useState(IS_DEMO ? "loading" : "auth-loading");
  const [session, setSession] = useState(null);
  const [error, setError] = useState("");
  const [syncStatus, setSyncStatus] = useState("loading");
  const [workspaceRole, setWorkspaceRole] = useState(null);
  const [passwordDialogOpen, setPasswordDialogOpen] = useState(false);
  const [passwordRecoveryActive, setPasswordRecoveryActive] = useState(recoveryRequested);
  const authenticatedUserId = useRef(null);
  const passwordRecoveryRef = useRef(recoveryRequested);

  const supabase = useMemo(() => {
    if (!IS_PRIVATE || !SUPABASE_URL || !SUPABASE_ANON_KEY) return null;
    return createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
      auth: {
        storage: window.sessionStorage,
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true,
      },
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
      authenticatedUserId.current = data.session?.user?.id || null;
      setSession(data.session);

      if (data.session && passwordRecoveryRef.current) {
        setPhase("password-recovery");
      } else {
        setPhase(data.session ? "workspace-loading" : "unauthenticated");
      }
    });

    const { data: listener } = supabase.auth.onAuthStateChange((event, nextSession) => {
      if (!mounted) return;

      const nextUserId = nextSession?.user?.id || null;
      const userChanged = authenticatedUserId.current !== nextUserId;
      authenticatedUserId.current = nextUserId;
      setSession(nextSession);

      if (event === "PASSWORD_RECOVERY") {
        passwordRecoveryRef.current = true;
        setPasswordRecoveryActive(true);
        setPhase("password-recovery");
        return;
      }

      if (!nextSession) {
        setWorkspaceRole(null);
        setPasswordDialogOpen(false);
        setPhase("unauthenticated");
      } else if (userChanged) {
        passwordRecoveryRef.current = false;
        setPasswordRecoveryActive(false);
        setPhase("workspace-loading");
      }
    });

    return () => {
      mounted = false;
      listener.subscription.unsubscribe();
    };
  }, [supabase]);

  useEffect(() => {
    if (!IS_PRIVATE || !supabase || !session?.user || passwordRecoveryActive) return;

    let active = true;
    let uninstallBridge = null;
    let writer = null;

    async function loadWorkspace() {
      setSyncStatus("loading");
      setError("");

      const { data: membership, error: membershipError } = await supabase
        .from("rental_workspace_members")
        .select("role, rental_workspaces!inner(id, name, data)")
        .eq("user_id", session.user.id)
        .maybeSingle();

      if (membershipError) throw membershipError;

      const relatedWorkspace = Array.isArray(membership?.rental_workspaces)
        ? membership.rental_workspaces[0]
        : membership?.rental_workspaces;

      if (!membership || !relatedWorkspace) {
        setPhase("access-denied");
        return;
      }

      if (!active) return;

      setWorkspaceRole(membership.role);
      writer = createDebouncedWorkspaceWriter({
        supabase,
        workspaceId: relatedWorkspace.id,
        onStatus: setSyncStatus,
      });

      uninstallBridge = installPrivateStorageBridge({
        initialData: relatedWorkspace.data,
        onPersist: writer,
      });

      setSyncStatus("saved");
      setPhase("ready");
    }

    loadWorkspace().catch((workspaceError) => {
      console.error(workspaceError);
      if (!active) return;
      setError("No fue posible cargar el espacio privado. Revise la conexión e intente nuevamente.");
      setPhase("workspace-error");
      setSyncStatus("error");
    });

    return () => {
      active = false;
      writer?.flush?.().catch((flushError) => console.error(flushError));
      writer?.cancel?.();
      uninstallBridge?.();
    };
  }, [session?.user?.id, supabase, passwordRecoveryActive]);

  async function logout() {
    setPasswordDialogOpen(false);
    setPhase("auth-loading");
    await supabase.auth.signOut();
  }

  function completePasswordRecovery() {
    passwordRecoveryRef.current = false;
    setPasswordRecoveryActive(false);
    setPhase("workspace-loading");
  }

  if (phase === "configuration-error") {
    return <main className="runtime-center"><LockKeyhole size={42} /><h1>Configuración incompleta</h1><p>{error}</p></main>;
  }

  if (phase === "unauthenticated") {
    return <LoginScreen supabase={supabase} error={error} setError={setError} />;
  }

  if (phase === "password-recovery" && session) {
    return <PasswordRecoveryScreen supabase={supabase} onComplete={completePasswordRecovery} />;
  }

  if (phase === "access-denied") {
    return (
      <main className="runtime-center">
        <ShieldCheck size={42} />
        <h1>Cuenta sin acceso</h1>
        <p>La cuenta fue autenticada, pero no tiene una membresía activa para este edificio.</p>
        <button onClick={logout}>Cerrar sesión</button>
      </main>
    );
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
        <PrivateBar
          email={session?.user?.email || "Usuario autorizado"}
          role={workspaceRole}
          syncStatus={syncStatus}
          onChangePassword={() => setPasswordDialogOpen(true)}
          onLogout={logout}
        />
      )}
      <RentalAdminApp />
      {!IS_DEMO && (
        <PasswordChangeModal
          open={passwordDialogOpen}
          supabase={supabase}
          onClose={() => setPasswordDialogOpen(false)}
        />
      )}
    </div>
  );
}

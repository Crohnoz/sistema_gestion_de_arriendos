import { useState } from "react";
import { KeyRound, LoaderCircle, ShieldCheck, X } from "lucide-react";

function passwordErrorMessage(error) {
  const message = error?.message?.toLowerCase?.() || "";

  if (message.includes("same password")) {
    return "La contraseña nueva debe ser diferente de la contraseña actual.";
  }
  if (message.includes("current password") || message.includes("invalid credentials")) {
    return "La contraseña actual no es correcta.";
  }
  if (message.includes("weak") || message.includes("characters")) {
    return "La contraseña no cumple los requisitos de seguridad.";
  }
  return "No fue posible cambiar la contraseña. Intente nuevamente.";
}

export function PasswordChangeForm({
  supabase,
  recovery = false,
  onCancel,
  onComplete,
}) {
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmation, setConfirmation] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  async function submit(event) {
    event.preventDefault();
    setError("");

    if (newPassword !== confirmation) {
      setError("Las contraseñas nuevas no coinciden.");
      return;
    }

    if (newPassword.length < 12) {
      setError("La contraseña debe tener al menos 12 caracteres.");
      return;
    }

    if (!recovery && currentPassword === newPassword) {
      setError("La contraseña nueva debe ser diferente de la actual.");
      return;
    }

    setSubmitting(true);

    const attributes = recovery
      ? { password: newPassword }
      : { password: newPassword, currentPassword };

    const { error: updateError } = await supabase.auth.updateUser(attributes);

    if (updateError) {
      setError(passwordErrorMessage(updateError));
      setSubmitting(false);
      return;
    }

    setCurrentPassword("");
    setNewPassword("");
    setConfirmation("");
    setSuccess(true);
    setSubmitting(false);
  }

  if (success) {
    return (
      <div className="password-success" role="status">
        <ShieldCheck size={42} />
        <h2>Contraseña actualizada</h2>
        <p>La nueva contraseña ya quedó activa para esta cuenta.</p>
        <button className="login-submit" type="button" onClick={onComplete}>
          Continuar
        </button>
      </div>
    );
  }

  return (
    <form className="password-form" onSubmit={submit}>
      {!recovery && (
        <label>
          <span>Contraseña actual</span>
          <input
            type="password"
            autoComplete="current-password"
            required
            value={currentPassword}
            onChange={(event) => setCurrentPassword(event.target.value)}
          />
        </label>
      )}

      <label>
        <span>Nueva contraseña</span>
        <input
          type="password"
          autoComplete="new-password"
          required
          minLength={12}
          value={newPassword}
          onChange={(event) => setNewPassword(event.target.value)}
        />
      </label>

      <label>
        <span>Repita la nueva contraseña</span>
        <input
          type="password"
          autoComplete="new-password"
          required
          minLength={12}
          value={confirmation}
          onChange={(event) => setConfirmation(event.target.value)}
        />
      </label>

      <p className="password-requirement">Use al menos 12 caracteres y no comparta la contraseña entre cuentas.</p>
      {error && <div className="runtime-error" role="alert">{error}</div>}

      <div className="password-actions">
        {onCancel && (
          <button className="secondary-action" type="button" onClick={onCancel} disabled={submitting}>
            Cancelar
          </button>
        )}
        <button className="login-submit" type="submit" disabled={submitting}>
          {submitting ? <LoaderCircle className="runtime-spinner" size={20} /> : <KeyRound size={20} />}
          {submitting ? "Actualizando…" : "Cambiar contraseña"}
        </button>
      </div>
    </form>
  );
}

export function PasswordChangeModal({ open, supabase, onClose }) {
  if (!open) return null;

  return (
    <div className="password-modal-backdrop" role="presentation" onMouseDown={onClose}>
      <section
        className="password-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="password-modal-title"
        onMouseDown={(event) => event.stopPropagation()}
      >
        <button className="password-modal-close" type="button" onClick={onClose} aria-label="Cerrar">
          <X size={20} />
        </button>
        <div className="login-icon"><KeyRound size={34} /></div>
        <span className="login-eyebrow">Seguridad de la cuenta</span>
        <h2 id="password-modal-title">Cambiar contraseña</h2>
        <p>Confirme la contraseña actual y defina una nueva para esta cuenta.</p>
        <PasswordChangeForm supabase={supabase} onCancel={onClose} onComplete={onClose} />
      </section>
    </div>
  );
}

export function PasswordRecoveryScreen({ supabase, onComplete }) {
  function finishRecovery() {
    window.history.replaceState({}, document.title, window.location.pathname);
    onComplete();
  }

  return (
    <main className="login-page">
      <section className="login-card">
        <div className="login-icon"><KeyRound size={36} /></div>
        <span className="login-eyebrow">Recuperación de cuenta</span>
        <h1>Nueva contraseña</h1>
        <p>El enlace fue validado. Defina una contraseña nueva para continuar.</p>
        <PasswordChangeForm supabase={supabase} recovery onComplete={finishRecovery} />
      </section>
    </main>
  );
}

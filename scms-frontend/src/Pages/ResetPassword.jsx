import { useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { resetPassword } from "../services/api";
import "./Login.css";

export default function ResetPassword() {
  const [params] = useSearchParams();
  const token = params.get("token") || "";
  const email = params.get("email") || "";

  const [password, setPassword] = useState("");
  const [confirmation, setConfirmation] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const validLink = Boolean(token && email);

  const submit = async (event) => {
    event.preventDefault();
    if (submitting) return;

    setError("");

    if (password !== confirmation) {
      setError("The passwords do not match.");
      return;
    }

    setSubmitting(true);

    try {
      const result = await resetPassword({
        token,
        email,
        password,
        password_confirmation: confirmation,
      });

      // Laravel revokes existing tokens after a password reset.
      for (const storage of [localStorage, sessionStorage]) {
        storage.removeItem("scms_token");
        storage.removeItem("scms_is_authenticated");
        storage.removeItem("scms_admin_name");
      }

      setPassword("");
      setConfirmation("");
      setSuccess(result.message);
    } catch (err) {
      setError(err.message || "Unable to reset your password.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <main
      className="login-container"
      style={{
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        minHeight: "100dvh",
        padding: "24px",
      }}
    >
      <section className="login-card" style={{ margin: 0 }}>
        <h2>Reset your password</h2>
        <p className="login-card-copy">
          Choose a new password with at least 12 characters.
        </p>

        {!validLink ? (
          <>
            <p className="login-error" role="alert">
              This link is incomplete. Please request a new reset link.
            </p>
            <Link to="/login">Back to sign in</Link>
          </>
        ) : success ? (
          <>
            <p role="status">{success}</p>
            <p>
              <a href="/login">Back to sign in</a>
            </p>
          </>
        ) : (
          <form onSubmit={submit}>
            <label htmlFor="reset-password">New password</label>
            <div className="input-box">
              <input
                id="reset-password"
                type="password"
                autoComplete="new-password"
                minLength={12}
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                disabled={submitting}
                required
              />
            </div>

            <label htmlFor="reset-confirmation">Confirm new password</label>
            <div className="input-box">
              <input
                id="reset-confirmation"
                type="password"
                autoComplete="new-password"
                minLength={12}
                value={confirmation}
                onChange={(event) => setConfirmation(event.target.value)}
                disabled={submitting}
                required
              />
            </div>

            {error && (
              <p className="login-error" role="alert">
                {error}
              </p>
            )}

            <button
              className="login-btn"
              type="submit"
              disabled={submitting}
            >
              {submitting ? "Saving…" : "Save new password"}
            </button>
          </form>
        )}
      </section>
    </main>
  );
}
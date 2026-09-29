import { useState } from "react";
import { Link } from "react-router-dom";
import { sendPasswordResetLink } from "../services/api";
import "./Login.css";

export default function ForgotPassword() {
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const submit = async (event) => {
    event.preventDefault();
    if (submitting) return;

    setError("");
    setMessage("");
    setSubmitting(true);

    try {
      const result = await sendPasswordResetLink(email.trim());
      setMessage(result.message);
    } catch (err) {
      setError(err.message || "Unable to send the reset link.");
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
      <section
        className="login-card"
        style={{ margin: 0 }}
        aria-labelledby="forgot-password-title"
      >
        <h2 id="forgot-password-title">Forgot your password?</h2>

        <p className="login-card-copy">
          Enter the email registered to your SCMS account.
          We’ll send you a password-reset link.
        </p>

        {message ? (
          <p role="status">{message}</p>
        ) : (
          <form onSubmit={submit}>
            <label htmlFor="reset-email">Email address</label>

            <div className="input-box">
              <input
                id="reset-email"
                type="email"
                autoComplete="email"
                placeholder="you@example.com"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
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
              type="submit"
              className="login-btn"
              disabled={submitting}
            >
              {submitting ? "Sending…" : "Send reset link"}
            </button>
          </form>
        )}

        <p style={{ marginTop: "20px" }}>
          <Link to="/login">Back to sign in</Link>
        </p>
      </section>
    </main>
  );
}
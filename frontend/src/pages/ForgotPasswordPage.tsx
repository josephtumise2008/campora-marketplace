import { useState } from "react";
import { Link } from "react-router-dom";
import { KeyRound, MailCheck } from "lucide-react";
import { AuthLayout } from "../layouts/AuthLayout";
import { authService } from "../services/marketplace";
import { useToast } from "../context/ToastContext";
import { Spinner } from "../components/ui/Feedback";

export default function ForgotPasswordPage() {
  const toast = useToast();
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    setBusy(true);
    setMessage(null);
    try {
      const result = await authService.forgotPassword(email.trim());
      setMessage(result.message);
      setSent(true);
      toast.success("Request recorded", "Check your account for the next step.");
    } catch (err) {
      setMessage(err instanceof Error ? err.message : "We could not process that request");
    } finally {
      setBusy(false);
    }
  };

  return (
    <AuthLayout
      title="Reset your password"
      subtitle="Tell us the email on your Campora account and we will record a reset request."
      footer={
        <p>
          Remembered it? <Link to="/login">Back to log in</Link>
        </p>
      }
    >
      <form className="form-stack" onSubmit={submit} noValidate>
        <label className="field">
          <span className="field__label">Email address</span>
          <input
            type="email"
            required
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            placeholder="you@campus.edu"
            autoComplete="email"
          />
        </label>

        <button type="submit" className="btn btn--primary btn--block btn--lg" disabled={busy || sent}>
          {busy ? <Spinner size={16} /> : <KeyRound size={17} aria-hidden="true" />}
          {busy ? "Recording request…" : "Send reset request"}
        </button>

        {message ? (
          <p className="form-alert form-alert--info" role="status">
            <MailCheck size={15} aria-hidden="true" />
            {message}
          </p>
        ) : null}

        {sent ? (
          <p className="form-note">
            This local build does not send email. You can change your password any time from{" "}
            <Link to="/account/settings">account settings</Link>.
          </p>
        ) : null}
      </form>
    </AuthLayout>
  );
}

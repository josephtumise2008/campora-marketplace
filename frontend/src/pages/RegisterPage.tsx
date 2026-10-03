import { useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { Eye, EyeOff, GraduationCap, UserPlus } from "lucide-react";
import { AuthLayout } from "../layouts/AuthLayout";
import { useAuth } from "../context/AuthContext";
import { useToast } from "../context/ToastContext";
import { useUniversity } from "../context/UniversityContext";
import { Spinner } from "../components/ui/Feedback";

export default function RegisterPage() {
  const { register } = useAuth();
  const toast = useToast();
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const { universities, university } = useUniversity();

  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
    confirm: "",
    phone: "",
    university: university?.code || "",
  });
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const update = (key: keyof typeof form) => (event: { target: { value: string } }) =>
    setForm((current) => ({ ...current, [key]: event.target.value }));

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    setError(null);

    if (form.password.length < 8) {
      setError("Choose a password with at least 8 characters");
      return;
    }
    if (form.password !== form.confirm) {
      setError("Both passwords need to match");
      return;
    }

    setBusy(true);
    try {
      const user = await register({
        name: form.name.trim(),
        email: form.email.trim(),
        password: form.password,
        phone: form.phone.trim(),
        university: form.university,
      });
      toast.success(`Welcome to Campora, ${user.name.split(" ")[0]}`);
      const redirect = params.get("redirect");
      navigate(redirect || "/account", { replace: true });
    } catch (err) {
      setError(err instanceof Error ? err.message : "We could not create your account");
    } finally {
      setBusy(false);
    }
  };

  return (
    <AuthLayout
      title="Create your account"
      subtitle="Join the marketplace your campus already uses. It takes under a minute."
      footer={
        <p>
          Already have an account? <Link to="/login">Log in instead</Link>
        </p>
      }
    >
      <form className="form-stack" onSubmit={submit} noValidate>
        {error ? (
          <p className="form-alert" role="alert">
            {error}
          </p>
        ) : null}

        <label className="field">
          <span className="field__label">Full name</span>
          <input
            type="text"
            required
            value={form.name}
            onChange={update("name")}
            placeholder="Alex Rivera"
            autoComplete="name"
          />
        </label>

        <label className="field">
          <span className="field__label">Campus email</span>
          <input
            type="email"
            required
            value={form.email}
            onChange={update("email")}
            placeholder="you@campus.edu"
            autoComplete="email"
          />
          <span className="field__hint">
            Any email works in this local build — but campus emails sort first on your profile.
          </span>
        </label>

        <label className="field">
          <span className="field__label">Your campus</span>
          <span className="field__with-icon">
            <GraduationCap size={16} aria-hidden="true" />
            <select value={form.university} onChange={update("university")} required>
              <option value="">Select your campus</option>
              {universities.map((entry) => (
                <option key={entry.code} value={entry.code}>
                  {entry.name} — {entry.city}, {entry.state}
                </option>
              ))}
              <option value="other">Other / not listed</option>
            </select>
          </span>
        </label>

        <label className="field">
          <span className="field__label">Phone (optional)</span>
          <input
            type="tel"
            value={form.phone}
            onChange={update("phone")}
            placeholder="(555) 010-2030"
            autoComplete="tel"
          />
          <span className="field__hint">Couriers use this when they arrive.</span>
        </label>

        <label className="field">
          <span className="field__label">Password</span>
          <span className="field__with-action">
            <input
              type={showPassword ? "text" : "password"}
              required
              value={form.password}
              onChange={update("password")}
              placeholder="At least 8 characters"
              autoComplete="new-password"
            />
            <button
              type="button"
              onClick={() => setShowPassword((value) => !value)}
              aria-label={showPassword ? "Hide password" : "Show password"}
            >
              {showPassword ? <EyeOff size={16} aria-hidden="true" /> : <Eye size={16} aria-hidden="true" />}
            </button>
          </span>
        </label>

        <label className="field">
          <span className="field__label">Confirm password</span>
          <input
            type={showPassword ? "text" : "password"}
            required
            value={form.confirm}
            onChange={update("confirm")}
            placeholder="Type it again"
            autoComplete="new-password"
          />
        </label>

        <label className="checkbox">
          <input type="checkbox" required defaultChecked />
          <span>
            I agree to the <Link to="/terms">terms of service</Link> and{" "}
            <Link to="/privacy">privacy policy</Link>.
          </span>
        </label>

        <button type="submit" className="btn btn--primary btn--block btn--lg" disabled={busy}>
          {busy ? <Spinner size={16} /> : <UserPlus size={17} aria-hidden="true" />}
          {busy ? "Creating your account…" : "Create account"}
        </button>

        <p className="form-note">
          Want to sell instead? <Link to="/sell">Start a seller application</Link> — it unlocks the
          store dashboard once approved.
        </p>
      </form>
    </AuthLayout>
  );
}

import { useState } from "react";
import { Link, useLocation, useNavigate, useSearchParams } from "react-router-dom";
import { Eye, EyeOff, LogIn } from "lucide-react";
import { AuthLayout } from "../layouts/AuthLayout";
import { useAuth } from "../context/AuthContext";
import { useToast } from "../context/ToastContext";
import { Spinner } from "../components/ui/Feedback";

const DEMO_ACCOUNTS = [
  { role: "Customer", email: "student@campora.market", detail: "Shop, order and track deliveries" },
  { role: "Seller", email: "seller@campora.market", detail: "Campus Grocery Co. dashboard" },
  { role: "Seller", email: "seller3@campora.market", detail: "ByteTech dashboard" },
  { role: "Admin", email: "admin@campora.market", detail: "Full marketplace admin" },
];

export default function LoginPage() {
  const { login } = useAuth();
  const toast = useToast();
  const navigate = useNavigate();
  const location = useLocation();
  const [params] = useSearchParams();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [remember, setRemember] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const redirect = params.get("redirect") || (location.state as { from?: string })?.from || null;

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    setError(null);
    setBusy(true);
    try {
      const user = await login(email.trim(), password);
      toast.success(`Welcome back, ${user.name.split(" ")[0]}`);
      if (redirect) {
        navigate(redirect, { replace: true });
        return;
      }
      if (user.role === "admin") navigate("/admin", { replace: true });
      else if (user.role === "seller") navigate("/seller", { replace: true });
      else navigate("/account", { replace: true });
    } catch (err) {
      setError(err instanceof Error ? err.message : "We could not log you in");
    } finally {
      setBusy(false);
    }
  };

  const signInAsDemo = async (demoEmail: string) => {
    setEmail(demoEmail);
    setPassword("campora123");
    setError(null);
    setBusy(true);
    try {
      const user = await login(demoEmail, "campora123");
      toast.success(`Signed in as ${user.name}`);
      if (user.role === "admin") navigate("/admin", { replace: true });
      else if (user.role === "seller") navigate("/seller", { replace: true });
      else navigate("/account", { replace: true });
    } catch (err) {
      setError(err instanceof Error ? err.message : "We could not log you in");
    } finally {
      setBusy(false);
    }
  };

  return (
    <AuthLayout
      title="Welcome back"
      subtitle="Log in to track orders, save favourites and manage your campus store."
      footer={
        <p>
          New to Campora? <Link to="/register">Create an account</Link>
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

        <label className="field">
          <span className="field__label">Password</span>
          <span className="field__with-action">
            <input
              type={showPassword ? "text" : "password"}
              required
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              placeholder="Your password"
              autoComplete="current-password"
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

        <div className="form-row">
          <label className="switch">
            <input
              type="checkbox"
              checked={remember}
              onChange={(event) => setRemember(event.target.checked)}
            />
            <span>Keep me logged in</span>
          </label>
          <Link to="/forgot-password" className="link-plain">
            Forgot password?
          </Link>
        </div>

        <button type="submit" className="btn btn--primary btn--block btn--lg" disabled={busy}>
          {busy ? <Spinner size={16} /> : <LogIn size={17} aria-hidden="true" />}
          {busy ? "Logging in…" : "Log in"}
        </button>

        {remember ? <span className="sr-only">Your session is kept on this device</span> : null}
      </form>

      <div className="demo-accounts">
        <p className="demo-accounts__title">
          Demo accounts · password <span className="demo-accounts__password">campora123</span>
        </p>
        <ul>
          {DEMO_ACCOUNTS.map((account) => (
            <li key={account.email}>
              <button type="button" onClick={() => signInAsDemo(account.email)} disabled={busy}>
                <span className="demo-accounts__role">{account.role}</span>
                <span className="demo-accounts__email">{account.email}</span>
                <span className="demo-accounts__detail">{account.detail}</span>
              </button>
            </li>
          ))}
        </ul>
      </div>
    </AuthLayout>
  );
}

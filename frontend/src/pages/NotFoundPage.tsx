import { Link } from "react-router-dom";
import { Compass, Home, Search } from "lucide-react";

const SUGGESTIONS = [
  { to: "/explore", label: "Explore products" },
  { to: "/stores", label: "Browse campus stores" },
  { to: "/deals", label: "Today's deals" },
  { to: "/help", label: "Help centre" },
];

export default function NotFoundPage() {
  return (
    <div className="container page not-found">
      <span className="not-found__code" aria-hidden="true">
        404
      </span>
      <h1>This aisle is empty</h1>
      <p>
        The page you were looking for is not on the Campora map. It may have moved, or the link might be
        older than this semester.
      </p>
      <div className="not-found__actions">
        <Link to="/" className="btn btn--primary">
          <Home size={16} aria-hidden="true" />
          Back to home
        </Link>
        <Link to="/explore" className="btn btn--ghost">
          <Compass size={16} aria-hidden="true" />
          Start exploring
        </Link>
      </div>

      <div className="not-found__suggestions">
        <p className="not-found__suggestions-title">
          <Search size={14} aria-hidden="true" /> Popular destinations
        </p>
        <ul>
          {SUGGESTIONS.map((entry) => (
            <li key={entry.to}>
              <Link to={entry.to}>{entry.label}</Link>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}

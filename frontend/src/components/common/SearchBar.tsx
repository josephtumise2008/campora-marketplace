import { useEffect, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Clock3, Search, Store as StoreIcon, Tag, X } from "lucide-react";
import { marketplaceService, type SearchResult } from "../../services/marketplace";
import { currency, cx } from "../../utils/format";
import { useDebounced, useClickOutside } from "../../hooks/useAsync";
import { SmartImage } from "../ui/SmartImage";
import { userService } from "../../services/marketplace";
import { useAuth } from "../../context/AuthContext";
import { STORAGE_KEYS, readStorage, writeStorage } from "../../utils/format";

const TYPE_ICON = {
  product: Tag,
  store: StoreIcon,
  category: Tag,
} as const;

const POPULAR = [
  "Coffee",
  "Meal prep",
  "Notebooks",
  "Headphones",
  "Dorm storage",
  "Study lamp",
  "Protein",
  "Phone charger",
];

interface SearchBarProps {
  variant?: "header" | "hero" | "page";
  autoFocus?: boolean;
  initialValue?: string;
  /** Receives the trimmed term the shopper submitted. */
  onSubmitted?: (term: string) => void;
}

export function SearchBar({ variant = "header", autoFocus, initialValue = "", onSubmitted }: SearchBarProps) {
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();
  const wrapper = useRef<HTMLDivElement>(null);
  const [term, setTerm] = useState(initialValue);
  const [open, setOpen] = useState(false);
  const [results, setResults] = useState<SearchResult | null>(null);
  const [localSearches, setLocalSearches] = useState<string[]>(() =>
    readStorage<string[]>(STORAGE_KEYS.searchHistory, [])
  );
  const debounced = useDebounced(term, 260);

  useClickOutside(wrapper, () => setOpen(false));

  // Keep the visible term in sync with the `initialValue` prop without an
  // effect, so typing is never interrupted by a re-render.
  const [lastInitial, setLastInitial] = useState(initialValue);
  if (lastInitial !== initialValue) {
    setLastInitial(initialValue);
    setTerm(initialValue);
  }

  useEffect(() => {
    if (!debounced.trim()) return undefined;
    let active = true;
    marketplaceService
      .search(debounced.trim(), "all", 6)
      .then((data) => {
        if (active) setResults(data);
      })
      .catch(() => {
        if (active) setResults(null);
      });
    return () => {
      active = false;
    };
  }, [debounced]);

  const remember = (value: string) => {
    const next = [value, ...localSearches.filter((entry) => entry.toLowerCase() !== value.toLowerCase())].slice(0, 6);
    setLocalSearches(next);
    writeStorage(STORAGE_KEYS.searchHistory, next);
    if (isAuthenticated) void userService.pushSearch(value).catch(() => undefined);
  };

  const submit = (value: string) => {
    const cleaned = value.trim();
    if (!cleaned) return;
    remember(cleaned);
    setOpen(false);
    onSubmitted?.(cleaned);
    navigate(`/explore?q=${encodeURIComponent(cleaned)}`);
  };

  // Results are ignored while the box is empty rather than cleared imperatively.
  const suggestions = debounced.trim() ? results?.suggestions ?? [] : [];
  const showPanel = open && (term.trim().length > 0 || localSearches.length > 0);
  const listId = "campora-search-suggestions";

  return (
    <div className={cx("search", `search--${variant}`)} ref={wrapper}>
      <form
        className="search__form"
        role="search"
        onSubmit={(event) => {
          event.preventDefault();
          submit(term);
        }}
      >
        <label className="sr-only" htmlFor={`${listId}-input`}>
          Search products, stores and categories
        </label>
        <Search className="search__icon" size={18} aria-hidden="true" />
        <input
          id={`${listId}-input`}
          className="search__input"
          type="search"
          value={term}
          placeholder={
            variant === "hero"
              ? "Search coffee, textbooks, chargers, meal prep…"
              : "Search Campora"
          }
          autoComplete="off"
          autoFocus={autoFocus}
          aria-expanded={showPanel}
          aria-controls={listId}
          role="combobox"
          aria-autocomplete="list"
          onFocus={() => setOpen(true)}
          onChange={(event) => {
            setTerm(event.target.value);
            setOpen(true);
          }}
        />
        {term ? (
          <button
            type="button"
            className="search__clear"
            onClick={() => {
              setTerm("");
              setResults(null);
            }}
            aria-label="Clear search"
          >
            <X size={15} aria-hidden="true" />
          </button>
        ) : null}
        <button type="submit" className="search__submit btn btn--primary btn--sm">
          Search
        </button>
      </form>

      <AnimatePresence>
        {showPanel ? (
          <motion.div
            className="search__panel"
            id={listId}
            role="listbox"
            initial={{ opacity: 0, y: -6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            transition={{ duration: 0.16 }}
          >
            {!term.trim() ? (
              <div className="search__section">
                <p className="search__section-title">
                  <Clock3 size={13} aria-hidden="true" /> Recent searches
                </p>
                <div className="search__chips">
                  {localSearches.map((entry) => (
                    <button key={entry} type="button" className="search__chip" onClick={() => submit(entry)}>
                      {entry}
                    </button>
                  ))}
                </div>
                <p className="search__section-title search__section-title--spaced">Popular on campus</p>
                <div className="search__chips">
                  {POPULAR.map((entry) => (
                    <button key={entry} type="button" className="search__chip" onClick={() => submit(entry)}>
                      {entry}
                    </button>
                  ))}
                </div>
              </div>
            ) : suggestions.length > 0 ? (
              <ul className="search__results">
                {suggestions.map((entry) => {
                  const Icon = TYPE_ICON[entry.type] || Tag;
                  return (
                    <li key={`${entry.type}-${entry.id}`}>
                      <Link
                        to={entry.href}
                        className="search__result"
                        role="option"
                        onClick={() => {
                          remember(term.trim());
                          setOpen(false);
                          onSubmitted?.(term.trim());
                        }}
                      >
                        <SmartImage
                          src={entry.image}
                          alt={entry.label}
                          ratio="square"
                          fallbackLabel={entry.label}
                        />
                        <span className="search__result-text">
                          <span className="search__result-label">
                            <Icon size={12} aria-hidden="true" /> {entry.label}
                          </span>
                          <span className="search__result-sub">{entry.sublabel}</span>
                        </span>
                        {typeof entry.price === "number" ? (
                          <span className="search__result-price">{currency(entry.price)}</span>
                        ) : null}
                      </Link>
                    </li>
                  );
                })}
                <li className="search__all">
                  <button type="button" onClick={() => submit(term)}>
                    See all results for “{term.trim()}”
                  </button>
                </li>
              </ul>
            ) : (
              <div className="search__section">
                <p className="search__section-title">No matches yet</p>
                <p className="search__empty">
                  Try a broader term, or browse{" "}
                  <Link to="/explore" onClick={() => setOpen(false)}>
                    all products
                  </Link>
                  .
                </p>
              </div>
            )}
          </motion.div>
        ) : null}
      </AnimatePresence>
    </div>
  );
}

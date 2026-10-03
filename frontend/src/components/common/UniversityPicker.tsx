import { useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Check, GraduationCap, Loader2, MapPin } from "lucide-react";
import { useUniversity } from "../../context/UniversityContext";
import { useClickOutside } from "../../hooks/useAsync";
import { cx } from "../../utils/format";

export function UniversityPicker({ compact = false }: { compact?: boolean }) {
  const { university, universities, setUniversity, loading } = useUniversity();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  useClickOutside(ref, () => setOpen(false));

  return (
    <div className={cx("campus-picker", compact && "campus-picker--compact")} ref={ref}>
      <button
        type="button"
        className="campus-picker__trigger"
        onClick={() => setOpen((value) => !value)}
        aria-expanded={open}
        aria-haspopup="listbox"
      >
        <span className="campus-picker__icon" aria-hidden="true">
          <GraduationCap size={16} />
        </span>
        <span className="campus-picker__text">
          <em>Shopping at</em>
          <strong>{loading ? "Loading…" : university?.shortName || "Choose campus"}</strong>
        </span>
      </button>

      <AnimatePresence>
        {open ? (
          <motion.div
            className="campus-picker__panel"
            role="listbox"
            aria-label="Choose your campus"
            initial={{ opacity: 0, y: -6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            transition={{ duration: 0.16 }}
          >
            <p className="campus-picker__title">Which campus are you on?</p>
            <p className="campus-picker__hint">
              We use this to show stores that deliver to your dorm or apartment.
            </p>
            <ul>
              {universities.map((entry) => {
                const active = entry.code === university?.code;
                return (
                  <li key={entry.code}>
                    <button
                      type="button"
                      role="option"
                      aria-selected={active}
                      className={cx("campus-picker__option", active && "is-active")}
                      onClick={() => {
                        setUniversity(entry.code);
                        setOpen(false);
                      }}
                    >
                      <span className="campus-picker__option-text">
                        <strong>{entry.name}</strong>
                        <em>
                          <MapPin size={11} aria-hidden="true" /> {entry.city}, {entry.state}
                          {entry.storeCount ? ` · ${entry.storeCount} stores` : ""}
                        </em>
                      </span>
                      {active ? <Check size={16} aria-hidden="true" /> : null}
                    </button>
                  </li>
                );
              })}
            </ul>
            {loading ? (
              <p className="campus-picker__loading">
                <Loader2 size={13} className="spinner" aria-hidden="true" /> Loading campuses…
              </p>
            ) : null}
          </motion.div>
        ) : null}
      </AnimatePresence>
    </div>
  );
}

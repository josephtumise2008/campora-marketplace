import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { marketplaceService } from "../services/marketplace";
import { STORAGE_KEYS, readStorage, writeStorage } from "../utils/format";
import type { MarketplaceConfig, University } from "../types";

interface UniversityContextValue {
  university: University | null;
  universities: University[];
  setUniversity: (code: string) => void;
  loading: boolean;
  config: MarketplaceConfig | null;
  campusLabel: string;
  shortLabel: string;
}

const UniversityContext = createContext<UniversityContextValue | null>(null);

const DEFAULT_CODE = "ucla";

export function UniversityProvider({ children }: { children: ReactNode }) {
  const [universities, setUniversities] = useState<University[]>([]);
  const [selectedCode, setSelectedCode] = useState<string>(
    () => readStorage<string>(STORAGE_KEYS.university, DEFAULT_CODE)
  );
  const [config, setConfig] = useState<MarketplaceConfig | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    (async () => {
      try {
        const [list, cfg] = await Promise.all([
          marketplaceService.universities(),
          marketplaceService.config(),
        ]);
        if (!active) return;
        setUniversities(list);
        setConfig(cfg);
      } catch {
        if (active) setUniversities([]);
      } finally {
        if (active) setLoading(false);
      }
    })();
    return () => {
      active = false;
    };
  }, []);

  const university = useMemo(
    () => universities.find((item) => item.code === selectedCode) || universities[0] || null,
    [universities, selectedCode]
  );

  const setUniversity = useCallback((code: string) => {
    setSelectedCode(code);
    writeStorage(STORAGE_KEYS.university, code);
  }, []);

  const value = useMemo<UniversityContextValue>(
    () => ({
      university,
      universities,
      setUniversity,
      loading,
      config,
      campusLabel: university?.shortName || "your campus",
      shortLabel: university?.shortName || "Campus",
    }),
    [university, universities, setUniversity, loading, config]
  );

  return <UniversityContext.Provider value={value}>{children}</UniversityContext.Provider>;
}

export function useUniversity() {
  const context = useContext(UniversityContext);
  if (!context) throw new Error("useUniversity must be used inside UniversityProvider");
  return context;
}

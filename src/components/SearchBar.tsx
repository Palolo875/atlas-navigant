import { useState, useRef, useEffect, useCallback } from "react";
import { HugeiconsIcon } from "@hugeicons/react";
import { Search01Icon, Cancel01Icon, Location01Icon } from "@hugeicons/core-free-icons";
import { searchPhoton, type GeoResult } from "@/lib/api";

interface SearchBarProps {
  onSelect: (result: GeoResult) => void;
}

export default function SearchBar({ onSelect }: SearchBarProps) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<GeoResult[]>([]);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [focused, setFocused] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout>>();
  const containerRef = useRef<HTMLDivElement>(null);

  const doSearch = useCallback(async (q: string) => {
    if (q.length < 2) {
      setResults([]);
      return;
    }
    setLoading(true);
    try {
      const r = await searchPhoton(q);
      setResults(r);
      setOpen(true);
    } catch {
      setResults([]);
    } finally {
      setLoading(false);
    }
  }, []);

  const handleChange = (val: string) => {
    setQuery(val);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => doSearch(val), 350);
  };

  const handleSelect = (r: GeoResult) => {
    setQuery(r.name);
    setOpen(false);
    setResults([]);
    onSelect(r);
  };

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  return (
    <div ref={containerRef} className="absolute top-5 left-4 right-4 z-10 max-w-md mx-auto">
      {/* Label éditorial */}
      <div className="text-label text-muted-foreground/80 mb-1.5 px-1">
        Recherche
      </div>

      {/* Champ — pas de card, juste hairline qui s'illumine */}
      <div
        className="relative bg-card/85 backdrop-blur-[2px] rounded-xl px-3.5 py-3 transition-all duration-300"
        style={{
          boxShadow: focused ? "var(--shadow-soft)" : "var(--shadow-whisper)",
          border: `1px solid hsl(var(--border) / ${focused ? "0.9" : "0.5"})`,
        }}
      >
        <div className="flex items-center gap-2.5">
          <HugeiconsIcon
            icon={Search01Icon}
            size={17}
            className={`flex-shrink-0 transition-colors ${focused ? "text-foreground" : "text-muted-foreground"}`}
          />
          <input
            type="text"
            value={query}
            onChange={(e) => handleChange(e.target.value)}
            onFocus={() => setFocused(true)}
            onBlur={() => setFocused(false)}
            placeholder="Une ville, un lieu, un point sur la carte…"
            className="search-input flex-1 bg-transparent text-[14px] text-foreground placeholder:text-muted-foreground/70 outline-none"
          />
          {loading && (
            <div className="w-3.5 h-3.5 border-[1.5px] border-border border-t-foreground rounded-full animate-spin flex-shrink-0" />
          )}
          {query && !loading && (
            <button
              onClick={() => { setQuery(""); setResults([]); setOpen(false); }}
              className="flex-shrink-0 opacity-60 hover:opacity-100 transition-opacity"
              aria-label="Effacer"
            >
              <HugeiconsIcon icon={Cancel01Icon} size={15} className="text-muted-foreground" />
            </button>
          )}
        </div>
      </div>

      {/* Résultats — liste éditoriale, pas une grille */}
      {open && results.length > 0 && (
        <div
          className="absolute top-full mt-2 left-0 right-0 bg-card rounded-xl overflow-hidden animate-fade-in-up"
          style={{
            boxShadow: "var(--shadow-lifted)",
            border: "1px solid hsl(var(--border) / 0.5)",
          }}
        >
          {results.map((r, i) => (
            <button
              key={`${r.lat}-${r.lon}-${i}`}
              onClick={() => handleSelect(r)}
              className="w-full flex items-baseline gap-3 px-4 py-3 text-left hover:bg-secondary/50 transition-colors hairline-b last:border-b-0"
              style={{ borderBottomColor: "hsl(var(--border) / 0.5)" }}
            >
              <HugeiconsIcon icon={Location01Icon} size={13} className="text-muted-foreground/60 flex-shrink-0 translate-y-[2px]" />
              <div className="min-w-0 flex-1">
                <div className="text-[14px] font-medium text-foreground truncate leading-tight">{r.name}</div>
                <div className="text-meta text-muted-foreground/80 truncate mt-1">
                  {[r.state, r.country].filter(Boolean).join(" · ")}
                  {r.type && (
                    <span className="ml-2 text-muted-foreground/60">— {r.type}</span>
                  )}
                </div>
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

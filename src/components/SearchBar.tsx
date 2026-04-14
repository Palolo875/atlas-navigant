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

  // Close on outside click
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
    <div ref={containerRef} className="absolute top-4 left-4 right-4 z-10 max-w-md mx-auto">
      <div className="relative">
        <div className="flex items-center bg-card border border-border rounded-lg px-3 py-2.5 gap-2"
          style={{ boxShadow: "0 2px 12px rgba(0,0,0,0.06)" }}>
          <HugeiconsIcon icon={Search01Icon} size={18} className="text-muted-foreground flex-shrink-0" />
          <input
            type="text"
            value={query}
            onChange={(e) => handleChange(e.target.value)}
            placeholder="Rechercher un lieu, une ville, un pays..."
            className="search-input flex-1 bg-transparent text-sm text-foreground placeholder:text-muted-foreground outline-none"
          />
          {query && (
            <button onClick={() => { setQuery(""); setResults([]); setOpen(false); }}>
              <HugeiconsIcon icon={Cancel01Icon} size={16} className="text-muted-foreground" />
            </button>
          )}
        </div>

        {open && results.length > 0 && (
          <div className="absolute top-full mt-1 left-0 right-0 bg-card border border-border rounded-lg overflow-hidden"
            style={{ boxShadow: "0 4px 16px rgba(0,0,0,0.08)" }}>
            {results.map((r, i) => (
              <button
                key={`${r.lat}-${r.lon}-${i}`}
                onClick={() => handleSelect(r)}
                className="w-full flex items-start gap-3 px-4 py-3 text-left hover:bg-secondary transition-colors border-b border-border last:border-b-0"
              >
                <HugeiconsIcon icon={Location01Icon} size={16} className="text-muted-foreground mt-0.5 flex-shrink-0" />
                <div className="min-w-0">
                  <div className="text-sm font-medium text-foreground truncate">{r.name}</div>
                  <div className="text-xs text-muted-foreground truncate">
                    {[r.state, r.country].filter(Boolean).join(", ")}
                    {r.type && (
                      <span className="ml-2 inline-block px-1.5 py-0.5 rounded text-[10px] uppercase tracking-wide bg-secondary font-medium">
                        {r.type}
                      </span>
                    )}
                  </div>
                </div>
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

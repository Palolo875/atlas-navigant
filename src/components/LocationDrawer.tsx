import { useState, useEffect, useMemo } from "react";
import { Drawer } from "vaul";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  Navigation01Icon,
  ArrowRight01Icon,
  InformationCircleIcon,
  Sun01Icon,
  Globe02Icon,
  Location01Icon,
  Alert01Icon,
  Leaf01Icon,
  ArrowDown01Icon,
  ArrowUp01Icon,
  Clock01Icon,
} from "@hugeicons/core-free-icons";
import {
  type GeoResult,
  type WeatherData,
  type AirQualityData,
  type CountryData,
  type WikiData,
  type OverpassPOI,
  type EarthquakeData,
  type GBIFSpecies,
  fetchWeather,
  fetchAirQuality,
  fetchCountry,
  fetchWikipedia,
  fetchNearbyPOIs,
  fetchEarthquakes,
  fetchGBIF,
  weatherCodeToLabel,
  getAQILabel,
  getUVLabel,
  windDirectionToLabel,
  generateNarrative,
} from "@/lib/api";

interface LocationDrawerProps {
  location: GeoResult | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

type TabId = "weather" | "air" | "culture" | "wiki" | "nearby" | "nature";

const TABS: { id: TabId; label: string; icon: any }[] = [
  { id: "weather", label: "Meteo", icon: Sun01Icon },
  { id: "air", label: "Air", icon: Leaf01Icon },
  { id: "culture", label: "Culture", icon: Globe02Icon },
  { id: "wiki", label: "Savoir", icon: InformationCircleIcon },
  { id: "nearby", label: "Proximite", icon: Location01Icon },
  { id: "nature", label: "Nature", icon: Leaf01Icon },
];

export default function LocationDrawer({ location, open, onOpenChange }: LocationDrawerProps) {
  const [activeTab, setActiveTab] = useState<TabId>("weather");
  const [weather, setWeather] = useState<WeatherData | null>(null);
  const [airQuality, setAirQuality] = useState<AirQualityData | null>(null);
  const [country, setCountry] = useState<CountryData | null>(null);
  const [wiki, setWiki] = useState<WikiData | null>(null);
  const [pois, setPOIs] = useState<OverpassPOI[]>([]);
  const [earthquakes, setEarthquakes] = useState<EarthquakeData[]>([]);
  const [species, setSpecies] = useState<GBIFSpecies[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!location) return;
    setLoading(true);
    setWeather(null);
    setAirQuality(null);
    setCountry(null);
    setWiki(null);
    setPOIs([]);
    setEarthquakes([]);
    setSpecies([]);
    setActiveTab("weather");

    const { lat, lon } = location;

    Promise.allSettled([
      fetchWeather(lat, lon).then(setWeather),
      fetchAirQuality(lat, lon).then(setAirQuality),
      location.country ? fetchCountry(location.country).then(setCountry) : Promise.resolve(),
      fetchWikipedia(location.name).then(setWiki),
      fetchNearbyPOIs(lat, lon, 800).then(setPOIs),
      fetchEarthquakes(lat, lon).then(setEarthquakes),
      fetchGBIF(lat, lon).then(setSpecies),
    ]).finally(() => setLoading(false));
  }, [location]);

  if (!location) return null;

  const narratives = weather ? generateNarrative(weather, airQuality, weather.elevation) : [];
  const wInfo = weather ? weatherCodeToLabel(weather.current.weatherCode) : null;

  const handleNavigate = () => {
    window.open(
      `geo:${location.lat},${location.lon}?q=${location.lat},${location.lon}(${encodeURIComponent(location.name)})`,
      "_blank"
    );
  };

  return (
    <Drawer.Root open={open} onOpenChange={onOpenChange} snapPoints={[0.4, 0.94]} activeSnapPoint={undefined}>
      <Drawer.Portal>
        <Drawer.Overlay className="fixed inset-0 bg-foreground/5 z-40" />
        <Drawer.Content className="fixed bottom-0 left-0 right-0 z-50 flex flex-col rounded-t-2xl bg-card max-h-[94vh]" style={{ boxShadow: "0 -4px 40px rgba(0,0,0,0.08)" }}>
          {/* Handle */}
          <div className="flex justify-center pt-3 pb-2">
            <div className="w-9 h-[3px] rounded-full bg-border" />
          </div>

          {/* Hero Header */}
          <div className="px-5 pb-4">
            {/* Location name + navigate */}
            <div className="flex items-start justify-between gap-3 mb-1">
              <div className="min-w-0 flex-1">
                <h2 className="font-serif text-xl font-semibold text-foreground leading-[1.1] tracking-tight">
                  {location.name}
                </h2>
                <div className="flex items-center gap-1.5 mt-1">
                  <span className="text-xs text-muted-foreground leading-tight">
                    {[location.state, location.country].filter(Boolean).join(", ")}
                  </span>
                  {location.type && (
                    <span className="inline-block px-1.5 py-[1px] rounded bg-secondary text-[9px] uppercase tracking-[0.08em] font-medium text-muted-foreground">
                      {location.type}
                    </span>
                  )}
                </div>
              </div>
              <button
                onClick={handleNavigate}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-primary text-primary-foreground text-[11px] font-medium hover:bg-primary/90 transition-colors flex-shrink-0"
                style={{ borderRadius: "6px" }}
              >
                <HugeiconsIcon icon={Navigation01Icon} size={13} />
                Naviguer
              </button>
            </div>

            {/* Hero weather strip */}
            {weather && wInfo && (
              <div className="flex items-end gap-4 mt-4 pb-3 border-b border-border">
                <div className="flex items-baseline gap-1">
                  <span className="font-serif text-[42px] font-semibold leading-none tracking-tighter text-foreground">
                    {Math.round(weather.current.temperature)}
                  </span>
                  <span className="text-lg text-muted-foreground font-light">&deg;C</span>
                </div>
                <div className="flex flex-col gap-0.5 pb-1 flex-1 min-w-0">
                  <span className="text-sm font-medium text-foreground leading-tight">{wInfo.label}</span>
                  <span className="text-[11px] text-muted-foreground leading-tight">
                    Ressenti {Math.round(weather.current.feelsLike)}&deg; · {weather.current.windSpeed} km/h {windDirectionToLabel(weather.current.windDirection)}
                  </span>
                  <span className="text-[10px] text-muted-foreground font-mono mt-0.5">
                    {location.lat.toFixed(4)}, {location.lon.toFixed(4)} · {Math.round(weather.elevation)}m
                  </span>
                </div>
                {airQuality && (
                  <div className="flex-shrink-0 pb-1">
                    <AQIBadge aqi={airQuality.aqi} />
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Tabs — icon + text, pill style */}
          <div className="px-4 pb-2">
            <div className="flex gap-1.5 overflow-x-auto hide-scrollbar">
              {TABS.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center gap-1.5 px-3 py-[7px] rounded-lg text-[11px] font-medium whitespace-nowrap transition-all ${
                    activeTab === tab.id
                      ? "bg-foreground text-primary-foreground"
                      : "bg-secondary/60 text-muted-foreground hover:bg-secondary"
                  }`}
                >
                  <HugeiconsIcon icon={tab.icon} size={13} />
                  {tab.label}
                </button>
              ))}
            </div>
          </div>

          <div className="w-full h-px bg-border" />

          {/* Content */}
          <div className="flex-1 overflow-y-auto hide-scrollbar px-5 py-4">
            {loading && !weather ? (
              <LoadingSpinner />
            ) : (
              <>
                {activeTab === "weather" && weather && (
                  <WeatherTab weather={weather} narratives={narratives} />
                )}
                {activeTab === "air" && <AirTab airQuality={airQuality} />}
                {activeTab === "culture" && <CultureTab country={country} location={location} />}
                {activeTab === "wiki" && <WikiTab wiki={wiki} location={location} />}
                {activeTab === "nearby" && (
                  <NearbyTab pois={pois} earthquakes={earthquakes} location={location} />
                )}
                {activeTab === "nature" && <NatureTab species={species} location={location} />}
              </>
            )}
            {/* Bottom safe area */}
            <div className="h-6" />
          </div>
        </Drawer.Content>
      </Drawer.Portal>
    </Drawer.Root>
  );
}

// ====== SHARED COMPONENTS ======

function LoadingSpinner() {
  return (
    <div className="flex flex-col items-center justify-center py-16 gap-3">
      <div className="w-5 h-5 border-2 border-border border-t-foreground rounded-full animate-spin" />
      <span className="text-[11px] text-muted-foreground">Chargement des donnees</span>
    </div>
  );
}

function SectionCard({ children, className = "", style }: { children: React.ReactNode; className?: string; style?: React.CSSProperties }) {
  return (
    <div className={`border border-border rounded-xl p-4 mb-3 bg-card ${className}`} style={style}>
      {children}
    </div>
  );
}

function Tag({ children, variant = "blue" }: { children: React.ReactNode; variant?: "blue" | "green" | "yellow" | "red" | "purple" }) {
  const styles = {
    blue: "bg-pastel-blue-bg text-pastel-blue-text",
    green: "bg-pastel-green-bg text-pastel-green-text",
    yellow: "bg-pastel-yellow-bg text-pastel-yellow-text",
    red: "bg-pastel-red-bg text-pastel-red-text",
    purple: "bg-pastel-purple-bg text-pastel-purple-text",
  };
  return (
    <span className={`inline-block px-2.5 py-[3px] rounded-full text-[9px] uppercase tracking-[0.06em] font-semibold ${styles[variant]}`}>
      {children}
    </span>
  );
}

function DataRow({ label, value, mono = false }: { label: string; value: string | number; mono?: boolean }) {
  return (
    <div className="flex items-center justify-between py-2 border-b border-border last:border-b-0">
      <span className="text-[11px] text-muted-foreground">{label}</span>
      <span className={`text-[12px] font-medium text-right max-w-[55%] ${mono ? "font-mono text-[11px]" : ""}`}>{value}</span>
    </div>
  );
}

function NarrativeBlock({ text, icon }: { text: string; icon?: any }) {
  return (
    <div className="flex items-start gap-3 py-2.5 border-b border-border last:border-b-0">
      <div className="w-6 h-6 rounded-lg bg-secondary flex items-center justify-center flex-shrink-0 mt-0.5">
        <HugeiconsIcon icon={icon || InformationCircleIcon} size={13} className="text-muted-foreground" />
      </div>
      <p className="text-[11.5px] leading-[1.6] text-foreground">{text}</p>
    </div>
  );
}

function SectionTitle({ children, sub }: { children: React.ReactNode; sub?: string }) {
  return (
    <div className="mb-3">
      <div className="text-[10px] text-muted-foreground uppercase tracking-[0.08em] font-semibold">{children}</div>
      {sub && <div className="text-[10px] text-muted-foreground mt-0.5">{sub}</div>}
    </div>
  );
}

function AQIBadge({ aqi }: { aqi: number }) {
  const info = getAQILabel(aqi);
  const colorMap = {
    green: "bg-pastel-green-bg text-pastel-green-text",
    yellow: "bg-pastel-yellow-bg text-pastel-yellow-text",
    red: "bg-pastel-red-bg text-pastel-red-text",
    purple: "bg-pastel-purple-bg text-pastel-purple-text",
  };
  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[10px] font-semibold uppercase tracking-wider ${colorMap[info.color]}`}>
      <span className="w-1.5 h-1.5 rounded-full bg-current opacity-60" />
      AQI {aqi}
    </span>
  );
}

function EmptyState({ text }: { text: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-12 gap-2">
      <div className="w-10 h-10 rounded-xl bg-secondary flex items-center justify-center">
        <HugeiconsIcon icon={InformationCircleIcon} size={18} className="text-muted-foreground" />
      </div>
      <p className="text-[11px] text-muted-foreground text-center max-w-[220px] leading-relaxed">{text}</p>
    </div>
  );
}

// ====== WEATHER TAB ======

function WeatherTab({ weather, narratives }: { weather: WeatherData; narratives: string[] }) {
  const todaySunrise = weather.daily[0]?.sunrise;
  const todaySunset = weather.daily[0]?.sunset;
  const uvInfo = getUVLabel(weather.current.uvIndex);

  return (
    <div className="space-y-3">
      {/* Narratives */}
      {narratives.length > 0 && (
        <SectionCard className="animate-fade-in-up">
          <div className="flex items-center gap-2 mb-3">
            <Tag variant="blue">Signal</Tag>
            <span className="text-[10px] text-muted-foreground tracking-wide">Analyse contextuelle</span>
          </div>
          {narratives.map((n, i) => (
            <NarrativeBlock key={i} text={n} icon={Alert01Icon} />
          ))}
        </SectionCard>
      )}

      {/* Conditions bento grid */}
      <SectionCard className="animate-fade-in-up" style={{ animationDelay: "60ms" }}>
        <SectionTitle>Conditions actuelles</SectionTitle>
        <div className="grid grid-cols-2 gap-2">
          <MiniStat label="Humidite" value={`${weather.current.humidity}%`} accent={weather.current.humidity > 80} />
          <MiniStat label="Pression" value={`${Math.round(weather.current.pressure)} hPa`} />
          <MiniStat label="Vent" value={`${weather.current.windSpeed} km/h`} sub={windDirectionToLabel(weather.current.windDirection)} accent={weather.current.windSpeed > 30} />
          <MiniStat label="Nuages" value={`${weather.current.cloudCover}%`} />
          <MiniStat label="Precipitations" value={`${weather.current.precipitation} mm`} accent={weather.current.precipitation > 0} />
          <MiniStat
            label="Visibilite"
            value={weather.current.visibility >= 1000
              ? `${(weather.current.visibility / 1000).toFixed(1)} km`
              : `${weather.current.visibility} m`}
            accent={weather.current.visibility < 2000}
          />
        </div>
      </SectionCard>

      {/* UV + Altitude — horizontal duo */}
      <div className="grid grid-cols-2 gap-2 animate-fade-in-up" style={{ animationDelay: "120ms" }}>
        <SectionCard className="!mb-0">
          <div className="text-[9px] text-muted-foreground uppercase tracking-[0.08em] font-medium mb-1">Indice UV</div>
          <div className="text-2xl font-serif font-semibold leading-none">{weather.current.uvIndex}</div>
          <div className="mt-1.5">
            <Tag variant={weather.current.uvIndex > 6 ? "red" : weather.current.uvIndex > 3 ? "yellow" : "green"}>{uvInfo.label}</Tag>
          </div>
          <div className="text-[10px] text-muted-foreground mt-2 leading-relaxed">{uvInfo.signal}</div>
        </SectionCard>
        <SectionCard className="!mb-0">
          <div className="text-[9px] text-muted-foreground uppercase tracking-[0.08em] font-medium mb-1">Altitude</div>
          <div className="text-2xl font-serif font-semibold leading-none">{Math.round(weather.elevation)}<span className="text-sm font-normal text-muted-foreground ml-0.5">m</span></div>
          <div className="mt-1.5">
            <Tag variant={weather.elevation > 2500 ? "red" : weather.elevation > 1000 ? "yellow" : "green"}>
              {weather.elevation > 2500 ? "Haute alt." : weather.elevation > 1000 ? "Montagne" : "Plaine"}
            </Tag>
          </div>
          {weather.elevation > 2500 && (
            <div className="text-[10px] text-muted-foreground mt-2 leading-relaxed">Oxygene reduit. Hydratez-vous.</div>
          )}
        </SectionCard>
      </div>

      {/* Ephemerides */}
      {todaySunrise && (
        <SectionCard className="animate-fade-in-up" style={{ animationDelay: "180ms" }}>
          <SectionTitle>Ephemerides</SectionTitle>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-pastel-yellow-bg flex items-center justify-center">
                <HugeiconsIcon icon={ArrowUp01Icon} size={15} className="text-pastel-yellow-text" />
              </div>
              <div>
                <div className="text-[9px] text-muted-foreground uppercase tracking-wide">Lever</div>
                <div className="text-sm font-mono font-semibold">
                  {new Date(todaySunrise).toLocaleTimeString("fr", { hour: "2-digit", minute: "2-digit" })}
                </div>
              </div>
            </div>

            {/* Day duration center */}
            <div className="text-center px-2">
              {(() => {
                const rise = new Date(todaySunrise).getTime();
                const set = new Date(todaySunset).getTime();
                const h = Math.floor((set - rise) / 3600000);
                const m = Math.floor(((set - rise) % 3600000) / 60000);
                return (
                  <>
                    <div className="text-[9px] text-muted-foreground uppercase tracking-wide">Duree</div>
                    <div className="text-xs font-mono font-semibold">{h}h{m.toString().padStart(2, "0")}</div>
                  </>
                );
              })()}
            </div>

            <div className="flex items-center gap-2.5">
              <div>
                <div className="text-[9px] text-muted-foreground uppercase tracking-wide text-right">Coucher</div>
                <div className="text-sm font-mono font-semibold">
                  {new Date(todaySunset).toLocaleTimeString("fr", { hour: "2-digit", minute: "2-digit" })}
                </div>
              </div>
              <div className="w-8 h-8 rounded-lg bg-pastel-red-bg flex items-center justify-center">
                <HugeiconsIcon icon={ArrowDown01Icon} size={15} className="text-pastel-red-text" />
              </div>
            </div>
          </div>
        </SectionCard>
      )}

      {/* Hourly scroll */}
      <SectionCard className="animate-fade-in-up" style={{ animationDelay: "240ms" }}>
        <SectionTitle>Prochaines heures</SectionTitle>
        <div className="flex gap-1 overflow-x-auto hide-scrollbar pb-1 -mx-1">
          {weather.hourly.slice(0, 12).map((h, i) => {
            const hInfo = weatherCodeToLabel(h.weatherCode);
            return (
              <div key={i} className="flex flex-col items-center gap-1.5 min-w-[52px] py-2 px-1.5 rounded-lg hover:bg-secondary/50 transition-colors">
                <span className="text-[10px] text-muted-foreground font-mono">
                  {new Date(h.time).toLocaleTimeString("fr", { hour: "2-digit", minute: "2-digit" })}
                </span>
                <span className="text-[15px] leading-none">{getWeatherSymbol(h.weatherCode)}</span>
                <span className="text-xs font-semibold">{Math.round(h.temperature)}&deg;</span>
                {h.precipitation > 0 && (
                  <span className="text-[9px] text-pastel-blue-text font-mono leading-none">{h.precipitation}mm</span>
                )}
              </div>
            );
          })}
        </div>
      </SectionCard>

      {/* 7-day */}
      <SectionCard className="animate-fade-in-up" style={{ animationDelay: "300ms" }}>
        <SectionTitle>Previsions 7 jours</SectionTitle>
        {weather.daily.map((d, i) => {
          const dayInfo = weatherCodeToLabel(d.weatherCode);
          const allMin = Math.min(...weather.daily.map((x) => x.tempMin));
          const allMax = Math.max(...weather.daily.map((x) => x.tempMax));
          const range = allMax - allMin || 1;
          return (
            <div key={i} className="flex items-center py-2.5 border-b border-border last:border-b-0 gap-2">
              <span className="text-[11px] font-medium w-[44px] flex-shrink-0">
                {i === 0 ? "Auj." : new Date(d.date).toLocaleDateString("fr", { weekday: "short" })}
              </span>
              <span className="text-[14px] w-5 text-center flex-shrink-0">{getWeatherSymbol(d.weatherCode)}</span>
              {d.precipitationSum > 0 ? (
                <span className="text-[9px] text-pastel-blue-text font-mono w-[34px] text-right flex-shrink-0">{d.precipitationSum.toFixed(1)}mm</span>
              ) : (
                <span className="w-[34px] flex-shrink-0" />
              )}
              <div className="flex gap-1.5 items-center flex-1 justify-end">
                <span className="text-[10px] font-mono text-muted-foreground w-[22px] text-right">{Math.round(d.tempMin)}&deg;</span>
                <div className="w-14 h-[5px] bg-secondary rounded-full relative overflow-hidden">
                  <div
                    className="absolute h-full bg-foreground/70 rounded-full"
                    style={{
                      left: `${((d.tempMin - allMin) / range) * 100}%`,
                      right: `${100 - ((d.tempMax - allMin) / range) * 100}%`,
                    }}
                  />
                </div>
                <span className="text-[10px] font-mono font-semibold w-[22px]">{Math.round(d.tempMax)}&deg;</span>
              </div>
            </div>
          );
        })}
      </SectionCard>
    </div>
  );
}

function MiniStat({ label, value, sub, accent = false }: { label: string; value: string; sub?: string; accent?: boolean }) {
  return (
    <div className={`rounded-xl p-3 ${accent ? "bg-pastel-yellow-bg/50" : "bg-secondary/40"}`}>
      <div className="text-[9px] text-muted-foreground uppercase tracking-[0.06em] font-medium">{label}</div>
      <div className="text-[13px] font-semibold mt-1 font-mono leading-tight">{value}</div>
      {sub && <div className="text-[9px] text-muted-foreground mt-0.5">{sub}</div>}
    </div>
  );
}

/** Minimal text-based weather symbols (no emoji) */
function getWeatherSymbol(code: number): string {
  if (code === 0 || code === 1) return "\u2600"; // sun ☀
  if (code === 2) return "\u26C5"; // sun behind cloud ⛅
  if (code === 3) return "\u2601"; // cloud ☁
  if (code === 45 || code === 48) return "\u2588"; // fog block
  if (code >= 51 && code <= 55) return "\u2022"; // drizzle dot
  if (code >= 61 && code <= 65) return "\u2602"; // rain ☂
  if (code >= 71 && code <= 75) return "\u2744"; // snow ❄
  if (code >= 80 && code <= 82) return "\u2602";
  if (code >= 95) return "\u26A1"; // lightning ⚡
  return "\u2601";
}

// ====== AIR TAB ======

function AirTab({ airQuality }: { airQuality: AirQualityData | null }) {
  if (!airQuality) return <EmptyState text="Chargement des donnees de qualite de l'air..." />;

  const aqInfo = getAQILabel(airQuality.aqi);

  const pollutants = [
    { key: "PM2.5", value: airQuality.pm25, unit: "\u00B5g/m\u00B3", desc: "Particules fines respirables", threshold: 25 },
    { key: "PM10", value: airQuality.pm10, unit: "\u00B5g/m\u00B3", desc: "Particules en suspension", threshold: 50 },
    { key: "NO\u2082", value: airQuality.no2, unit: "\u00B5g/m\u00B3", desc: "Dioxyde d'azote, trafic routier", threshold: 200 },
    { key: "O\u2083", value: airQuality.ozone, unit: "\u00B5g/m\u00B3", desc: "Ozone tropospherique", threshold: 180 },
    { key: "SO\u2082", value: airQuality.so2, unit: "\u00B5g/m\u00B3", desc: "Dioxyde de soufre, industrie", threshold: 350 },
    { key: "CO", value: airQuality.co, unit: "\u00B5g/m\u00B3", desc: "Monoxyde de carbone", threshold: 10000 },
  ];

  return (
    <div className="space-y-3">
      {/* Hero AQI */}
      <SectionCard className="animate-fade-in-up">
        <div className="flex items-center gap-4 mb-3">
          <div className="flex flex-col items-center">
            <div className="text-3xl font-serif font-semibold leading-none">{airQuality.aqi}</div>
            <div className="text-[9px] text-muted-foreground uppercase tracking-wide mt-1">AQI EU</div>
          </div>
          <div className="flex-1">
            <Tag variant={aqInfo.color}>{aqInfo.label}</Tag>
            <p className="text-[11px] leading-[1.6] text-muted-foreground mt-2">{aqInfo.signal}</p>
          </div>
        </div>
      </SectionCard>

      {/* Pollutants */}
      <SectionCard className="animate-fade-in-up" style={{ animationDelay: "60ms" }}>
        <SectionTitle>Polluants</SectionTitle>
        {pollutants.map((p) => {
          const ratio = p.value / p.threshold;
          const color = ratio > 0.7 ? "hsl(var(--pastel-red-text))" : ratio > 0.4 ? "hsl(var(--pastel-yellow-text))" : "hsl(var(--pastel-green-text))";
          return (
            <div key={p.key} className="py-2.5 border-b border-border last:border-b-0">
              <div className="flex items-center justify-between mb-1">
                <div className="flex items-center gap-2">
                  <span className="text-[11px] font-semibold">{p.key}</span>
                  <span className="text-[9px] text-muted-foreground">{p.desc}</span>
                </div>
                <span className="text-[11px] font-mono font-medium">{p.value.toFixed(1)}</span>
              </div>
              <div className="w-full h-[5px] bg-secondary rounded-full overflow-hidden">
                <div
                  className="h-full rounded-full transition-all duration-500"
                  style={{
                    width: `${Math.min(ratio * 100, 100)}%`,
                    backgroundColor: color,
                  }}
                />
              </div>
            </div>
          );
        })}
      </SectionCard>
    </div>
  );
}

// ====== CULTURE TAB ======

function CultureTab({ country, location }: { country: CountryData | null; location: GeoResult }) {
  if (!country) return <EmptyState text="Donnees culturelles indisponibles pour cette position." />;

  const langText = country.languages.join(", ");
  const currText = country.currencies.map((c) => `${c.name} (${c.symbol})`).join(", ");

  return (
    <div className="space-y-3">
      {/* Narrative */}
      <SectionCard className="animate-fade-in-up">
        <div className="flex items-center gap-2 mb-3">
          <Tag variant="purple">Identite culturelle</Tag>
        </div>
        <NarrativeBlock text={`Parlez ${langText}. Prevoyez vos ${currText}.`} icon={Globe02Icon} />
        {country.callingCode && (
          <NarrativeBlock text={`Indicatif telephonique : ${country.callingCode}. Fuseaux : ${country.timezones.slice(0, 3).join(", ")}${country.timezones.length > 3 ? "..." : ""}.`} icon={Clock01Icon} />
        )}
      </SectionCard>

      {/* Country card */}
      <SectionCard className="animate-fade-in-up" style={{ animationDelay: "60ms" }}>
        <div className="flex items-center gap-3 mb-4">
          {country.flag && (
            <img
              src={country.flag}
              alt={`Drapeau ${country.name}`}
              className="w-14 h-10 object-cover rounded-lg border border-border"
              loading="lazy"
            />
          )}
          <div>
            <div className="text-sm font-serif font-semibold leading-tight">{country.name}</div>
            <div className="text-[10px] text-muted-foreground">{country.officialName}</div>
          </div>
        </div>
        <DataRow label="Capitale" value={country.capital} />
        <DataRow label="Region" value={`${country.subregion}, ${country.region}`} />
        <DataRow label="Population" value={country.population.toLocaleString("fr")} mono />
        <DataRow label="Superficie" value={`${country.area.toLocaleString("fr")} km\u00B2`} mono />
        <DataRow label="Langues" value={langText} />
        <DataRow label="Monnaie" value={currText} />
      </SectionCard>

      {/* Density */}
      <SectionCard className="animate-fade-in-up" style={{ animationDelay: "120ms" }}>
        <SectionTitle>Densite</SectionTitle>
        <div className="text-2xl font-serif font-semibold mb-1">
          {Math.round(country.population / country.area)} <span className="text-sm font-normal text-muted-foreground">hab/km\u00B2</span>
        </div>
        <div className="text-[10px] text-muted-foreground leading-relaxed mt-2">
          {country.population / country.area > 200
            ? "Zone a forte densite. Affluence probable dans les transports et lieux publics."
            : country.population / country.area > 50
            ? "Densite moderee. Equilibre entre espaces urbains et naturels."
            : "Faible densite. Grands espaces et tranquillite."}
        </div>
      </SectionCard>
    </div>
  );
}

// ====== WIKI TAB ======

function WikiTab({ wiki, location }: { wiki: WikiData | null; location: GeoResult }) {
  if (!wiki) return <EmptyState text="Aucun article encyclopedique trouve pour ce lieu." />;

  return (
    <div className="space-y-3">
      <SectionCard className="animate-fade-in-up">
        {wiki.thumbnail && (
          <div className="-mx-4 -mt-4 mb-4">
            <img
              src={wiki.thumbnail}
              alt={wiki.title}
              className="w-full h-48 object-cover rounded-t-xl"
              loading="lazy"
            />
          </div>
        )}
        <div className="flex items-center gap-2 mb-3">
          <Tag variant="yellow">Encyclopedie</Tag>
          <span className="text-[10px] text-muted-foreground">Wikipedia</span>
        </div>
        <h3 className="font-serif text-lg font-semibold mb-2 leading-tight tracking-tight">{wiki.title}</h3>
        <p className="text-[11.5px] leading-[1.7] text-muted-foreground">{wiki.extract}</p>
        {wiki.url && (
          <a
            href={wiki.url}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 mt-4 text-[11px] font-semibold text-foreground hover:opacity-60 transition-opacity"
          >
            Lire l'article complet
            <HugeiconsIcon icon={ArrowRight01Icon} size={12} />
          </a>
        )}
      </SectionCard>

      {/* Climate zone */}
      <SectionCard className="animate-fade-in-up" style={{ animationDelay: "60ms" }}>
        <SectionTitle>Zone climatique</SectionTitle>
        <DataRow label="Latitude" value={location.lat.toFixed(6)} mono />
        <DataRow label="Longitude" value={location.lon.toFixed(6)} mono />
        <div className="mt-3 px-3 py-2.5 rounded-lg bg-secondary/50">
          <div className="text-[10px] text-muted-foreground leading-relaxed">
            {Math.abs(location.lat) > 60
              ? "Position en zone polaire. Temperatures extremes et duree de jour variable."
              : Math.abs(location.lat) > 35
              ? "Zone temperee. Quatre saisons distinctes."
              : Math.abs(location.lat) > 23.5
              ? "Zone subtropicale. Climat chaud, saisons humides et seches."
              : "Zone tropicale. Chaleur constante et humidite elevee."}
          </div>
        </div>
      </SectionCard>
    </div>
  );
}

// ====== NEARBY TAB ======

const POI_LABELS: Record<string, string> = {
  hospital: "Hopital",
  pharmacy: "Pharmacie",
  restaurant: "Restaurant",
  cafe: "Cafe",
  bank: "Banque",
  fuel: "Station-service",
  school: "Ecole",
  library: "Bibliotheque",
  hotel: "Hotel",
  museum: "Musee",
  viewpoint: "Point de vue",
  attraction: "Attraction",
  supermarket: "Supermarche",
  convenience: "Epicerie",
  stop_position: "Arret transport",
  station: "Gare",
  police: "Police",
  fire_station: "Pompiers",
  post_office: "Bureau de poste",
  information: "Office de tourisme",
};

function NearbyTab({ pois, earthquakes, location }: { pois: OverpassPOI[]; earthquakes: EarthquakeData[]; location: GeoResult }) {
  const nearestTransport = pois.find((p) => p.type === "stop_position" || p.type === "station");

  return (
    <div className="space-y-3">
      {/* Transport narrative */}
      {nearestTransport && (
        <SectionCard className="animate-fade-in-up">
          <div className="flex items-center gap-2 mb-2">
            <Tag variant="blue">Mobilite</Tag>
          </div>
          <NarrativeBlock
            text={`Station "${nearestTransport.name}" detectee a ${nearestTransport.distance}m. Transport public accessible a pied.`}
            icon={Location01Icon}
          />
        </SectionCard>
      )}

      {pois.length > 0 ? (
        <SectionCard className="animate-fade-in-up" style={{ animationDelay: "60ms" }}>
          <SectionTitle sub="Rayon de 800m">Services a proximite ({pois.length})</SectionTitle>
          {pois.map((poi) => (
            <div key={poi.id} className="flex items-center justify-between py-2.5 border-b border-border last:border-b-0">
              <div className="min-w-0 flex-1">
                <div className="text-[11.5px] font-medium truncate">{poi.name}</div>
                <div className="flex items-center gap-1.5 mt-0.5">
                  <span className="text-[9px] px-1.5 py-[1px] rounded bg-secondary text-muted-foreground uppercase tracking-wide font-medium">
                    {POI_LABELS[poi.type] || poi.type}
                  </span>
                  {poi.distance !== undefined && (
                    <span className="text-[10px] text-muted-foreground font-mono">{poi.distance}m</span>
                  )}
                </div>
              </div>
              <button
                onClick={() =>
                  window.open(
                    `geo:${poi.lat},${poi.lon}?q=${poi.lat},${poi.lon}(${encodeURIComponent(poi.name)})`,
                    "_blank"
                  )
                }
                className="w-7 h-7 rounded-lg bg-secondary flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors flex-shrink-0 ml-2"
              >
                <HugeiconsIcon icon={Navigation01Icon} size={13} />
              </button>
            </div>
          ))}
        </SectionCard>
      ) : (
        <EmptyState text="Aucun service detecte dans un rayon de 800m." />
      )}

      {/* Seismic */}
      {earthquakes.length > 0 && (
        <SectionCard className="animate-fade-in-up" style={{ animationDelay: "120ms" }}>
          <div className="flex items-center gap-2 mb-3">
            <Tag variant="red">Sismique</Tag>
            <span className="text-[10px] text-muted-foreground">Rayon 300km</span>
          </div>
          <NarrativeBlock
            text={`${earthquakes.length} evenement${earthquakes.length > 1 ? "s" : ""} sismique${earthquakes.length > 1 ? "s" : ""}. Magnitude max : M${Math.max(...earthquakes.map((e) => e.magnitude)).toFixed(1)}.`}
            icon={Alert01Icon}
          />
          <div className="mt-2">
            {earthquakes.map((eq, i) => (
              <div key={i} className="flex items-start gap-2.5 py-2.5 border-b border-border last:border-b-0">
                <span className="text-[10px] font-mono font-semibold bg-pastel-red-bg text-pastel-red-text px-2 py-0.5 rounded-lg mt-0.5 flex-shrink-0">
                  M{eq.magnitude.toFixed(1)}
                </span>
                <div className="min-w-0 flex-1">
                  <div className="text-[11px] font-medium leading-tight">{eq.place}</div>
                  <div className="text-[10px] text-muted-foreground mt-0.5">
                    Prof. {eq.depth.toFixed(0)}km · {new Date(eq.time).toLocaleDateString("fr", { day: "numeric", month: "short", year: "numeric" })}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </SectionCard>
      )}
    </div>
  );
}

// ====== NATURE TAB ======

function NatureTab({ species, location }: { species: GBIFSpecies[]; location: GeoResult }) {
  const kingdoms = useMemo(() => {
    const k: Record<string, number> = {};
    species.forEach((s) => {
      const key = s.kingdom || "Inconnu";
      k[key] = (k[key] || 0) + 1;
    });
    return k;
  }, [species]);

  if (species.length === 0) return <EmptyState text="Aucune observation d'especes recensee dans cette zone." />;

  return (
    <div className="space-y-3">
      <SectionCard className="animate-fade-in-up">
        <div className="flex items-center gap-2 mb-3">
          <Tag variant="green">Biodiversite locale</Tag>
          <span className="text-[10px] text-muted-foreground">GBIF</span>
        </div>
        <NarrativeBlock
          text={`${species.length} espece${species.length > 1 ? "s" : ""} observee${species.length > 1 ? "s" : ""} dans un rayon de 5km. ${Object.entries(kingdoms).map(([k, v]) => `${v} ${k}`).join(", ")}.`}
          icon={Leaf01Icon}
        />

        {/* Kingdom pills */}
        <div className="flex flex-wrap gap-1.5 mt-3">
          {Object.entries(kingdoms).map(([k, v]) => (
            <span key={k} className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-pastel-green-bg text-pastel-green-text text-[9px] font-semibold uppercase tracking-wide">
              {k} <span className="opacity-60">{v}</span>
            </span>
          ))}
        </div>
      </SectionCard>

      <SectionCard className="animate-fade-in-up" style={{ animationDelay: "60ms" }}>
        <SectionTitle>Especes observees</SectionTitle>
        {species.map((sp, i) => (
          <div key={i} className="py-2.5 border-b border-border last:border-b-0">
            <div className="text-[11.5px] font-medium">{sp.name}</div>
            <div className="text-[10px] text-muted-foreground italic mt-0.5">{sp.scientificName}</div>
            <div className="flex items-center gap-2 mt-1.5">
              {sp.kingdom && (
                <span className="text-[8px] px-1.5 py-[2px] rounded bg-pastel-green-bg text-pastel-green-text uppercase tracking-wider font-semibold">
                  {sp.kingdom}
                </span>
              )}
              {sp.phylum && (
                <span className="text-[9px] text-muted-foreground">{sp.phylum}</span>
              )}
            </div>
          </div>
        ))}
      </SectionCard>
    </div>
  );
}

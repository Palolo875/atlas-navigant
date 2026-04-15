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
  type WikimediaImage,
  type OverpassPOI,
  type EarthquakeData,
  type EONETEvent,
  type ReliefWebAlert,
  type GBIFSpecies,
  fetchWeather,
  fetchAirQuality,
  fetchCountry,
  fetchWikipedia,
  fetchWikimediaImages,
  fetchNearbyPOIs,
  fetchEarthquakes,
  fetchEONET,
  fetchReliefWeb,
  fetchGBIF,
  weatherCodeToLabel,
  getAQILabel,
  getUVLabel,
  getDewPointComfort,
  getPollenLevel,
  windDirectionToLabel,
  generateNarrative,
  getEONETCategoryInfo,
} from "@/lib/api";

interface LocationDrawerProps {
  location: GeoResult | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

type TabId = "weather" | "air" | "alerts" | "culture" | "wiki" | "nearby" | "nature";

const TABS: { id: TabId; label: string; icon: any }[] = [
  { id: "weather", label: "Meteo", icon: Sun01Icon },
  { id: "air", label: "Air", icon: Leaf01Icon },
  { id: "alerts", label: "Alertes", icon: Alert01Icon },
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
  const [wikiImages, setWikiImages] = useState<WikimediaImage[]>([]);
  const [pois, setPOIs] = useState<OverpassPOI[]>([]);
  const [earthquakes, setEarthquakes] = useState<EarthquakeData[]>([]);
  const [eonetEvents, setEonetEvents] = useState<EONETEvent[]>([]);
  const [reliefAlerts, setReliefAlerts] = useState<ReliefWebAlert[]>([]);
  const [species, setSpecies] = useState<GBIFSpecies[]>([]);
  const [loading, setLoading] = useState(false);

  // Alert count for badge
  const alertCount = useMemo(() => earthquakes.length + eonetEvents.length + reliefAlerts.length, [earthquakes, eonetEvents, reliefAlerts]);

  useEffect(() => {
    if (!location) return;
    setLoading(true);
    setWeather(null);
    setAirQuality(null);
    setCountry(null);
    setWiki(null);
    setWikiImages([]);
    setPOIs([]);
    setEarthquakes([]);
    setEonetEvents([]);
    setReliefAlerts([]);
    setSpecies([]);
    setActiveTab("weather");

    const { lat, lon } = location;

    Promise.allSettled([
      fetchWeather(lat, lon).then(setWeather),
      fetchAirQuality(lat, lon).then(setAirQuality),
      location.country ? fetchCountry(location.country).then(setCountry) : Promise.resolve(),
      fetchWikipedia(location.name).then(setWiki),
      fetchWikimediaImages(lat, lon).then(setWikiImages),
      fetchNearbyPOIs(lat, lon, 800).then(setPOIs),
      fetchEarthquakes(lat, lon).then(setEarthquakes),
      fetchEONET(lat, lon, 500).then(setEonetEvents),
      location.country ? fetchReliefWeb(location.country).then(setReliefAlerts) : Promise.resolve(),
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

          {/* Tabs */}
          <div className="px-4 pb-2">
            <div className="flex gap-1.5 overflow-x-auto hide-scrollbar">
              {TABS.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`relative flex items-center gap-1.5 px-3 py-[7px] rounded-lg text-[11px] font-medium whitespace-nowrap transition-all ${
                    activeTab === tab.id
                      ? "bg-foreground text-primary-foreground"
                      : "bg-secondary/60 text-muted-foreground hover:bg-secondary"
                  }`}
                >
                  <HugeiconsIcon icon={tab.icon} size={13} />
                  {tab.label}
                  {tab.id === "alerts" && alertCount > 0 && (
                    <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-pastel-red-text text-primary-foreground text-[8px] font-bold flex items-center justify-center">
                      {alertCount > 9 ? "9+" : alertCount}
                    </span>
                  )}
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
                {activeTab === "alerts" && (
                  <AlertsTab earthquakes={earthquakes} eonetEvents={eonetEvents} reliefAlerts={reliefAlerts} location={location} />
                )}
                {activeTab === "culture" && <CultureTab country={country} location={location} />}
                {activeTab === "wiki" && <WikiTab wiki={wiki} wikiImages={wikiImages} location={location} />}
                {activeTab === "nearby" && (
                  <NearbyTab pois={pois} location={location} />
                )}
                {activeTab === "nature" && <NatureTab species={species} location={location} />}
              </>
            )}
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

function ProgressBar({ value, max, color }: { value: number; max: number; color: string }) {
  const ratio = Math.min(value / max, 1);
  return (
    <div className="w-full h-[5px] bg-secondary rounded-full overflow-hidden">
      <div className="h-full rounded-full transition-all duration-500" style={{ width: `${ratio * 100}%`, backgroundColor: color }} />
    </div>
  );
}

// ====== WEATHER TAB (enriched) ======

function WeatherTab({ weather, narratives }: { weather: WeatherData; narratives: string[] }) {
  const todaySunrise = weather.daily[0]?.sunrise;
  const todaySunset = weather.daily[0]?.sunset;
  const uvInfo = getUVLabel(weather.current.uvIndex);
  const dpInfo = getDewPointComfort(weather.current.dewPoint);

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
        <div className="grid grid-cols-3 gap-2">
          <MiniStat label="Humidite" value={`${weather.current.humidity}%`} accent={weather.current.humidity > 80} />
          <MiniStat label="Pression" value={`${Math.round(weather.current.pressure)} hPa`} accent={weather.current.pressure < 1000} />
          <MiniStat label="Nuages" value={`${weather.current.cloudCover}%`} />
          <MiniStat label="Vent" value={`${weather.current.windSpeed} km/h`} sub={windDirectionToLabel(weather.current.windDirection)} accent={weather.current.windSpeed > 30} />
          <MiniStat label="Rafales" value={`${weather.current.windGusts} km/h`} accent={weather.current.windGusts > 50} />
          <MiniStat label="Precipitations" value={`${weather.current.precipitation} mm`} accent={weather.current.precipitation > 0} />
          <MiniStat
            label="Visibilite"
            value={weather.current.visibility >= 1000
              ? `${(weather.current.visibility / 1000).toFixed(1)} km`
              : `${weather.current.visibility} m`}
            accent={weather.current.visibility < 2000}
          />
          <MiniStat label="Point de rosee" value={`${weather.current.dewPoint.toFixed(0)}°C`} sub={dpInfo.label} accent={weather.current.dewPoint >= 18} />
          <MiniStat label="Altitude" value={`${Math.round(weather.elevation)}m`} sub={weather.elevation > 2500 ? "Haute alt." : weather.elevation > 1000 ? "Montagne" : "Plaine"} />
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
          <div className="text-[9px] text-muted-foreground uppercase tracking-[0.08em] font-medium mb-1">Confort humidite</div>
          <div className="text-2xl font-serif font-semibold leading-none">{weather.current.dewPoint.toFixed(0)}<span className="text-sm font-normal text-muted-foreground ml-0.5">&deg;C</span></div>
          <div className="mt-1.5">
            <Tag variant={weather.current.dewPoint >= 21 ? "red" : weather.current.dewPoint >= 16 ? "yellow" : "green"}>{dpInfo.label}</Tag>
          </div>
          <div className="text-[10px] text-muted-foreground mt-2 leading-relaxed">{dpInfo.signal}</div>
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

      {/* Hourly scroll (enriched) */}
      <SectionCard className="animate-fade-in-up" style={{ animationDelay: "240ms" }}>
        <SectionTitle>Prochaines heures</SectionTitle>
        <div className="flex gap-1 overflow-x-auto hide-scrollbar pb-1 -mx-1">
          {weather.hourly.slice(0, 12).map((h, i) => (
            <div key={i} className="flex flex-col items-center gap-1 min-w-[56px] py-2 px-1 rounded-lg hover:bg-secondary/50 transition-colors">
              <span className="text-[10px] text-muted-foreground font-mono">
                {new Date(h.time).toLocaleTimeString("fr", { hour: "2-digit", minute: "2-digit" })}
              </span>
              <span className="text-[15px] leading-none">{getWeatherSymbol(h.weatherCode)}</span>
              <span className="text-xs font-semibold">{Math.round(h.temperature)}&deg;</span>
              <span className="text-[9px] text-muted-foreground">{Math.round(h.feelsLike)}&deg;r</span>
              {h.precipitationProb > 0 && (
                <span className="text-[8px] text-pastel-blue-text font-mono leading-none">{h.precipitationProb}%</span>
              )}
              {h.precipitation > 0 && (
                <span className="text-[8px] text-pastel-blue-text font-mono leading-none">{h.precipitation}mm</span>
              )}
              <span className="text-[8px] text-muted-foreground">{h.windSpeed}<span className="opacity-60">km/h</span></span>
            </div>
          ))}
        </div>
      </SectionCard>

      {/* 7-day (enriched) */}
      <SectionCard className="animate-fade-in-up" style={{ animationDelay: "300ms" }}>
        <SectionTitle>Previsions 7 jours</SectionTitle>
        {weather.daily.map((d, i) => {
          const allMin = Math.min(...weather.daily.map((x) => x.tempMin));
          const allMax = Math.max(...weather.daily.map((x) => x.tempMax));
          const range = allMax - allMin || 1;
          return (
            <div key={i} className="flex items-center py-2.5 border-b border-border last:border-b-0 gap-1.5">
              <span className="text-[11px] font-medium w-[40px] flex-shrink-0">
                {i === 0 ? "Auj." : new Date(d.date).toLocaleDateString("fr", { weekday: "short" })}
              </span>
              <span className="text-[14px] w-5 text-center flex-shrink-0">{getWeatherSymbol(d.weatherCode)}</span>
              {d.precipitationProbMax > 0 ? (
                <span className="text-[8px] text-pastel-blue-text font-mono w-[28px] text-right flex-shrink-0">{d.precipitationProbMax}%</span>
              ) : (
                <span className="w-[28px] flex-shrink-0" />
              )}
              <div className="flex gap-1 items-center flex-1 justify-end">
                <span className="text-[10px] font-mono text-muted-foreground w-[22px] text-right">{Math.round(d.tempMin)}&deg;</span>
                <div className="w-12 h-[5px] bg-secondary rounded-full relative overflow-hidden">
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
              {d.windGustsMax > 40 && (
                <span className="text-[8px] text-pastel-red-text font-mono flex-shrink-0">{Math.round(d.windGustsMax)}r</span>
              )}
            </div>
          );
        })}
      </SectionCard>

      {/* Weekly summary */}
      <SectionCard className="animate-fade-in-up" style={{ animationDelay: "360ms" }}>
        <SectionTitle>Resume de la semaine</SectionTitle>
        {(() => {
          const totalPrecip = weather.daily.reduce((s, d) => s + d.precipitationSum, 0);
          const totalPrecipHours = weather.daily.reduce((s, d) => s + d.precipitationHours, 0);
          const maxGust = Math.max(...weather.daily.map(d => d.windGustsMax));
          const maxUV = Math.max(...weather.daily.map(d => d.uvIndexMax));
          const avgMax = weather.daily.reduce((s, d) => s + d.tempMax, 0) / weather.daily.length;
          const avgMin = weather.daily.reduce((s, d) => s + d.tempMin, 0) / weather.daily.length;
          return (
            <div className="grid grid-cols-2 gap-2">
              <MiniStat label="Temp. moy. max" value={`${avgMax.toFixed(1)}°C`} />
              <MiniStat label="Temp. moy. min" value={`${avgMin.toFixed(1)}°C`} />
              <MiniStat label="Cumul pluie" value={`${totalPrecip.toFixed(1)} mm`} sub={`${totalPrecipHours.toFixed(0)}h de pluie`} accent={totalPrecip > 20} />
              <MiniStat label="Rafales max" value={`${maxGust.toFixed(0)} km/h`} accent={maxGust > 60} />
              <MiniStat label="UV max semaine" value={maxUV.toString()} accent={maxUV > 6} />
              <MiniStat label="Amplitude" value={`${(Math.max(...weather.daily.map(d=>d.tempMax)) - Math.min(...weather.daily.map(d=>d.tempMin))).toFixed(1)}°C`} />
            </div>
          );
        })()}
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

function getWeatherSymbol(code: number): string {
  if (code === 0 || code === 1) return "\u2600";
  if (code === 2) return "\u26C5";
  if (code === 3) return "\u2601";
  if (code === 45 || code === 48) return "\u2588";
  if (code >= 51 && code <= 57) return "\u2022";
  if (code >= 61 && code <= 67) return "\u2602";
  if (code >= 71 && code <= 77) return "\u2744";
  if (code >= 80 && code <= 82) return "\u2602";
  if (code >= 85 && code <= 86) return "\u2744";
  if (code >= 95) return "\u26A1";
  return "\u2601";
}

// ====== AIR TAB (enriched with pollen + dust) ======

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
    { key: "Poussieres", value: airQuality.dust, unit: "\u00B5g/m\u00B3", desc: "Particules de sable et poussiere", threshold: 100 },
  ];

  const pollenData = [
    { key: "Aulne", value: airQuality.allergenIndex.alder },
    { key: "Bouleau", value: airQuality.allergenIndex.birch },
    { key: "Graminees", value: airQuality.allergenIndex.grass },
    { key: "Armoise", value: airQuality.allergenIndex.mugwort },
    { key: "Olivier", value: airQuality.allergenIndex.olive },
    { key: "Ambroisie", value: airQuality.allergenIndex.ragweed },
  ];

  const hasPollenData = pollenData.some(p => p.value > 0);

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
        {/* Narrative insights */}
        {airQuality.pm25 > 15 && (
          <NarrativeBlock text={`PM2.5 a ${airQuality.pm25.toFixed(1)} \u00B5g/m\u00B3. Ces particules fines penetrent profondement dans les poumons. Portez un masque FFP2 si exposition prolongee.`} icon={Alert01Icon} />
        )}
        {airQuality.ozone > 100 && (
          <NarrativeBlock text={`Ozone eleve (${airQuality.ozone.toFixed(0)} \u00B5g/m\u00B3). Evitez les activites physiques intenses en exterieur entre 12h et 18h.`} icon={Alert01Icon} />
        )}
        {airQuality.dust > 50 && (
          <NarrativeBlock text={`Concentration de poussieres importante (${airQuality.dust.toFixed(0)} \u00B5g/m\u00B3). Episode saharien probable. Protegez vos voies respiratoires.`} icon={Alert01Icon} />
        )}
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
              <ProgressBar value={p.value} max={p.threshold} color={color} />
            </div>
          );
        })}
      </SectionCard>

      {/* Pollen */}
      {hasPollenData && (
        <SectionCard className="animate-fade-in-up" style={{ animationDelay: "120ms" }}>
          <div className="flex items-center gap-2 mb-3">
            <Tag variant="yellow">Pollens</Tag>
            <span className="text-[10px] text-muted-foreground">Allergenes aeriens</span>
          </div>
          {pollenData.filter(p => p.value > 0).length === 0 ? (
            <p className="text-[11px] text-muted-foreground">Aucun pollen detecte actuellement.</p>
          ) : (
            <div className="grid grid-cols-3 gap-2">
              {pollenData.map((p) => {
                const info = getPollenLevel(p.value);
                return (
                  <div key={p.key} className={`rounded-xl p-2.5 ${p.value > 0 ? "bg-pastel-yellow-bg/40" : "bg-secondary/30"}`}>
                    <div className="text-[9px] text-muted-foreground uppercase tracking-wide font-medium">{p.key}</div>
                    <div className="text-[13px] font-mono font-semibold mt-1">{p.value}</div>
                    <Tag variant={info.color}>{info.label}</Tag>
                  </div>
                );
              })}
            </div>
          )}
          {pollenData.some(p => p.value >= 50) && (
            <NarrativeBlock text="Concentration de pollens elevee. Allergiques : limitez le temps en exterieur, gardez les fenetres fermees, douchez-vous en rentrant." icon={Alert01Icon} />
          )}
        </SectionCard>
      )}
    </div>
  );
}

// ====== ALERTS TAB (NEW — EONET + ReliefWeb + Earthquakes) ======

function AlertsTab({ earthquakes, eonetEvents, reliefAlerts, location }: {
  earthquakes: EarthquakeData[];
  eonetEvents: EONETEvent[];
  reliefAlerts: ReliefWebAlert[];
  location: GeoResult;
}) {
  const totalAlerts = earthquakes.length + eonetEvents.length + reliefAlerts.length;

  if (totalAlerts === 0) {
    return <EmptyState text="Aucune alerte environnementale ou sismique detectee dans cette zone. Conditions calmes." />;
  }

  return (
    <div className="space-y-3">
      {/* Summary */}
      <SectionCard className="animate-fade-in-up">
        <div className="flex items-center gap-2 mb-3">
          <Tag variant="red">Alertes</Tag>
          <span className="text-[10px] text-muted-foreground">{totalAlerts} evenement{totalAlerts > 1 ? "s" : ""} detecte{totalAlerts > 1 ? "s" : ""}</span>
        </div>
        <NarrativeBlock
          text={`${earthquakes.length > 0 ? `${earthquakes.length} seisme${earthquakes.length > 1 ? "s" : ""} (rayon 300km). ` : ""}${eonetEvents.length > 0 ? `${eonetEvents.length} evenement${eonetEvents.length > 1 ? "s" : ""} naturel${eonetEvents.length > 1 ? "s" : ""} NASA. ` : ""}${reliefAlerts.length > 0 ? `${reliefAlerts.length} alerte${reliefAlerts.length > 1 ? "s" : ""} humanitaire${reliefAlerts.length > 1 ? "s" : ""}.` : ""}`}
          icon={Alert01Icon}
        />
      </SectionCard>

      {/* EONET Natural Events */}
      {eonetEvents.length > 0 && (
        <SectionCard className="animate-fade-in-up" style={{ animationDelay: "60ms" }}>
          <div className="flex items-center gap-2 mb-3">
            <Tag variant="purple">NASA EONET</Tag>
            <span className="text-[10px] text-muted-foreground">Evenements naturels actifs</span>
          </div>
          {eonetEvents.map((evt) => {
            const catInfo = getEONETCategoryInfo(evt.category);
            return (
              <div key={evt.id} className="py-3 border-b border-border last:border-b-0">
                <div className="flex items-start gap-2.5">
                  <Tag variant={catInfo.variant}>{catInfo.label}</Tag>
                  <div className="min-w-0 flex-1">
                    <div className="text-[11.5px] font-medium leading-tight">{evt.title}</div>
                    <div className="text-[10px] text-muted-foreground mt-1">
                      {new Date(evt.date).toLocaleDateString("fr", { day: "numeric", month: "short", year: "numeric" })}
                      {evt.magnitudeValue !== null && ` · ${evt.magnitudeValue} ${evt.magnitudeUnit}`}
                    </div>
                    {evt.description && (
                      <p className="text-[10px] text-muted-foreground mt-1.5 leading-relaxed">{evt.description.slice(0, 200)}</p>
                    )}
                  </div>
                </div>
                {evt.sourceUrl && (
                  <a href={evt.sourceUrl} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 mt-2 text-[10px] font-semibold text-foreground hover:opacity-60 transition-opacity">
                    Source <HugeiconsIcon icon={ArrowRight01Icon} size={10} />
                  </a>
                )}
              </div>
            );
          })}
        </SectionCard>
      )}

      {/* Earthquakes */}
      {earthquakes.length > 0 && (
        <SectionCard className="animate-fade-in-up" style={{ animationDelay: "120ms" }}>
          <div className="flex items-center gap-2 mb-3">
            <Tag variant="red">Sismique</Tag>
            <span className="text-[10px] text-muted-foreground">USGS · Rayon 300km</span>
          </div>
          {/* Seismic narrative */}
          {(() => {
            const maxMag = Math.max(...earthquakes.map(e => e.magnitude));
            const hasTsunami = earthquakes.some(e => e.tsunami);
            const recentCount = earthquakes.filter(e => Date.now() - e.time < 7 * 24 * 3600000).length;
            return (
              <>
                <NarrativeBlock
                  text={`Magnitude maximale : M${maxMag.toFixed(1)}. ${recentCount} evenement${recentCount > 1 ? "s" : ""} cette semaine.${hasTsunami ? " Alerte tsunami emise pour un ou plusieurs evenements." : ""}`}
                  icon={Alert01Icon}
                />
                {maxMag >= 5 && (
                  <NarrativeBlock text="Seisme significatif. Verifiez les consignes de securite locales. En cas de repliques, abritez-vous sous un meuble solide." icon={Alert01Icon} />
                )}
              </>
            );
          })()}
          <div className="mt-2">
            {earthquakes.map((eq, i) => (
              <div key={i} className="flex items-start gap-2.5 py-2.5 border-b border-border last:border-b-0">
                <span className={`text-[10px] font-mono font-semibold px-2 py-0.5 rounded-lg mt-0.5 flex-shrink-0 ${
                  eq.magnitude >= 5 ? "bg-pastel-red-bg text-pastel-red-text" :
                  eq.magnitude >= 3 ? "bg-pastel-yellow-bg text-pastel-yellow-text" :
                  "bg-secondary text-muted-foreground"
                }`}>
                  M{eq.magnitude.toFixed(1)}
                </span>
                <div className="min-w-0 flex-1">
                  <div className="text-[11px] font-medium leading-tight">{eq.place}</div>
                  <div className="flex items-center gap-2 text-[10px] text-muted-foreground mt-0.5">
                    <span>Prof. {eq.depth.toFixed(0)}km</span>
                    <span>{new Date(eq.time).toLocaleDateString("fr", { day: "numeric", month: "short" })}</span>
                    {eq.tsunami && <Tag variant="red">Tsunami</Tag>}
                    {eq.felt && <span>Ressenti {eq.felt}x</span>}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </SectionCard>
      )}

      {/* ReliefWeb Alerts */}
      {reliefAlerts.length > 0 && (
        <SectionCard className="animate-fade-in-up" style={{ animationDelay: "180ms" }}>
          <div className="flex items-center gap-2 mb-3">
            <Tag variant="yellow">ReliefWeb</Tag>
            <span className="text-[10px] text-muted-foreground">Catastrophes et alertes humanitaires</span>
          </div>
          {reliefAlerts.map((alert) => (
            <div key={alert.id} className="py-2.5 border-b border-border last:border-b-0">
              <div className="text-[11.5px] font-medium leading-tight">{alert.title}</div>
              <div className="flex items-center gap-2 mt-1">
                {alert.type && <span className="text-[9px] px-1.5 py-[1px] rounded bg-pastel-yellow-bg text-pastel-yellow-text uppercase tracking-wide font-medium">{alert.type}</span>}
                {alert.date && <span className="text-[10px] text-muted-foreground">{new Date(alert.date).toLocaleDateString("fr", { day: "numeric", month: "short", year: "numeric" })}</span>}
              </div>
              <a href={alert.url} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 mt-1.5 text-[10px] font-semibold text-foreground hover:opacity-60 transition-opacity">
                Details <HugeiconsIcon icon={ArrowRight01Icon} size={10} />
              </a>
            </div>
          ))}
        </SectionCard>
      )}
    </div>
  );
}

// ====== CULTURE TAB (enriched) ======

function CultureTab({ country, location }: { country: CountryData | null; location: GeoResult }) {
  if (!country) return <EmptyState text="Donnees culturelles indisponibles pour cette position." />;

  const langText = country.languages.join(", ");
  const currText = country.currencies.map((c) => `${c.name} (${c.symbol})`).join(", ");
  const density = Math.round(country.population / country.area);

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
        {country.carSide && (
          <NarrativeBlock text={`On roule a ${country.carSide === "right" ? "droite" : "gauche"}. Debut de semaine : ${country.startOfWeek === "monday" ? "lundi" : country.startOfWeek === "sunday" ? "dimanche" : country.startOfWeek}.`} icon={InformationCircleIcon} />
        )}
      </SectionCard>

      {/* Country card */}
      <SectionCard className="animate-fade-in-up" style={{ animationDelay: "60ms" }}>
        <div className="flex items-center gap-3 mb-4">
          {country.flag && (
            <img src={country.flag} alt={`Drapeau ${country.name}`} className="w-14 h-10 object-cover rounded-lg border border-border" loading="lazy" />
          )}
          <div className="flex-1">
            <div className="text-sm font-serif font-semibold leading-tight">{country.name}</div>
            <div className="text-[10px] text-muted-foreground">{country.officialName}</div>
          </div>
          {country.coatOfArms && (
            <img src={country.coatOfArms} alt="Armoiries" className="w-10 h-10 object-contain" loading="lazy" />
          )}
        </div>
        <DataRow label="Capitale" value={country.capital} />
        <DataRow label="Continent" value={country.continents.join(", ")} />
        <DataRow label="Region" value={`${country.subregion}, ${country.region}`} />
        <DataRow label="Population" value={country.population.toLocaleString("fr")} mono />
        <DataRow label="Superficie" value={`${country.area.toLocaleString("fr")} km\u00B2`} mono />
        <DataRow label="Langues" value={langText} />
        <DataRow label="Monnaie" value={currText} />
        {country.borders.length > 0 && (
          <DataRow label="Frontieres" value={`${country.borders.length} pays`} />
        )}
        {country.gini !== undefined && (
          <DataRow label="Indice Gini" value={country.gini.toFixed(1)} mono />
        )}
      </SectionCard>

      {/* Density + Gini insight */}
      <SectionCard className="animate-fade-in-up" style={{ animationDelay: "120ms" }}>
        <SectionTitle>Indicateurs</SectionTitle>
        <div className="grid grid-cols-2 gap-2">
          <div className="rounded-xl p-3 bg-secondary/40">
            <div className="text-[9px] text-muted-foreground uppercase tracking-[0.06em] font-medium">Densite</div>
            <div className="text-lg font-serif font-semibold mt-1">{density} <span className="text-[10px] font-normal text-muted-foreground">hab/km\u00B2</span></div>
          </div>
          {country.gini !== undefined && (
            <div className="rounded-xl p-3 bg-secondary/40">
              <div className="text-[9px] text-muted-foreground uppercase tracking-[0.06em] font-medium">Inegalite (Gini)</div>
              <div className="text-lg font-serif font-semibold mt-1">{country.gini.toFixed(1)}</div>
              <ProgressBar value={country.gini} max={100} color={country.gini > 45 ? "hsl(var(--pastel-red-text))" : country.gini > 35 ? "hsl(var(--pastel-yellow-text))" : "hsl(var(--pastel-green-text))"} />
            </div>
          )}
        </div>
        <div className="mt-3 px-3 py-2.5 rounded-lg bg-secondary/50">
          <div className="text-[10px] text-muted-foreground leading-relaxed">
            {density > 200
              ? "Zone a forte densite. Affluence probable dans les transports et lieux publics."
              : density > 50
              ? "Densite moderee. Equilibre entre espaces urbains et naturels."
              : "Faible densite. Grands espaces et tranquillite."}
          </div>
        </div>
      </SectionCard>
    </div>
  );
}

// ====== WIKI TAB (enriched with Wikimedia images) ======

function WikiTab({ wiki, wikiImages, location }: { wiki: WikiData | null; wikiImages: WikimediaImage[]; location: GeoResult }) {
  if (!wiki && wikiImages.length === 0) return <EmptyState text="Aucun article encyclopedique trouve pour ce lieu." />;

  return (
    <div className="space-y-3">
      {wiki && (
        <SectionCard className="animate-fade-in-up">
          {wiki.thumbnail && (
            <div className="-mx-4 -mt-4 mb-4">
              <img src={wiki.thumbnail} alt={wiki.title} className="w-full h-48 object-cover rounded-t-xl" loading="lazy" />
            </div>
          )}
          <div className="flex items-center gap-2 mb-3">
            <Tag variant="yellow">Encyclopedie</Tag>
            <span className="text-[10px] text-muted-foreground">Wikipedia</span>
          </div>
          <h3 className="font-serif text-lg font-semibold mb-2 leading-tight tracking-tight">{wiki.title}</h3>
          <p className="text-[11.5px] leading-[1.7] text-muted-foreground">{wiki.extract}</p>
          {wiki.url && (
            <a href={wiki.url} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1.5 mt-4 text-[11px] font-semibold text-foreground hover:opacity-60 transition-opacity">
              Lire l'article complet
              <HugeiconsIcon icon={ArrowRight01Icon} size={12} />
            </a>
          )}
        </SectionCard>
      )}

      {/* Wikimedia Commons gallery */}
      {wikiImages.length > 0 && (
        <SectionCard className="animate-fade-in-up" style={{ animationDelay: "60ms" }}>
          <div className="flex items-center gap-2 mb-3">
            <Tag variant="blue">Wikimedia</Tag>
            <span className="text-[10px] text-muted-foreground">Photos geolocalisees</span>
          </div>
          <div className="grid grid-cols-2 gap-2">
            {wikiImages.slice(0, 6).map((img, i) => (
              <a key={i} href={img.descriptionUrl || img.url} target="_blank" rel="noopener noreferrer" className="group relative overflow-hidden rounded-lg aspect-[4/3]">
                <img
                  src={img.thumbUrl}
                  alt={img.title}
                  className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                  loading="lazy"
                />
                <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-foreground/60 to-transparent p-2 pt-6">
                  <span className="text-[9px] text-primary-foreground leading-tight line-clamp-2">{img.title}</span>
                </div>
              </a>
            ))}
          </div>
        </SectionCard>
      )}

      {/* Climate zone */}
      <SectionCard className="animate-fade-in-up" style={{ animationDelay: "120ms" }}>
        <SectionTitle>Zone climatique</SectionTitle>
        <DataRow label="Latitude" value={location.lat.toFixed(6)} mono />
        <DataRow label="Longitude" value={location.lon.toFixed(6)} mono />
        <DataRow label="Hemisphere" value={location.lat >= 0 ? "Nord" : "Sud"} />
        <div className="mt-3 px-3 py-2.5 rounded-lg bg-secondary/50">
          <div className="text-[10px] text-muted-foreground leading-relaxed">
            {Math.abs(location.lat) > 66.5
              ? "Zone polaire. Nuit polaire en hiver, soleil de minuit en ete. Temperatures extremes."
              : Math.abs(location.lat) > 60
              ? "Zone subarctique. Hivers longs et rigoureux, etes brefs."
              : Math.abs(location.lat) > 35
              ? "Zone temperee. Quatre saisons distinctes avec des transitions marquees."
              : Math.abs(location.lat) > 23.5
              ? "Zone subtropicale. Climat chaud avec des saisons humides et seches alternees."
              : "Zone tropicale. Chaleur constante et humidite elevee toute l'annee."}
          </div>
        </div>
      </SectionCard>
    </div>
  );
}

// ====== NEARBY TAB ======

const POI_LABELS: Record<string, string> = {
  hospital: "Hopital", pharmacy: "Pharmacie", restaurant: "Restaurant", cafe: "Cafe",
  bank: "Banque", fuel: "Station-service", school: "Ecole", library: "Bibliotheque",
  hotel: "Hotel", museum: "Musee", viewpoint: "Point de vue", attraction: "Attraction",
  supermarket: "Supermarche", convenience: "Epicerie", stop_position: "Arret transport",
  station: "Gare", police: "Police", fire_station: "Pompiers", post_office: "Bureau de poste",
  information: "Office tourisme", bakery: "Boulangerie", butcher: "Boucherie",
  place_of_worship: "Lieu de culte", cinema: "Cinema", theatre: "Theatre",
  dentist: "Dentiste", doctors: "Medecin", veterinary: "Veterinaire",
  gallery: "Galerie", camp_site: "Camping", hostel: "Auberge",
  defibrillator: "Defibrillateur", phone: "Appel urgence",
  peak: "Sommet", spring: "Source", cave_entrance: "Grotte", waterfall: "Cascade",
};

function NearbyTab({ pois, location }: { pois: OverpassPOI[]; location: GeoResult }) {
  const nearestTransport = pois.find((p) => p.type === "stop_position" || p.type === "station");
  const nearestHealth = pois.find((p) => ["hospital", "pharmacy", "doctors", "dentist"].includes(p.type));
  const nearestEmergency = pois.find((p) => ["defibrillator", "police", "fire_station"].includes(p.type));

  // Group POIs by category
  const grouped = useMemo(() => {
    const groups: Record<string, OverpassPOI[]> = {
      "Sante": [], "Transport": [], "Urgence": [], "Restauration": [],
      "Commerces": [], "Culture / Loisirs": [], "Nature": [], "Autre": [],
    };
    pois.forEach(p => {
      if (["hospital", "pharmacy", "doctors", "dentist", "veterinary"].includes(p.type)) groups["Sante"].push(p);
      else if (["stop_position", "station"].includes(p.type)) groups["Transport"].push(p);
      else if (["police", "fire_station", "defibrillator", "phone"].includes(p.type)) groups["Urgence"].push(p);
      else if (["restaurant", "cafe", "bakery", "butcher"].includes(p.type)) groups["Restauration"].push(p);
      else if (["supermarket", "convenience", "fuel", "bank", "post_office"].includes(p.type)) groups["Commerces"].push(p);
      else if (["museum", "gallery", "cinema", "theatre", "library", "attraction", "viewpoint", "information", "place_of_worship"].includes(p.type)) groups["Culture / Loisirs"].push(p);
      else if (["peak", "spring", "cave_entrance", "waterfall"].includes(p.type)) groups["Nature"].push(p);
      else groups["Autre"].push(p);
    });
    return Object.entries(groups).filter(([, v]) => v.length > 0);
  }, [pois]);

  return (
    <div className="space-y-3">
      {/* Smart narratives */}
      {(nearestTransport || nearestHealth || nearestEmergency) && (
        <SectionCard className="animate-fade-in-up">
          <div className="flex items-center gap-2 mb-2">
            <Tag variant="blue">Mobilite intelligente</Tag>
          </div>
          {nearestTransport && (
            <NarrativeBlock text={`Station "${nearestTransport.name}" detectee a ${nearestTransport.distance}m. Transport public accessible a pied.`} icon={Location01Icon} />
          )}
          {nearestHealth && (
            <NarrativeBlock text={`${POI_LABELS[nearestHealth.type] || "Service de sante"} "${nearestHealth.name}" a ${nearestHealth.distance}m.`} icon={Alert01Icon} />
          )}
          {nearestEmergency && (
            <NarrativeBlock text={`${POI_LABELS[nearestEmergency.type] || "Service d'urgence"} a ${nearestEmergency.distance}m.`} icon={Alert01Icon} />
          )}
        </SectionCard>
      )}

      {/* Grouped POIs */}
      {grouped.length > 0 ? (
        grouped.map(([groupName, groupPois], gi) => (
          <SectionCard key={groupName} className="animate-fade-in-up" style={{ animationDelay: `${(gi + 1) * 60}ms` }}>
            <SectionTitle sub={`${groupPois.length} lieu${groupPois.length > 1 ? "x" : ""}`}>{groupName}</SectionTitle>
            {groupPois.map((poi) => (
              <div key={poi.id} className="flex items-center justify-between py-2 border-b border-border last:border-b-0">
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
                  onClick={() => window.open(`geo:${poi.lat},${poi.lon}?q=${poi.lat},${poi.lon}(${encodeURIComponent(poi.name)})`, "_blank")}
                  className="w-7 h-7 rounded-lg bg-secondary flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors flex-shrink-0 ml-2"
                >
                  <HugeiconsIcon icon={Navigation01Icon} size={13} />
                </button>
              </div>
            ))}
          </SectionCard>
        ))
      ) : (
        <EmptyState text="Aucun service detecte dans un rayon de 800m." />
      )}
    </div>
  );
}

// ====== NATURE TAB (enriched) ======

function NatureTab({ species, location }: { species: GBIFSpecies[]; location: GeoResult }) {
  const kingdoms = useMemo(() => {
    const k: Record<string, number> = {};
    species.forEach((s) => {
      const key = s.kingdom || "Inconnu";
      k[key] = (k[key] || 0) + 1;
    });
    return k;
  }, [species]);

  const families = useMemo(() => {
    const f: Record<string, number> = {};
    species.forEach((s) => {
      if (s.family) f[s.family] = (f[s.family] || 0) + 1;
    });
    return Object.entries(f).sort((a, b) => b[1] - a[1]).slice(0, 6);
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

      {/* Families */}
      {families.length > 0 && (
        <SectionCard className="animate-fade-in-up" style={{ animationDelay: "60ms" }}>
          <SectionTitle>Familles dominantes</SectionTitle>
          <div className="grid grid-cols-3 gap-2">
            {families.map(([f, count]) => (
              <div key={f} className="rounded-xl p-2.5 bg-pastel-green-bg/30">
                <div className="text-[10px] font-medium truncate">{f}</div>
                <div className="text-[13px] font-mono font-semibold mt-1">{count}</div>
              </div>
            ))}
          </div>
        </SectionCard>
      )}

      {/* Species list */}
      <SectionCard className="animate-fade-in-up" style={{ animationDelay: "120ms" }}>
        <SectionTitle>Especes observees</SectionTitle>
        {species.map((sp, i) => (
          <div key={i} className="flex items-start gap-3 py-2.5 border-b border-border last:border-b-0">
            {sp.media ? (
              <img src={sp.media} alt={sp.name} className="w-10 h-10 rounded-lg object-cover flex-shrink-0 border border-border" loading="lazy" />
            ) : (
              <div className="w-10 h-10 rounded-lg bg-pastel-green-bg flex items-center justify-center flex-shrink-0">
                <HugeiconsIcon icon={Leaf01Icon} size={16} className="text-pastel-green-text" />
              </div>
            )}
            <div className="min-w-0 flex-1">
              <div className="text-[11.5px] font-medium">{sp.name}</div>
              <div className="text-[10px] text-muted-foreground italic mt-0.5">{sp.scientificName}</div>
              <div className="flex items-center gap-1.5 mt-1 flex-wrap">
                {sp.kingdom && (
                  <span className="text-[8px] px-1.5 py-[2px] rounded bg-pastel-green-bg text-pastel-green-text uppercase tracking-wider font-semibold">
                    {sp.kingdom}
                  </span>
                )}
                {sp.family && (
                  <span className="text-[9px] text-muted-foreground">{sp.family}</span>
                )}
                {sp.order && (
                  <span className="text-[9px] text-muted-foreground">· {sp.order}</span>
                )}
              </div>
            </div>
          </div>
        ))}
      </SectionCard>
    </div>
  );
}

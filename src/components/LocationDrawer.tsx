import { useState, useEffect, useMemo, useCallback } from "react";
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
  computeComfortScore,
  analyzePressureTrend,
  computeWalkabilityInsight,
  getAirHealthProfiles,
  analyzeSeismicRisk,
  computeBiodiversityIndex,
  classifyDayType,
  getTimeContext,
  generateAnomalyInsight,
  generateBehavioralInsight,
  computeGlobalAlertState,
  generateAlertTimeline,
  generateHeroInsight,
} from "@/lib/api";

interface LocationDrawerProps {
  location: GeoResult | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

type TabId = "weather" | "air" | "alerts" | "savoir" | "nearby" | "nature";

const TABS: { id: TabId; label: string; icon: any }[] = [
  { id: "weather", label: "Meteo", icon: Sun01Icon },
  { id: "air", label: "Air", icon: Leaf01Icon },
  { id: "alerts", label: "Alertes", icon: Alert01Icon },
  { id: "savoir", label: "Savoir", icon: Globe02Icon },
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
  const comfort = weather ? computeComfortScore(weather, airQuality) : null;
  const dayType = weather ? classifyDayType(weather) : null;
  const timeCtx = getTimeContext();

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
                <div className="text-[10px] text-muted-foreground mb-0.5">{timeCtx.greeting}</div>
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
                  <div className="flex items-center gap-1.5">
                    <span className="text-sm font-medium text-foreground leading-tight">{wInfo.label}</span>
                    {dayType && <span className="text-sm">{dayType.emoji}</span>}
                  </div>
                  <span className="text-[11px] text-muted-foreground leading-tight">
                    Ressenti {Math.round(weather.current.feelsLike)}&deg; · {weather.current.windSpeed} km/h {windDirectionToLabel(weather.current.windDirection)}
                  </span>
                  {comfort && (
                    <span className="text-[10px] font-medium text-muted-foreground mt-0.5">
                      Confort {comfort.emoji} {comfort.score}/100
                    </span>
                  )}
                </div>
                {airQuality && (
                  <div className="flex-shrink-0 pb-1">
                    <AQIBadge aqi={airQuality.aqi} />
                  </div>
                )}
              </div>
            )}

            {/* Hero Header - Dynamic Summary */}
            {weather && airQuality && (
              <div className="mt-4 space-y-3">
                {/* Location header */}
                <div className="flex items-center gap-2">
                  <span className="font-serif text-lg font-semibold leading-tight">{location.name}</span>
                  {country && (
                    <>
                      <span className="text-muted-foreground">·</span>
                      <span className="text-sm text-muted-foreground">{country.flagEmoji} {country.name}</span>
                    </>
                  )}
                </div>

                {/* Hero insight */}
                {(() => {
                  const heroInsight = generateHeroInsight(weather, airQuality, earthquakes, eonetEvents, reliefAlerts);
                  return (
                    <div className={`px-3 py-2.5 rounded-lg border-l-4 ${
                      heroInsight.variant === "red" ? "bg-pastel-red-bg/30 border-pastel-red-text" :
                      heroInsight.variant === "yellow" ? "bg-pastel-yellow-bg/30 border-pastel-yellow-text" :
                      heroInsight.variant === "green" ? "bg-pastel-green-bg/30 border-pastel-green-text" :
                      "bg-pastel-blue-bg/30 border-pastel-blue-text"
                    }`}>
                      <div className={`text-[11px] font-medium leading-relaxed ${
                        heroInsight.variant === "red" ? "text-pastel-red-text" :
                        heroInsight.variant === "yellow" ? "text-pastel-yellow-text" :
                        heroInsight.variant === "green" ? "text-pastel-green-text" :
                        "text-pastel-blue-text"
                      }`}>
                        {heroInsight.message}
                      </div>
                    </div>
                  );
                })()}

                {/* Key metrics */}
                <div className="grid grid-cols-4 gap-2">
                  {/* Confort */}
                  {comfort && (
                    <div className="rounded-xl p-2 bg-secondary/40 text-center">
                      <div className="text-[9px] text-muted-foreground uppercase tracking-[0.06em] font-medium">Confort</div>
                      <div className="text-lg font-serif font-semibold mt-0.5">{comfort.score}</div>
                    </div>
                  )}
                  {/* Air */}
                  <div className="rounded-xl p-2 bg-secondary/40 text-center">
                    <div className="text-[9px] text-muted-foreground uppercase tracking-[0.06em] font-medium">Air</div>
                    <div className="text-lg font-serif font-semibold mt-0.5">{airQuality.aqi}</div>
                  </div>
                  {/* Alertes */}
                  {(() => {
                    const alertState = computeGlobalAlertState(earthquakes, eonetEvents, reliefAlerts);
                    return (
                      <div className="rounded-xl p-2 bg-secondary/40 text-center">
                        <div className="text-[9px] text-muted-foreground uppercase tracking-[0.06em] font-medium">Alertes</div>
                        <div className={`text-lg font-serif font-semibold mt-0.5 ${
                          alertState.variant === "red" ? "text-pastel-red-text" :
                          alertState.variant === "yellow" ? "text-pastel-yellow-text" :
                          "text-pastel-green-text"
                        }`}>
                          {alertState.state === "URGENCE" ? "!" : alertState.state === "ATTENTION" ? "!" : "✓"}
                        </div>
                      </div>
                    );
                  })()}
                  {/* Biodiversité */}
                  {species.length > 0 && (() => {
                    const bioIndex = computeBiodiversityIndex(species);
                    return (
                      <div className="rounded-xl p-2 bg-secondary/40 text-center">
                        <div className="text-[9px] text-muted-foreground uppercase tracking-[0.06em] font-medium">Bio</div>
                        <div className={`text-lg font-serif font-semibold mt-0.5 ${
                          bioIndex.variant === "red" ? "text-pastel-red-text" :
                          bioIndex.variant === "yellow" ? "text-pastel-yellow-text" :
                          "text-pastel-green-text"
                        }`}>
                          {bioIndex.score}
                        </div>
                      </div>
                    );
                  })()}
                </div>
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
                    <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-destructive text-destructive-foreground text-[8px] font-bold flex items-center justify-center">
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
                  <WeatherTab weather={weather} narratives={narratives} airQuality={airQuality} />
                )}
                {activeTab === "air" && <AirTab airQuality={airQuality} />}
                {activeTab === "alerts" && (
                  <AlertsTab earthquakes={earthquakes} eonetEvents={eonetEvents} reliefAlerts={reliefAlerts} location={location} />
                )}
                {activeTab === "savoir" && <SavoirTab country={country} wiki={wiki} wikiImages={wikiImages} location={location} />}
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

// Progressive disclosure toggle
function Expandable({ label, defaultOpen = false, children }: { label: string; defaultOpen?: boolean; children: React.ReactNode }) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="mt-2">
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center gap-1.5 text-[10px] font-semibold text-muted-foreground hover:text-foreground transition-colors"
      >
        <span className={`transition-transform duration-200 ${open ? "rotate-90" : ""}`}>›</span>
        {label}
      </button>
      {open && <div className="mt-2 animate-fade-in-up">{children}</div>}
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

// ====== WEATHER TAB ======

function WeatherTab({ weather, narratives, airQuality }: { weather: WeatherData; narratives: string[]; airQuality: AirQualityData | null }) {
  const todaySunrise = weather.daily[0]?.sunrise;
  const todaySunset = weather.daily[0]?.sunset;
  const uvInfo = getUVLabel(weather.current.uvIndex);
  const dpInfo = getDewPointComfort(weather.current.dewPoint);
  const comfort = computeComfortScore(weather, airQuality);
  const pressureInfo = analyzePressureTrend(weather.current.pressure);
  const anomalyInsight = generateAnomalyInsight(weather);

  return (
    <div className="space-y-3">
      {/* Comfort Score Hero */}
      <SectionCard className="animate-fade-in-up">
        <div className="flex items-center gap-2 mb-2">
          <Tag variant={comfort.score >= 60 ? "green" : comfort.score >= 40 ? "yellow" : "red"}>Confort exterieur</Tag>
          <span className="text-[10px] text-muted-foreground">{comfort.score}/100</span>
        </div>
        <div className="flex items-center gap-4 mb-3">
          <div className="text-4xl">{comfort.emoji}</div>
          <div className="flex-1">
            <div className="font-serif text-lg font-semibold">{comfort.label}</div>
            <ProgressBar value={comfort.score} max={100} color={comfort.score >= 60 ? "hsl(var(--pastel-green-text))" : comfort.score >= 40 ? "hsl(var(--pastel-yellow-text))" : "hsl(var(--pastel-red-text))"} />
          </div>
        </div>

        {/* Clothing reco */}
        {comfort.clothing.length > 0 && (
          <div className="mt-2 px-3 py-2.5 rounded-lg bg-secondary/50">
            <div className="text-[9px] text-muted-foreground uppercase tracking-wide font-medium mb-1">Tenue recommandee</div>
            {comfort.clothing.map((c, i) => (
              <div key={i} className="text-[11px] leading-[1.6] text-foreground">· {c}</div>
            ))}
          </div>
        )}

        {/* Activities */}
        {comfort.activities.length > 0 && (
          <Expandable label={`${comfort.activities.length} activites suggerees`}>
            <div className="space-y-1 px-3 py-2 rounded-lg bg-pastel-green-bg/30">
              {comfort.activities.map((a, i) => (
                <div key={i} className="text-[11px] leading-[1.5] text-foreground">· {a}</div>
              ))}
            </div>
          </Expandable>
        )}

        {/* Warnings */}
        {comfort.warnings.length > 0 && (
          <div className="mt-2 space-y-1">
            {comfort.warnings.map((w, i) => (
              <div key={i} className="px-3 py-2 rounded-lg bg-pastel-red-bg/50 text-[10px] text-pastel-red-text font-medium">⚠ {w}</div>
            ))}
          </div>
        )}
      </SectionCard>

      {/* Anomaly Insight - NIVEAU 1 */}
      {anomalyInsight.priority && anomalyInsight.message && (
        <SectionCard className="animate-fade-in-up" style={{ animationDelay: "20ms" }}>
          <div className={`px-3 py-2.5 rounded-lg ${
            anomalyInsight.priority === "critical" ? "bg-pastel-red-bg/50" :
            anomalyInsight.priority === "warning" ? "bg-pastel-yellow-bg/50" :
            "bg-pastel-blue-bg/40"
          }`}>
            <div className={`text-[11px] font-medium ${
              anomalyInsight.priority === "critical" ? "text-pastel-red-text" :
              anomalyInsight.priority === "warning" ? "text-pastel-yellow-text" :
              "text-pastel-blue-text"
            }`}>
              {anomalyInsight.priority === "critical" && "⚠ "}{anomalyInsight.message}
            </div>
          </div>
        </SectionCard>
      )}

      {/* Narratives — progressive: show first 3, expand rest */}
      {narratives.length > 0 && (
        <SectionCard className="animate-fade-in-up" style={{ animationDelay: "40ms" }}>
          <div className="flex items-center gap-2 mb-3">
            <Tag variant="blue">Analyse</Tag>
            <span className="text-[10px] text-muted-foreground">{narratives.length} signaux</span>
          </div>
          {narratives.slice(0, 3).map((n, i) => (
            <NarrativeBlock key={i} text={n} icon={Alert01Icon} />
          ))}
          {narratives.length > 3 && (
            <Expandable label={`${narratives.length - 3} signaux supplementaires`}>
              {narratives.slice(3).map((n, i) => (
                <NarrativeBlock key={i} text={n} icon={InformationCircleIcon} />
              ))}
            </Expandable>
          )}
        </SectionCard>
      )}

      {/* Conditions bento grid - NIVEAU 2 expandable par défaut */}
      <Expandable label="Conditions actuelles" defaultOpen={false}>
        <SectionCard className="animate-fade-in-up" style={{ animationDelay: "80ms" }}>
          <div className="grid grid-cols-3 gap-2">
            <MiniStat label="Humidite" value={`${weather.current.humidity}%`} accent={weather.current.humidity > 80} />
            <MiniStat label="Pression" value={`${Math.round(weather.current.pressure)} hPa`} sub={pressureInfo.trend} accent={weather.current.pressure < 1000} />
            <MiniStat label="Nuages" value={`${weather.current.cloudCover}%`} sub={weather.current.cloudCover > 80 ? "Couvert" : weather.current.cloudCover > 40 ? "Partiel" : "Degage"} />
            <MiniStat label="Vent" value={`${weather.current.windSpeed} km/h`} sub={windDirectionToLabel(weather.current.windDirection)} accent={weather.current.windSpeed > 30} />
            <MiniStat label="Rafales" value={`${weather.current.windGusts} km/h`} accent={weather.current.windGusts > 50} />
            <MiniStat label="Precipitations" value={`${weather.current.precipitation} mm`} accent={weather.current.precipitation > 0} />
          </div>
          <Expandable label="Details avances">
            <div className="grid grid-cols-3 gap-2">
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
            <div className="mt-2 px-3 py-2 rounded-lg bg-secondary/50">
              <div className="text-[10px] text-muted-foreground leading-relaxed">{pressureInfo.narrative}</div>
            </div>
          </Expandable>
        </SectionCard>
      </Expandable>

      {/* UV + Comfort duo - NIVEAU 2 expandable par défaut */}
      <Expandable label="UV & Confort humidite" defaultOpen={false}>
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
      </Expandable>

      {/* Ephemerides - NIVEAU 2 expandable par défaut */}
      <Expandable label="Ephemerides" defaultOpen={false}>
        {todaySunrise && (
          <SectionCard className="animate-fade-in-up" style={{ animationDelay: "160ms" }}>
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
            {/* Golden hour info */}
            <Expandable label="Golden hour & crepuscule">
              {(() => {
                const rise = new Date(todaySunrise);
                const set = new Date(todaySunset);
                const goldenAM = new Date(rise.getTime() + 40 * 60000);
                const goldenPM = new Date(set.getTime() - 40 * 60000);
                return (
                  <div className="grid grid-cols-2 gap-2">
                    <div className="rounded-xl p-2.5 bg-pastel-yellow-bg/40">
                      <div className="text-[9px] text-muted-foreground uppercase">Golden hour matin</div>
                      <div className="text-xs font-mono font-semibold mt-1">
                        {rise.toLocaleTimeString("fr", { hour: "2-digit", minute: "2-digit" })} - {goldenAM.toLocaleTimeString("fr", { hour: "2-digit", minute: "2-digit" })}
                      </div>
                    </div>
                    <div className="rounded-xl p-2.5 bg-pastel-red-bg/30">
                      <div className="text-[9px] text-muted-foreground uppercase">Golden hour soir</div>
                      <div className="text-xs font-mono font-semibold mt-1">
                        {goldenPM.toLocaleTimeString("fr", { hour: "2-digit", minute: "2-digit" })} - {set.toLocaleTimeString("fr", { hour: "2-digit", minute: "2-digit" })}
                      </div>
                    </div>
                  </div>
                );
              })()}
            </Expandable>
          </SectionCard>
        )}
      </Expandable>

      {/* Hourly scroll - NIVEAU 3 expandable par défaut */}
      <Expandable label="Prochaines heures" defaultOpen={false}>
        <SectionCard className="animate-fade-in-up" style={{ animationDelay: "200ms" }}>
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
          {/* Rain window insight */}
          {(() => {
            const nextRain = weather.hourly.slice(0, 12).find(h => h.precipitationProb > 50);
            const dryWindow = weather.hourly.slice(0, 12).filter(h => h.precipitationProb < 20).length;
            if (nextRain) {
              return (
                <div className="mt-2 px-3 py-2 rounded-lg bg-pastel-blue-bg/40">
                  <div className="text-[10px] text-pastel-blue-text font-medium">
                    🌧 Pluie probable vers {new Date(nextRain.time).toLocaleTimeString("fr", { hour: "2-digit", minute: "2-digit" })} ({nextRain.precipitationProb}%).
                    {dryWindow > 0 && ` ${dryWindow}h de fenetre seche disponible.`}
                  </div>
                </div>
              );
            }
            return null;
          })()}
        </SectionCard>
      </Expandable>

      {/* 7-day - NIVEAU 3 expandable par défaut */}
      <Expandable label="Previsions 7 jours" defaultOpen={false}>
        <SectionCard className="animate-fade-in-up" style={{ animationDelay: "240ms" }}>
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
        {/* Weekly summary — progressive */}
        <Expandable label="Resume de la semaine" defaultOpen={false}>
          {(() => {
            const totalPrecip = weather.daily.reduce((s, d) => s + d.precipitationSum, 0);
            const totalPrecipHours = weather.daily.reduce((s, d) => s + d.precipitationHours, 0);
            const maxGust = Math.max(...weather.daily.map(d => d.windGustsMax));
            const maxUV = Math.max(...weather.daily.map(d => d.uvIndexMax));
            const avgMax = weather.daily.reduce((s, d) => s + d.tempMax, 0) / weather.daily.length;
            const avgMin = weather.daily.reduce((s, d) => s + d.tempMin, 0) / weather.daily.length;
            const bestDay = weather.daily.reduce((best, d) => {
              const score = d.tempMax - d.precipitationSum * 2 - d.windSpeedMax * 0.3;
              const bestScore = best.tempMax - best.precipitationSum * 2 - best.windSpeedMax * 0.3;
              return score > bestScore ? d : best;
            });
            return (
              <>
                <div className="grid grid-cols-2 gap-2">
                  <MiniStat label="Temp. moy. max" value={`${avgMax.toFixed(1)}°C`} />
                  <MiniStat label="Temp. moy. min" value={`${avgMin.toFixed(1)}°C`} />
                  <MiniStat label="Cumul pluie" value={`${totalPrecip.toFixed(1)} mm`} sub={`${totalPrecipHours.toFixed(0)}h de pluie`} accent={totalPrecip > 20} />
                  <MiniStat label="Rafales max" value={`${maxGust.toFixed(0)} km/h`} accent={maxGust > 60} />
                  <MiniStat label="UV max semaine" value={maxUV.toString()} accent={maxUV > 6} />
                  <MiniStat label="Amplitude" value={`${(Math.max(...weather.daily.map(d => d.tempMax)) - Math.min(...weather.daily.map(d => d.tempMin))).toFixed(1)}°C`} />
                </div>
                <div className="mt-2 px-3 py-2 rounded-lg bg-pastel-green-bg/30">
                  <div className="text-[10px] text-pastel-green-text font-medium">
                    ✨ Meilleur jour : {new Date(bestDay.date).toLocaleDateString("fr", { weekday: "long", day: "numeric" })} — {Math.round(bestDay.tempMax)}°C, {weatherCodeToLabel(bestDay.weatherCode).label}
                  </div>
                </div>
              </>
            );
          })()}
        </Expandable>
      </Expandable>
    </div>
  );
}

// ====== AIR TAB ======

function AirTab({ airQuality }: { airQuality: AirQualityData | null }) {
  if (!airQuality) return <EmptyState text="Chargement des donnees de qualite de l'air..." />;

  const aqInfo = getAQILabel(airQuality.aqi);
  const healthProfiles = getAirHealthProfiles(airQuality.aqi, airQuality.pm25);
  const behavioralInsight = generateBehavioralInsight(airQuality);

  const pollutants = [
    { key: "PM2.5", value: airQuality.pm25, unit: "\u00B5g/m\u00B3", desc: "Particules fines respirables", threshold: 25 },
    { key: "PM10", value: airQuality.pm10, unit: "\u00B5g/m\u00B3", desc: "Particules en suspension", threshold: 50 },
    { key: "NO\u2082", value: airQuality.no2, unit: "\u00B5g/m\u00B3", desc: "Dioxyde d'azote, trafic routier", threshold: 200 },
    { key: "O\u2083", value: airQuality.ozone, unit: "\u00B5g/m\u00B3", desc: "Ozone tropospherique", threshold: 180 },
    { key: "SO\u2082", value: airQuality.so2, unit: "\u00B5g/m\u00B3", desc: "Dioxyde de soufre, industrie", threshold: 350 },
    { key: "CO", value: airQuality.co, unit: "\u00B5g/m\u00B3", desc: "Monoxyde de carbone", threshold: 10000 },
    { key: "Poussieres", value: airQuality.dust, unit: "\u00B5g/m\u00B3", desc: "Sable et poussiere", threshold: 100 },
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

        {/* Contextual insights */}
        {airQuality.pm25 > 15 && (
          <NarrativeBlock text={`PM2.5 a ${airQuality.pm25.toFixed(1)} \u00B5g/m\u00B3. Ces particules fines penetrent profondement dans les poumons. Portez un masque FFP2 si exposition prolongee.`} icon={Alert01Icon} />
        )}
        {airQuality.ozone > 100 && (
          <NarrativeBlock text={`Ozone eleve (${airQuality.ozone.toFixed(0)} \u00B5g/m\u00B3). Evitez les activites physiques intenses en exterieur entre 12h et 18h.`} icon={Alert01Icon} />
        )}
        {airQuality.dust > 50 && (
          <NarrativeBlock text={`Concentration de poussieres importante (${airQuality.dust.toFixed(0)} \u00B5g/m\u00B3). Episode saharien probable.`} icon={Alert01Icon} />
        )}
      </SectionCard>

      {/* Behavioral Insight - NIVEAU 1 */}
      <SectionCard className="animate-fade-in-up" style={{ animationDelay: "20ms" }}>
        <div className={`px-3 py-2.5 rounded-lg ${
          behavioralInsight.severity === "danger" ? "bg-pastel-red-bg/50" :
          behavioralInsight.severity === "bad" ? "bg-pastel-yellow-bg/50" :
          behavioralInsight.severity === "moderate" ? "bg-pastel-yellow-bg/30" :
          "bg-pastel-green-bg/40"
        }`}>
          <div className={`text-[11px] font-medium ${
            behavioralInsight.severity === "danger" ? "text-pastel-red-text" :
            behavioralInsight.severity === "bad" ? "text-pastel-yellow-text" :
            behavioralInsight.severity === "moderate" ? "text-pastel-yellow-text" :
            "text-pastel-green-text"
          }`}>
            {behavioralInsight.message}
          </div>
        </div>
      </SectionCard>

      {/* Health profiles — progressive */}
      {healthProfiles.length > 0 && (
        <SectionCard className="animate-fade-in-up" style={{ animationDelay: "40ms" }}>
          <div className="flex items-center gap-2 mb-3">
            <Tag variant="purple">Recommandations sante</Tag>
          </div>
          {healthProfiles.slice(0, 2).map((hp, i) => (
            <div key={i} className="py-2 border-b border-border last:border-b-0">
              <div className="text-[10px] font-semibold text-foreground">{hp.profile}</div>
              <div className="text-[11px] text-muted-foreground leading-[1.5] mt-0.5">{hp.advice}</div>
            </div>
          ))}
          {healthProfiles.length > 2 && (
            <Expandable label={`${healthProfiles.length - 2} autres profils`}>
              {healthProfiles.slice(2).map((hp, i) => (
                <div key={i} className="py-2 border-b border-border last:border-b-0">
                  <div className="text-[10px] font-semibold text-foreground">{hp.profile}</div>
                  <div className="text-[11px] text-muted-foreground leading-[1.5] mt-0.5">{hp.advice}</div>
                </div>
              ))}
            </Expandable>
          )}
        </SectionCard>
      )}

      {/* Pollutants - NIVEAU 3 expandable par défaut */}
      <Expandable label="Polluants" defaultOpen={false}>
        <SectionCard className="animate-fade-in-up" style={{ animationDelay: "80ms" }}>
          <SectionTitle>Polluants</SectionTitle>
          {pollutants.slice(0, 3).map((p) => {
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
          <Expandable label={`${pollutants.length - 3} autres polluants`}>
            {pollutants.slice(3).map((p) => {
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
          </Expandable>
        </SectionCard>
      </Expandable>

      {/* Pollen - NIVEAU 2 expandable par défaut */}
      {hasPollenData && (
        <Expandable label="Pollens" defaultOpen={false}>
          <SectionCard className="animate-fade-in-up" style={{ animationDelay: "120ms" }}>
            <div className="flex items-center gap-2 mb-3">
              <Tag variant="yellow">Pollens</Tag>
              <span className="text-[10px] text-muted-foreground">Allergenes aeriens</span>
            </div>
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
            {pollenData.some(p => p.value >= 50) && (
              <NarrativeBlock text="Concentration de pollens elevee. Allergiques : limitez le temps en exterieur, gardez les fenetres fermees, douchez-vous en rentrant." icon={Alert01Icon} />
            )}
          </SectionCard>
        </Expandable>
      )}
    </div>
  );
}

// ====== ALERTS TAB ======

function AlertsTab({ earthquakes, eonetEvents, reliefAlerts, location }: {
  earthquakes: EarthquakeData[];
  eonetEvents: EONETEvent[];
  reliefAlerts: ReliefWebAlert[];
  location: GeoResult;
}) {
  const totalAlerts = earthquakes.length + eonetEvents.length + reliefAlerts.length;
  const seismicRisk = analyzeSeismicRisk(earthquakes);
  const globalState = computeGlobalAlertState(earthquakes, eonetEvents, reliefAlerts);
  const timelineEvents = generateAlertTimeline(earthquakes, eonetEvents, reliefAlerts);

  if (totalAlerts === 0) {
    return (
      <div className="space-y-3">
        {/* Global State - NIVEAU 1 */}
        <SectionCard className="animate-fade-in-up">
          <div className={`px-3 py-2.5 rounded-lg bg-pastel-green-bg/40`}>
            <div className={`text-[11px] font-medium text-pastel-green-text`}>
              ✓ Zone calme
            </div>
          </div>
        </SectionCard>
        <SectionCard className="animate-fade-in-up" style={{ animationDelay: "20ms" }}>
          <div className="flex items-center gap-2 mb-3">
            <Tag variant="green">Zone calme</Tag>
          </div>
          <NarrativeBlock text="Aucune alerte environnementale, sismique ou humanitaire detectee dans cette zone. Les conditions sont stables et securisees." icon={InformationCircleIcon} />
          <div className="mt-2 px-3 py-2 rounded-lg bg-pastel-green-bg/30">
            <div className="text-[10px] text-pastel-green-text leading-relaxed">
              Sources surveillees : NASA EONET (evenements naturels), USGS (seismes, rayon 300km), ReliefWeb (alertes humanitaires). Donnees actualisees en temps reel.
            </div>
          </div>
        </SectionCard>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {/* Global State - NIVEAU 1 */}
      <SectionCard className="animate-fade-in-up">
        <div className={`px-3 py-2.5 rounded-lg ${
          globalState.variant === "red" ? "bg-pastel-red-bg/50" :
          globalState.variant === "yellow" ? "bg-pastel-yellow-bg/50" :
          "bg-pastel-green-bg/40"
        }`}>
          <div className={`text-[11px] font-medium ${
            globalState.variant === "red" ? "text-pastel-red-text" :
            globalState.variant === "yellow" ? "text-pastel-yellow-text" :
            "text-pastel-green-text"
          }`}>
            {globalState.variant === "red" && "⚠ "}{globalState.state} · {globalState.message}
          </div>
        </div>
      </SectionCard>

      {/* Timeline - NIVEAU 1 */}
      {timelineEvents.length > 0 && (
        <SectionCard className="animate-fade-in-up" style={{ animationDelay: "20ms" }}>
          <div className="flex items-center gap-2 mb-3">
            <Tag variant="blue">Timeline</Tag>
            <span className="text-[10px] text-muted-foreground">{timelineEvents.length} evenement{timelineEvents.length > 1 ? "s" : ""} recent{timelineEvents.length > 1 ? "s" : ""}</span>
          </div>
          <div className="space-y-2">
            {timelineEvents.map((evt, i) => (
              <div key={evt.id} className="flex items-start gap-2.5">
                <div className={`w-2 h-2 rounded-full mt-1.5 flex-shrink-0 ${
                  evt.variant === "red" ? "bg-pastel-red-text" :
                  evt.variant === "purple" ? "bg-purple-500" :
                  evt.variant === "blue" ? "bg-pastel-blue-text" :
                  "bg-pastel-yellow-text"
                }`} />
                <div className="flex-1">
                  <div className="text-[10px] text-muted-foreground font-mono">
                    {new Date(evt.date).toLocaleDateString("fr", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })}
                  </div>
                  <div className="text-[11px] font-medium">{evt.title}</div>
                  <div className="text-[10px] text-muted-foreground">{evt.description}</div>
                </div>
              </div>
            ))}
          </div>
        </SectionCard>
      )}

      {/* Risk synthesis - NIVEAU 1 */}
      <SectionCard className="animate-fade-in-up" style={{ animationDelay: "40ms" }}>
        <div className="flex items-center gap-2 mb-3">
          <Tag variant="red">Synthese des risques</Tag>
          <span className="text-[10px] text-muted-foreground">{totalAlerts} evenement{totalAlerts > 1 ? "s" : ""}</span>
        </div>

        {/* Seismic risk level */}
        <div className="flex items-center gap-3 py-2 border-b border-border">
          <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${seismicRisk.variant === "red" ? "bg-pastel-red-bg" : seismicRisk.variant === "yellow" ? "bg-pastel-yellow-bg" : "bg-pastel-green-bg"}`}>
            <span className="text-xs font-bold">{earthquakes.length}</span>
          </div>
          <div className="flex-1">
            <div className="text-[11px] font-medium">Risque sismique : {seismicRisk.level}</div>
            <div className="text-[10px] text-muted-foreground leading-[1.5]">{seismicRisk.narrative}</div>
          </div>
        </div>

        {eonetEvents.length > 0 && (
          <NarrativeBlock
            text={`${eonetEvents.length} evenement${eonetEvents.length > 1 ? "s" : ""} naturel${eonetEvents.length > 1 ? "s" : ""} actif${eonetEvents.length > 1 ? "s" : ""} detecte${eonetEvents.length > 1 ? "s" : ""} par la NASA dans un rayon de 500km.`}
            icon={Alert01Icon}
          />
        )}
        {reliefAlerts.length > 0 && (
          <NarrativeBlock
            text={`${reliefAlerts.length} alerte${reliefAlerts.length > 1 ? "s" : ""} humanitaire${reliefAlerts.length > 1 ? "s" : ""} en cours pour ${location.country || "cette region"}.`}
            icon={Alert01Icon}
          />
        )}
      </SectionCard>

      {/* EONET Natural Events - NIVEAU 2 expandable par défaut */}
      {eonetEvents.length > 0 && (
        <Expandable label="Evenements naturels (NASA EONET)" defaultOpen={false}>
          <SectionCard className="animate-fade-in-up" style={{ animationDelay: "60ms" }}>
            <div className="flex items-center gap-2 mb-3">
              <Tag variant="purple">NASA EONET</Tag>
              <span className="text-[10px] text-muted-foreground">Evenements naturels actifs</span>
            </div>
            {eonetEvents.slice(0, 3).map((evt) => {
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
            {eonetEvents.length > 3 && (
              <Expandable label={`${eonetEvents.length - 3} evenements supplementaires`}>
                {eonetEvents.slice(3).map((evt) => {
                  const catInfo = getEONETCategoryInfo(evt.category);
                  return (
                    <div key={evt.id} className="py-2 border-b border-border last:border-b-0">
                      <div className="flex items-center gap-2">
                        <Tag variant={catInfo.variant}>{catInfo.label}</Tag>
                        <span className="text-[11px] font-medium flex-1 truncate">{evt.title}</span>
                      </div>
                    </div>
                  );
                })}
              </Expandable>
            )}
          </SectionCard>
        </Expandable>
      )}

      {/* Earthquakes - NIVEAU 2 expandable par défaut */}
      {earthquakes.length > 0 && (
        <Expandable label="Sismique (USGS)" defaultOpen={false}>
          <SectionCard className="animate-fade-in-up" style={{ animationDelay: "120ms" }}>
            <div className="flex items-center gap-2 mb-3">
              <Tag variant="red">Sismique</Tag>
              <span className="text-[10px] text-muted-foreground">USGS · Rayon 300km</span>
            </div>
            {earthquakes.slice(0, 5).map((eq, i) => (
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
            {earthquakes.length > 5 && (
              <Expandable label={`${earthquakes.length - 5} seismes supplementaires`}>
                {earthquakes.slice(5).map((eq, i) => (
                  <div key={i} className="flex items-center gap-2 py-2 border-b border-border last:border-b-0">
                    <span className="text-[10px] font-mono font-semibold bg-secondary px-1.5 py-0.5 rounded">M{eq.magnitude.toFixed(1)}</span>
                    <span className="text-[10px] text-muted-foreground truncate">{eq.place}</span>
                  </div>
                ))}
              </Expandable>
            )}
          </SectionCard>
        </Expandable>
      )}

      {/* ReliefWeb Alerts - NIVEAU 2 expandable par défaut */}
      {reliefAlerts.length > 0 && (
        <Expandable label="Alertes humanitaires (ReliefWeb)" defaultOpen={false}>
          <SectionCard className="animate-fade-in-up" style={{ animationDelay: "180ms" }}>
            <div className="flex items-center gap-2 mb-3">
              <Tag variant="yellow">ReliefWeb</Tag>
              <span className="text-[10px] text-muted-foreground">Catastrophes et alertes</span>
            </div>
            {reliefAlerts.slice(0, 3).map((alert) => (
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
            {reliefAlerts.length > 3 && (
              <Expandable label={`${reliefAlerts.length - 3} alertes supplementaires`}>
                {reliefAlerts.slice(3).map((alert) => (
                  <div key={alert.id} className="py-2 border-b border-border last:border-b-0">
                    <div className="text-[11px] font-medium truncate">{alert.title}</div>
                  </div>
                ))}
              </Expandable>
            )}
          </SectionCard>
        </Expandable>
      )}
    </div>
  );
}

// ====== SAVOIR TAB ======

function SavoirTab({ country, wiki, wikiImages, location }: { country: CountryData | null; wiki: WikiData | null; wikiImages: WikimediaImage[]; location: GeoResult }) {
  if (!country && !wiki && wikiImages.length === 0) return <EmptyState text="Aucune donnee encyclopedique ou culturelle trouvee." />;

  const langText = country?.languages.join(", ") || "";
  const currText = country?.currencies.map((c) => `${c.name} (${c.symbol})`).join(", ") || "";
  const density = country ? Math.round(country.population / country.area) : 0;

  return (
    <div className="space-y-3">
      {/* 1. Travel brief */}
      {country && (
        <SectionCard className="animate-fade-in-up">
          <div className="flex items-center gap-2 mb-3">
            <Tag variant="purple">Essentiel voyageur</Tag>
          </div>
          <NarrativeBlock text={`Parlez ${langText}. Prevoyez vos ${currText}.`} icon={Globe02Icon} />
          {country.callingCode && (
            <NarrativeBlock text={`Indicatif telephonique : ${country.callingCode}. Fuseaux : ${country.timezones.slice(0, 3).join(", ")}${country.timezones.length > 3 ? "..." : ""}.`} icon={Clock01Icon} />
          )}
          {country.carSide && (
            <NarrativeBlock text={`On roule a ${country.carSide === "right" ? "droite" : "gauche"}. Debut de semaine : ${country.startOfWeek === "monday" ? "lundi" : country.startOfWeek === "sunday" ? "dimanche" : country.startOfWeek}.`} icon={InformationCircleIcon} />
          )}
          {/* Quick facts grid */}
          <div className="grid grid-cols-3 gap-2 mt-3">
            <div className="rounded-xl p-2.5 bg-secondary/40 text-center">
              <div className="text-lg">{country.flagEmoji}</div>
              <div className="text-[9px] text-muted-foreground uppercase mt-0.5">{country.name}</div>
            </div>
            <div className="rounded-xl p-2.5 bg-secondary/40 text-center">
              <div className="text-sm font-serif font-semibold">{density}</div>
              <div className="text-[9px] text-muted-foreground uppercase mt-0.5">hab/km²</div>
            </div>
            <div className="rounded-xl p-2.5 bg-secondary/40 text-center">
              <div className="text-sm font-serif font-semibold">{country.borders.length}</div>
              <div className="text-[9px] text-muted-foreground uppercase mt-0.5">frontieres</div>
            </div>
          </div>
        </SectionCard>
      )}

      {/* 2. Wiki Extract */}
      {wiki && (
        <SectionCard className="animate-fade-in-up" style={{ animationDelay: "40ms" }}>
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
          {/* Show first ~300 chars, expand for full */}
          {wiki.extract.length > 300 ? (
            <>
              <p className="text-[11.5px] leading-[1.7] text-muted-foreground">{wiki.extract.slice(0, 300)}...</p>
              <Expandable label="Lire la suite">
                <p className="text-[11.5px] leading-[1.7] text-muted-foreground">{wiki.extract}</p>
              </Expandable>
            </>
          ) : (
            <p className="text-[11.5px] leading-[1.7] text-muted-foreground">{wiki.extract}</p>
          )}
          {wiki.url && (
            <a href={wiki.url} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1.5 mt-4 text-[11px] font-semibold text-foreground hover:opacity-60 transition-opacity">
              Lire l'article complet
              <HugeiconsIcon icon={ArrowRight01Icon} size={12} />
            </a>
          )}
        </SectionCard>
      )}

      {/* Wikimedia Images - NIVEAU 3 expandable */}
      {wikiImages.length > 0 && (
        <Expandable label="Photos geolocalisees (Wikimedia)" defaultOpen={false}>
          <SectionCard className="animate-fade-in-up" style={{ animationDelay: "80ms" }}>
            <div className="flex items-center gap-2 mb-3">
              <Tag variant="blue">Wikimedia</Tag>
              <span className="text-[10px] text-muted-foreground">{wikiImages.length} photos geolocalisees</span>
            </div>
            <div className="grid grid-cols-2 gap-2">
              {wikiImages.slice(0, 4).map((img, i) => (
                <a key={i} href={img.descriptionUrl || img.url} target="_blank" rel="noopener noreferrer" className="group relative overflow-hidden rounded-lg aspect-[4/3]">
                  <img src={img.thumbUrl} alt={img.title} className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105" loading="lazy" />
                  <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-foreground/60 to-transparent p-2 pt-6">
                    <span className="text-[9px] text-primary-foreground leading-tight line-clamp-2">{img.title}</span>
                  </div>
                </a>
              ))}
            </div>
            {wikiImages.length > 4 && (
              <Expandable label={`${wikiImages.length - 4} photos supplementaires`}>
                <div className="grid grid-cols-2 gap-2">
                  {wikiImages.slice(4).map((img, i) => (
                    <a key={i} href={img.descriptionUrl || img.url} target="_blank" rel="noopener noreferrer" className="group relative overflow-hidden rounded-lg aspect-[4/3]">
                      <img src={img.thumbUrl} alt={img.title} className="w-full h-full object-cover" loading="lazy" />
                      <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-foreground/60 to-transparent p-2 pt-6">
                        <span className="text-[9px] text-primary-foreground leading-tight line-clamp-2">{img.title}</span>
                      </div>
                    </a>
                  ))}
                </div>
              </Expandable>
            )}
          </SectionCard>
        </Expandable>
      )}

      {/* Indicators and Geography - NIVEAU 2 expandable par défaut */}
      <Expandable label="Indicateurs & Geographie" defaultOpen={false}>
        <SectionCard className="animate-fade-in-up" style={{ animationDelay: "160ms" }}>
          <SectionTitle>Indicateurs & Geographie</SectionTitle>
          {country && (
            <div className="grid grid-cols-2 gap-2 mb-3">
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
          )}
          <div className={country ? "border-t border-border pt-3" : ""}>
            <DataRow label="Latitude" value={location.lat.toFixed(6)} mono />
            <DataRow label="Longitude" value={location.lon.toFixed(6)} mono />
            <DataRow label="Hemisphere" value={location.lat >= 0 ? "Nord" : "Sud"} />
          </div>
          <div className="mt-3 px-3 py-2.5 rounded-lg bg-secondary/50">
            <div className="text-[10px] text-muted-foreground leading-relaxed space-y-1.5">
              {country && (
                <div>
                  {density > 200
                    ? "Zone a forte densite. Affluence probable dans les transports et lieux publics. Reservez a l'avance."
                    : density > 50
                    ? "Densite moderee. Equilibre entre espaces urbains et naturels."
                    : "Faible densite. Grands espaces et tranquillite. Verifiez les distances entre les services."}
                </div>
              )}
              <div>
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
          </div>
        </SectionCard>
      </Expandable>

      {/* Country Facts - NIVEAU 3 expandable */}
      {country && (
        <Expandable label="Donnees du pays" defaultOpen={false}>
          <SectionCard className="animate-fade-in-up" style={{ animationDelay: "120ms" }}>
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
            <Expandable label="Donnees detaillees">
              <DataRow label="Superficie" value={`${country.area.toLocaleString("fr")} km\u00B2`} mono />
              <DataRow label="Langues" value={langText} />
              <DataRow label="Monnaie" value={currText} />
              {country.borders.length > 0 && (
                <DataRow label="Frontieres" value={`${country.borders.length} pays (${country.borders.slice(0, 5).join(", ")}${country.borders.length > 5 ? "..." : ""})`} />
              )}
            </Expandable>
          </SectionCard>
        </Expandable>
      )}
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
  const walkability = useMemo(() => computeWalkabilityInsight(pois), [pois]);

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

  const essentialServices = useMemo(() => {
    const essentials: Record<string, OverpassPOI[]> = {
      "Sante": [], "Urgence": [], "Transport": [],
    };
    pois.forEach(p => {
      if (["hospital", "pharmacy", "doctors", "dentist", "veterinary"].includes(p.type)) essentials["Sante"].push(p);
      else if (["police", "fire_station", "defibrillator", "phone"].includes(p.type)) essentials["Urgence"].push(p);
      else if (["stop_position", "station"].includes(p.type)) essentials["Transport"].push(p);
    });
    return Object.entries(essentials).filter(([, v]) => v.length > 0);
  }, [pois]);

  return (
    <div className="space-y-3">
      {/* Walkability insight - NIVEAU 1 */}
      <SectionCard className="animate-fade-in-up">
        <div className="flex items-center gap-2 mb-2">
          <Tag variant={walkability.score === "Excellent" || walkability.score === "Bon" ? "green" : "yellow"}>
            Praticabilite : {walkability.score}
          </Tag>
          <span className="text-[10px] text-muted-foreground">{pois.length} lieux</span>
        </div>
        <p className="text-[11px] text-muted-foreground leading-[1.6] mb-2">{walkability.narrative}</p>
        {walkability.details.length > 0 && (
          <div className="flex flex-wrap gap-1.5">
            {walkability.details.map((d, i) => (
              <span key={i} className="text-[9px] px-2 py-1 rounded-full bg-pastel-green-bg/40 text-pastel-green-text font-medium">✓ {d}</span>
            ))}
          </div>
        )}
      </SectionCard>

      {/* Essential Services - NIVEAU 1 */}
      {essentialServices.length > 0 && (
        <SectionCard className="animate-fade-in-up" style={{ animationDelay: "20ms" }}>
          <div className="flex items-center gap-2 mb-3">
            <Tag variant="red">Services essentiels</Tag>
          </div>
          <div className="grid grid-cols-3 gap-2">
            {essentialServices.map(([category, categoryPois]) => (
              <div key={category} className="rounded-xl p-3 bg-secondary/40">
                <div className="text-[9px] text-muted-foreground uppercase tracking-[0.06em] font-medium mb-1">{category}</div>
                <div className="text-lg font-serif font-semibold mb-1">{categoryPois.length}</div>
                <div className="text-[9px] text-muted-foreground leading-tight">
                  {categoryPois.slice(0, 2).map(p => p.name).join(", ")}
                  {categoryPois.length > 2 && "..."}
                </div>
              </div>
            ))}
          </div>
        </SectionCard>
      )}

      {/* Daily Services - NIVEAU 2 expandable par défaut */}
      {(grouped.some(([name]) => name === "Restauration") || grouped.some(([name]) => name === "Commerces")) && (
        <Expandable label="Services quotidiens" defaultOpen={false}>
          {grouped.filter(([name]) => name === "Restauration" || name === "Commerces").map(([groupName, groupPois], gi) => (
            <SectionCard key={groupName} className="animate-fade-in-up" style={{ animationDelay: `${(gi + 1) * 40}ms` }}>
              <SectionTitle sub={`${groupPois.length} lieu${groupPois.length > 1 ? "x" : ""}`}>{groupName}</SectionTitle>
              {groupPois.slice(0, 3).map((poi) => (
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
                    onClick={() => window.open(`geo:${poi.lat},${poi.lon}?q=${poi.lat},${poi.lon}(${encodeURIComponent(poi.name)})", "_blank")}
                    className="w-7 h-7 rounded-lg bg-secondary flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors flex-shrink-0 ml-2"
                  >
                    <HugeiconsIcon icon={Navigation01Icon} size={13} />
                  </button>
                </div>
              ))}
              {groupPois.length > 3 && (
                <Expandable label={`${groupPois.length - 3} lieux supplementaires`}>
                  {groupPois.slice(3).map((poi) => (
                    <div key={poi.id} className="flex items-center justify-between py-2 border-b border-border last:border-b-0">
                      <div className="min-w-0 flex-1">
                        <div className="text-[11px] font-medium truncate">{poi.name}</div>
                        <div className="flex items-center gap-1.5 mt-0.5">
                          <span className="text-[9px] text-muted-foreground">{POI_LABELS[poi.type] || poi.type}</span>
                          {poi.distance !== undefined && (
                            <span className="text-[9px] text-muted-foreground font-mono">{poi.distance}m</span>
                          )}
                        </div>
                      </div>
                      <button
                        onClick={() => window.open(`geo:${poi.lat},${poi.lon}?q=${poi.lat},${poi.lon}(${encodeURIComponent(poi.name)})`, "_blank")}
                        className="w-6 h-6 rounded bg-secondary flex items-center justify-center text-muted-foreground flex-shrink-0 ml-2"
                      >
                        <HugeiconsIcon icon={Navigation01Icon} size={11} />
                      </button>
                    </div>
                  ))}
                </Expandable>
              )}
            </SectionCard>
          ))}
        </Expandable>
      )}

      {/* Other Categories - NIVEAU 3 expandable */}
      {grouped.filter(([name]) => name === "Culture / Loisirs" || name === "Nature" || name === "Autre").length > 0 && (
        grouped.filter(([name]) => name === "Culture / Loisirs" || name === "Nature" || name === "Autre").map(([groupName, groupPois], gi) => (
          <Expandable key={groupName} label={groupName} defaultOpen={false}>
            <SectionCard className="animate-fade-in-up" style={{ animationDelay: `${(gi + 1) * 40}ms` }}>
              <SectionTitle sub={`${groupPois.length} lieu${groupPois.length > 1 ? "x" : ""}`}>{groupName}</SectionTitle>
              {groupPois.slice(0, 3).map((poi) => (
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
              {groupPois.length > 3 && (
                <Expandable label={`${groupPois.length - 3} lieux supplementaires`}>
                  {groupPois.slice(3).map((poi) => (
                    <div key={poi.id} className="flex items-center justify-between py-2 border-b border-border last:border-b-0">
                      <div className="min-w-0 flex-1">
                        <div className="text-[11px] font-medium truncate">{poi.name}</div>
                        <div className="flex items-center gap-1.5 mt-0.5">
                          <span className="text-[9px] text-muted-foreground">{POI_LABELS[poi.type] || poi.type}</span>
                          {poi.distance !== undefined && (
                            <span className="text-[9px] text-muted-foreground font-mono">{poi.distance}m</span>
                          )}
                        </div>
                      </div>
                      <button
                        onClick={() => window.open(`geo:${poi.lat},${poi.lon}?q=${poi.lat},${poi.lon}(${encodeURIComponent(poi.name)})`, "_blank")}
                        className="w-6 h-6 rounded bg-secondary flex items-center justify-center text-muted-foreground flex-shrink-0 ml-2"
                      >
                        <HugeiconsIcon icon={Navigation01Icon} size={11} />
                      </button>
                    </div>
                  ))}
                </Expandable>
              )}
            </SectionCard>
          </Expandable>
        ))
      )}

      {grouped.length === 0 && (
        <EmptyState text="Aucun service detecte dans un rayon de 800m." />
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

  const families = useMemo(() => {
    const f: Record<string, number> = {};
    species.forEach((s) => {
      if (s.family) f[s.family] = (f[s.family] || 0) + 1;
    });
    return Object.entries(f).sort((a, b) => b[1] - a[1]).slice(0, 6);
  }, [species]);

  const bioIndex = useMemo(() => computeBiodiversityIndex(species), [species]);

  if (species.length === 0) return <EmptyState text="Aucune observation d'especes recensee dans cette zone." />;

  return (
    <div className="space-y-3">
      {/* Biodiversity index */}
      <SectionCard className="animate-fade-in-up">
        <div className="flex items-center gap-2 mb-3">
          <Tag variant={bioIndex.variant}>Biodiversite : {bioIndex.score}</Tag>
          <span className="text-[10px] text-muted-foreground">GBIF</span>
        </div>
        <p className="text-[11px] text-muted-foreground leading-[1.6] mb-3">{bioIndex.narrative}</p>

        {/* Kingdom pills */}
        <div className="flex flex-wrap gap-1.5">
          {Object.entries(kingdoms).map(([k, v]) => (
            <span key={k} className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-pastel-green-bg text-pastel-green-text text-[9px] font-semibold uppercase tracking-wide">
              {k} <span className="opacity-60">{v}</span>
            </span>
          ))}
        </div>
      </SectionCard>

      {/* Families - NIVEAU 2 expandable par défaut */}
      {families.length > 0 && (
        <Expandable label="Familles dominantes" defaultOpen={false}>
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
        </Expandable>
      )}

      {/* Species list - NIVEAU 3 expandable */}
      <Expandable label="Especes observees" defaultOpen={false}>
        <SectionCard className="animate-fade-in-up" style={{ animationDelay: "120ms" }}>
          <SectionTitle sub={`${species.length} especes`}>Especes observees</SectionTitle>
          {species.slice(0, 5).map((sp, i) => (
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
                  {sp.family && <span className="text-[9px] text-muted-foreground">{sp.family}</span>}
                  {sp.order && <span className="text-[9px] text-muted-foreground">· {sp.order}</span>}
                </div>
              </div>
            </div>
          ))}
          {species.length > 5 && (
            <Expandable label={`${species.length - 5} especes supplementaires`}>
              {species.slice(5).map((sp, i) => (
                <div key={i} className="flex items-center gap-2.5 py-2 border-b border-border last:border-b-0">
                  {sp.media ? (
                    <img src={sp.media} alt={sp.name} className="w-8 h-8 rounded-lg object-cover flex-shrink-0" loading="lazy" />
                  ) : (
                    <div className="w-8 h-8 rounded bg-pastel-green-bg flex items-center justify-center flex-shrink-0">
                      <HugeiconsIcon icon={Leaf01Icon} size={12} className="text-pastel-green-text" />
                    </div>
                  )}
                  <div className="min-w-0 flex-1">
                    <div className="text-[11px] font-medium truncate">{sp.name}</div>
                    <div className="text-[9px] text-muted-foreground italic">{sp.scientificName}</div>
                  </div>
                </div>
              ))}
            </Expandable>
          )}
        </SectionCard>
      </Expandable>
    </div>
  );
}

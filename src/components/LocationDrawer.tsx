import { useState, useEffect, useMemo } from "react";
import { Drawer } from "vaul";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  Navigation01Icon,
  ArrowRight01Icon,
  InformationCircleIcon,
  Sun01Icon,
  Drop01Icon,
  WindIcon,
  ThermometerIcon,
  ViewIcon,
  Cloud01Icon,
  Globe02Icon,
  BookOpen01Icon,
  Location01Icon,
  Alert01Icon,
  Leaf01Icon,
  ArrowDown01Icon,
  ArrowUp01Icon,
  Clock01Icon,
  Compass01Icon,
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

const TABS: { id: TabId; label: string }[] = [
  { id: "weather", label: "Meteo" },
  { id: "air", label: "Air" },
  { id: "culture", label: "Culture" },
  { id: "wiki", label: "Savoir" },
  { id: "nearby", label: "Proximite" },
  { id: "nature", label: "Nature" },
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
    <Drawer.Root open={open} onOpenChange={onOpenChange} snapPoints={[0.38, 0.92]} activeSnapPoint={undefined}>
      <Drawer.Portal>
        <Drawer.Overlay className="fixed inset-0 bg-foreground/5 z-40" />
        <Drawer.Content className="fixed bottom-0 left-0 right-0 z-50 flex flex-col rounded-t-xl bg-card border-t border-border max-h-[94vh]">
          {/* Handle */}
          <div className="flex justify-center pt-3 pb-1">
            <div className="w-10 h-1 rounded-full bg-border" />
          </div>

          {/* Header */}
          <div className="px-5 pb-3 border-b border-border">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0 flex-1">
                <h2 className="text-lg font-serif font-semibold text-foreground truncate leading-tight">
                  {location.name}
                </h2>
                <p className="text-xs text-muted-foreground mt-0.5">
                  {[location.state, location.country].filter(Boolean).join(", ")}
                  {location.type && (
                    <span className="ml-2 inline-block px-1.5 py-0.5 rounded bg-secondary text-[10px] uppercase tracking-widest font-medium">
                      {location.type}
                    </span>
                  )}
                </p>
                <p className="text-[10px] text-muted-foreground mt-1 font-mono">
                  {location.lat.toFixed(5)}, {location.lon.toFixed(5)}
                  {weather && ` · ${Math.round(weather.elevation)}m alt.`}
                </p>
              </div>
              <button
                onClick={handleNavigate}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-primary text-primary-foreground text-xs font-medium hover:opacity-90 transition-opacity flex-shrink-0"
                style={{ borderRadius: "6px" }}
              >
                <HugeiconsIcon icon={Navigation01Icon} size={14} />
                Naviguer
              </button>
            </div>

            {/* Quick weather summary */}
            {weather && wInfo && (
              <div className="flex items-center gap-3 mt-3">
                <span className="text-3xl font-serif font-semibold leading-none">
                  {Math.round(weather.current.temperature)}&deg;
                </span>
                <div className="flex flex-col">
                  <span className="text-xs font-medium text-foreground">{wInfo.label}</span>
                  <span className="text-[10px] text-muted-foreground">
                    Ressenti {Math.round(weather.current.feelsLike)}&deg; · Vent {weather.current.windSpeed} km/h
                  </span>
                </div>
                {airQuality && (
                  <div className="ml-auto">
                    <AQIBadge aqi={airQuality.aqi} />
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Tabs */}
          <div className="flex border-b border-border overflow-x-auto hide-scrollbar">
            {TABS.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`px-4 py-2.5 text-xs font-medium whitespace-nowrap transition-colors ${
                  activeTab === tab.id
                    ? "text-foreground border-b-2 border-foreground"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

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
          </div>
        </Drawer.Content>
      </Drawer.Portal>
    </Drawer.Root>
  );
}

// ====== SHARED COMPONENTS ======

function LoadingSpinner() {
  return (
    <div className="flex items-center justify-center py-12">
      <div className="w-5 h-5 border-2 border-border border-t-foreground rounded-full animate-spin" />
    </div>
  );
}

function SectionCard({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={`border border-border rounded-lg p-4 mb-3 bg-card ${className}`}>
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
    <span className={`inline-block px-2 py-0.5 rounded-full text-[10px] uppercase tracking-widest font-medium ${styles[variant]}`}>
      {children}
    </span>
  );
}

function DataRow({ label, value, mono = false }: { label: string; value: string | number; mono?: boolean }) {
  return (
    <div className="flex items-center justify-between py-1.5 border-b border-border last:border-b-0">
      <span className="text-xs text-muted-foreground">{label}</span>
      <span className={`text-sm font-medium text-right max-w-[55%] ${mono ? "font-mono text-xs" : ""}`}>{value}</span>
    </div>
  );
}

function NarrativeBlock({ text, icon }: { text: string; icon?: any }) {
  return (
    <div className="flex items-start gap-2.5 py-2 border-b border-border last:border-b-0">
      <HugeiconsIcon icon={icon || InformationCircleIcon} size={14} className="text-muted-foreground mt-0.5 flex-shrink-0" />
      <p className="text-xs leading-relaxed text-foreground">{text}</p>
    </div>
  );
}

function SectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <div className="text-xs text-muted-foreground uppercase tracking-widest mb-3 font-medium">{children}</div>
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
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium uppercase tracking-wider ${colorMap[info.color]}`}>
      AQI {aqi}
    </span>
  );
}

function EmptyState({ text }: { text: string }) {
  return <p className="text-sm text-muted-foreground py-6 text-center">{text}</p>;
}

// ====== WEATHER TAB ======

function WeatherTab({ weather, narratives }: { weather: WeatherData; narratives: string[] }) {
  const todaySunrise = weather.daily[0]?.sunrise;
  const todaySunset = weather.daily[0]?.sunset;
  const uvInfo = getUVLabel(weather.current.uvIndex);

  return (
    <div className="space-y-3 animate-fade-in-up">
      {/* Narratives */}
      {narratives.length > 0 && (
        <SectionCard>
          <div className="flex items-center gap-2 mb-2">
            <Tag variant="blue">Signal</Tag>
            <span className="text-[10px] text-muted-foreground uppercase tracking-widest">Analyse contextuelle</span>
          </div>
          {narratives.map((n, i) => (
            <NarrativeBlock key={i} text={n} icon={Alert01Icon} />
          ))}
        </SectionCard>
      )}

      {/* Current grid */}
      <SectionCard>
        <SectionTitle>Conditions actuelles</SectionTitle>
        <div className="grid grid-cols-2 gap-3">
          <MiniStat label="Temperature" value={`${weather.current.temperature}\u00B0C`} />
          <MiniStat label="Ressenti" value={`${weather.current.feelsLike}\u00B0C`} />
          <MiniStat label="Humidite" value={`${weather.current.humidity}%`} />
          <MiniStat label="Vent" value={`${weather.current.windSpeed} km/h ${windDirectionToLabel(weather.current.windDirection)}`} />
          <MiniStat label="Pression" value={`${Math.round(weather.current.pressure)} hPa`} />
          <MiniStat label="Nuages" value={`${weather.current.cloudCover}%`} />
          <MiniStat label="Precipitations" value={`${weather.current.precipitation} mm`} />
          <MiniStat
            label="Visibilite"
            value={weather.current.visibility >= 1000
              ? `${(weather.current.visibility / 1000).toFixed(1)} km`
              : `${weather.current.visibility} m`}
          />
        </div>
      </SectionCard>

      {/* UV + Altitude */}
      <SectionCard>
        <SectionTitle>Indices</SectionTitle>
        <DataRow label={`UV (${uvInfo.label})`} value={weather.current.uvIndex} mono />
        <DataRow label="Altitude" value={`${Math.round(weather.elevation)} m`} mono />
        <div className="mt-2 text-[10px] text-muted-foreground leading-relaxed">{uvInfo.signal}</div>
      </SectionCard>

      {/* Ephemerides */}
      {todaySunrise && (
        <SectionCard>
          <SectionTitle>Ephemerides</SectionTitle>
          <div className="flex items-center gap-6">
            <div className="flex items-center gap-2">
              <HugeiconsIcon icon={ArrowUp01Icon} size={14} className="text-pastel-yellow-text" />
              <div>
                <div className="text-[10px] text-muted-foreground">Lever</div>
                <div className="text-sm font-mono font-medium">
                  {new Date(todaySunrise).toLocaleTimeString("fr", { hour: "2-digit", minute: "2-digit" })}
                </div>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <HugeiconsIcon icon={ArrowDown01Icon} size={14} className="text-pastel-red-text" />
              <div>
                <div className="text-[10px] text-muted-foreground">Coucher</div>
                <div className="text-sm font-mono font-medium">
                  {new Date(todaySunset).toLocaleTimeString("fr", { hour: "2-digit", minute: "2-digit" })}
                </div>
              </div>
            </div>
            <div className="ml-auto text-[10px] text-muted-foreground">
              {(() => {
                const rise = new Date(todaySunrise).getTime();
                const set = new Date(todaySunset).getTime();
                const h = Math.floor((set - rise) / 3600000);
                const m = Math.floor(((set - rise) % 3600000) / 60000);
                return `${h}h${m.toString().padStart(2, "0")} de jour`;
              })()}
            </div>
          </div>
        </SectionCard>
      )}

      {/* Hourly */}
      <SectionCard>
        <SectionTitle>Prochaines heures</SectionTitle>
        <div className="flex gap-3 overflow-x-auto hide-scrollbar pb-1">
          {weather.hourly.slice(0, 12).map((h, i) => {
            const hInfo = weatherCodeToLabel(h.weatherCode);
            return (
              <div key={i} className="flex flex-col items-center gap-1.5 min-w-[50px]">
                <span className="text-[10px] text-muted-foreground font-mono">
                  {new Date(h.time).toLocaleTimeString("fr", { hour: "2-digit", minute: "2-digit" })}
                </span>
                <span className="text-[9px] text-muted-foreground text-center leading-tight">{hInfo.label.split(" ")[0]}</span>
                <span className="text-xs font-semibold">{Math.round(h.temperature)}&deg;</span>
                {h.precipitation > 0 && (
                  <span className="text-[9px] text-pastel-blue-text font-mono">{h.precipitation}mm</span>
                )}
                {h.windSpeed > 20 && (
                  <span className="text-[9px] text-muted-foreground font-mono">{Math.round(h.windSpeed)}km/h</span>
                )}
              </div>
            );
          })}
        </div>
      </SectionCard>

      {/* 7-day */}
      <SectionCard>
        <SectionTitle>Previsions 7 jours</SectionTitle>
        {weather.daily.map((d, i) => {
          const dayInfo = weatherCodeToLabel(d.weatherCode);
          const allMin = Math.min(...weather.daily.map((x) => x.tempMin));
          const allMax = Math.max(...weather.daily.map((x) => x.tempMax));
          const range = allMax - allMin || 1;
          return (
            <div key={i} className="flex items-center justify-between py-2 border-b border-border last:border-b-0 gap-2">
              <span className="text-xs font-medium w-14 flex-shrink-0">
                {i === 0 ? "Auj." : new Date(d.date).toLocaleDateString("fr", { weekday: "short" })}
              </span>
              <span className="text-[10px] text-muted-foreground flex-1 truncate">{dayInfo.label}</span>
              {d.precipitationSum > 0 && (
                <span className="text-[9px] text-pastel-blue-text font-mono flex-shrink-0">{d.precipitationSum.toFixed(1)}mm</span>
              )}
              <div className="flex gap-1.5 items-center flex-shrink-0">
                <span className="text-[10px] font-mono text-muted-foreground">{Math.round(d.tempMin)}&deg;</span>
                <div className="w-10 h-1 bg-secondary rounded-full relative">
                  <div
                    className="absolute h-1 bg-foreground rounded-full"
                    style={{
                      left: `${((d.tempMin - allMin) / range) * 100}%`,
                      right: `${100 - ((d.tempMax - allMin) / range) * 100}%`,
                    }}
                  />
                </div>
                <span className="text-[10px] font-mono font-medium">{Math.round(d.tempMax)}&deg;</span>
              </div>
            </div>
          );
        })}
      </SectionCard>
    </div>
  );
}

function MiniStat({ label, value }: { label: string; value: string }) {
  return (
    <div className="bg-secondary/50 rounded-lg p-2.5">
      <div className="text-[10px] text-muted-foreground uppercase tracking-wider">{label}</div>
      <div className="text-sm font-medium mt-0.5 font-mono">{value}</div>
    </div>
  );
}

// ====== AIR TAB ======

function AirTab({ airQuality }: { airQuality: AirQualityData | null }) {
  if (!airQuality) return <EmptyState text="Chargement des donnees de qualite de l'air..." />;

  const aqInfo = getAQILabel(airQuality.aqi);

  const pollutants = [
    { key: "PM2.5", value: airQuality.pm25, unit: "\u00B5g/m\u00B3", desc: "Particules fines respirables, penetrent les poumons", threshold: 25, },
    { key: "PM10", value: airQuality.pm10, unit: "\u00B5g/m\u00B3", desc: "Particules en suspension, poussiere, pollen", threshold: 50, },
    { key: "NO\u2082", value: airQuality.no2, unit: "\u00B5g/m\u00B3", desc: "Dioxyde d'azote, source : trafic routier", threshold: 200, },
    { key: "O\u2083", value: airQuality.ozone, unit: "\u00B5g/m\u00B3", desc: "Ozone tropospherique, irritant respiratoire", threshold: 180, },
    { key: "SO\u2082", value: airQuality.so2, unit: "\u00B5g/m\u00B3", desc: "Dioxyde de soufre, source : industrie", threshold: 350, },
    { key: "CO", value: airQuality.co, unit: "\u00B5g/m\u00B3", desc: "Monoxyde de carbone, gaz inodore dangereux", threshold: 10000, },
  ];

  return (
    <div className="space-y-3 animate-fade-in-up">
      <SectionCard>
        <div className="flex items-center gap-2 mb-2">
          <Tag variant={aqInfo.color}>{aqInfo.label}</Tag>
          <span className="text-xs text-muted-foreground font-mono">AQI europeen {airQuality.aqi}</span>
        </div>
        <NarrativeBlock text={aqInfo.signal} />
      </SectionCard>

      <SectionCard>
        <SectionTitle>Detail des polluants</SectionTitle>
        {pollutants.map((p) => (
          <div key={p.key} className="py-2 border-b border-border last:border-b-0">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium">{p.key}</span>
              <span className="text-xs font-mono">{p.value.toFixed(1)} {p.unit}</span>
            </div>
            <div className="text-[10px] text-muted-foreground mt-0.5">{p.desc}</div>
            {/* Progress bar */}
            <div className="w-full h-1 bg-secondary rounded-full mt-1.5">
              <div
                className="h-1 rounded-full transition-all"
                style={{
                  width: `${Math.min((p.value / p.threshold) * 100, 100)}%`,
                  backgroundColor: p.value / p.threshold > 0.7 ? "hsl(var(--pastel-red-text))" : p.value / p.threshold > 0.4 ? "hsl(var(--pastel-yellow-text))" : "hsl(var(--pastel-green-text))",
                }}
              />
            </div>
          </div>
        ))}
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
    <div className="space-y-3 animate-fade-in-up">
      {/* Cultural narrative */}
      <SectionCard>
        <div className="flex items-center gap-2 mb-2">
          <Tag variant="purple">Identite culturelle</Tag>
        </div>
        <NarrativeBlock text={`Parlez ${langText}. Prevoyez vos ${currText}.`} icon={Globe02Icon} />
        {country.callingCode && (
          <NarrativeBlock text={`Indicatif telephonique : ${country.callingCode}. Fuseaux horaires : ${country.timezones.slice(0, 3).join(", ")}${country.timezones.length > 3 ? "..." : ""}.`} icon={Clock01Icon} />
        )}
      </SectionCard>

      {/* Country card */}
      <SectionCard>
        <div className="flex items-center gap-3 mb-4">
          {country.flag && (
            <img
              src={country.flag}
              alt={`Drapeau ${country.name}`}
              className="w-12 h-8 object-cover rounded"
              style={{ border: "1px solid hsl(0 0% 92%)" }}
            />
          )}
          <div>
            <div className="text-sm font-serif font-semibold">{country.name}</div>
            <div className="text-[10px] text-muted-foreground">{country.officialName}</div>
          </div>
        </div>
        <DataRow label="Capitale" value={country.capital} />
        <DataRow label="Region" value={`${country.subregion}, ${country.region}`} />
        <DataRow label="Population" value={country.population.toLocaleString("fr")} mono />
        <DataRow label="Superficie" value={`${country.area.toLocaleString("fr")} km\u00B2`} mono />
        <DataRow label="Langues officielles" value={langText} />
        <DataRow label="Monnaie" value={currText} />
        <DataRow label="Fuseaux horaires" value={country.timezones.join(", ")} />
        <DataRow label="Indicatif" value={country.callingCode} mono />
      </SectionCard>

      {/* Density insight */}
      <SectionCard>
        <SectionTitle>Indicateurs</SectionTitle>
        <DataRow
          label="Densite de population"
          value={`${Math.round(country.population / country.area)} hab/km\u00B2`}
          mono
        />
        <div className="text-[10px] text-muted-foreground mt-2 leading-relaxed">
          {country.population / country.area > 200
            ? "Zone a forte densite. Prevoyez une affluence dans les transports et lieux publics."
            : country.population / country.area > 50
            ? "Densite moderee. Equilibre entre espaces urbains et naturels."
            : "Faible densite. Grands espaces et tranquillite attendus."}
        </div>
      </SectionCard>
    </div>
  );
}

// ====== WIKI TAB ======

function WikiTab({ wiki, location }: { wiki: WikiData | null; location: GeoResult }) {
  if (!wiki) return <EmptyState text="Aucun article encyclopedique trouve pour ce lieu." />;

  return (
    <div className="space-y-3 animate-fade-in-up">
      <SectionCard>
        <div className="flex items-center gap-2 mb-3">
          <Tag variant="yellow">Encyclopedie</Tag>
          <span className="text-[10px] text-muted-foreground">Wikipedia</span>
        </div>
        {wiki.thumbnail && (
          <img
            src={wiki.thumbnail}
            alt={wiki.title}
            className="w-full h-44 object-cover rounded-lg mb-3"
            style={{ border: "1px solid hsl(0 0% 92%)" }}
            loading="lazy"
          />
        )}
        <h3 className="text-base font-serif font-semibold mb-2 leading-tight">{wiki.title}</h3>
        <p className="text-xs leading-relaxed text-muted-foreground">{wiki.extract}</p>
        {wiki.url && (
          <a
            href={wiki.url}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 mt-3 text-xs font-medium text-foreground hover:opacity-70 transition-opacity"
          >
            Lire l'article complet sur Wikipedia
            <HugeiconsIcon icon={ArrowRight01Icon} size={12} />
          </a>
        )}
      </SectionCard>

      {/* Coordinates context */}
      <SectionCard>
        <SectionTitle>Coordonnees geographiques</SectionTitle>
        <DataRow label="Latitude" value={location.lat.toFixed(6)} mono />
        <DataRow label="Longitude" value={location.lon.toFixed(6)} mono />
        <div className="text-[10px] text-muted-foreground mt-2 leading-relaxed">
          {Math.abs(location.lat) > 60
            ? "Position en zone polaire. Temperatures extremes et jours de duree variable selon la saison."
            : Math.abs(location.lat) > 35
            ? "Zone temperee. Quatre saisons distinctes avec variations climatiques marquees."
            : Math.abs(location.lat) > 23.5
            ? "Zone subtropicale. Climat chaud avec saisons humides et seches."
            : "Zone tropicale. Chaleur constante et humidite elevee toute l'annee."}
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
  // Group POIs by type
  const grouped = useMemo(() => {
    const groups: Record<string, OverpassPOI[]> = {};
    pois.forEach((p) => {
      const cat = p.type;
      if (!groups[cat]) groups[cat] = [];
      groups[cat].push(p);
    });
    return groups;
  }, [pois]);

  // Nearest transport
  const nearestTransport = pois.find((p) => p.type === "stop_position" || p.type === "station");

  return (
    <div className="space-y-3 animate-fade-in-up">
      {/* Smart narrative */}
      {nearestTransport && (
        <SectionCard>
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
        <>
          {/* Summary */}
          <SectionCard>
            <SectionTitle>Services a proximite ({pois.length})</SectionTitle>
            <div className="text-[10px] text-muted-foreground mb-3">
              Rayon de 800m autour de la position selectionnee
            </div>
            {pois.map((poi) => (
              <div key={poi.id} className="flex items-center justify-between py-2 border-b border-border last:border-b-0">
                <div className="min-w-0 flex-1">
                  <div className="text-xs font-medium truncate">{poi.name}</div>
                  <div className="text-[10px] text-muted-foreground">
                    {POI_LABELS[poi.type] || poi.type}
                    {poi.distance !== undefined && ` · ${poi.distance}m`}
                  </div>
                </div>
                <button
                  onClick={() =>
                    window.open(
                      `geo:${poi.lat},${poi.lon}?q=${poi.lat},${poi.lon}(${encodeURIComponent(poi.name)})`,
                      "_blank"
                    )
                  }
                  className="text-muted-foreground hover:text-foreground transition-colors p-1"
                >
                  <HugeiconsIcon icon={Navigation01Icon} size={14} />
                </button>
              </div>
            ))}
          </SectionCard>
        </>
      ) : (
        <EmptyState text="Aucun service detecte dans un rayon de 800m." />
      )}

      {/* Seismic */}
      {earthquakes.length > 0 && (
        <SectionCard>
          <div className="flex items-center gap-2 mb-2">
            <Tag variant="red">Activite sismique</Tag>
            <span className="text-[10px] text-muted-foreground uppercase tracking-widest">Rayon 300km, recent</span>
          </div>
          <NarrativeBlock
            text={`${earthquakes.length} evenement${earthquakes.length > 1 ? "s" : ""} sismique${earthquakes.length > 1 ? "s" : ""} detecte${earthquakes.length > 1 ? "s" : ""} a proximite. Magnitude maximale : M${Math.max(...earthquakes.map((e) => e.magnitude)).toFixed(1)}.`}
            icon={Alert01Icon}
          />
          <div className="mt-2">
            {earthquakes.map((eq, i) => (
              <div key={i} className="flex items-start gap-2 py-2 border-b border-border last:border-b-0">
                <span className="text-xs font-mono font-medium bg-pastel-red-bg text-pastel-red-text px-1.5 py-0.5 rounded mt-0.5 flex-shrink-0">
                  M{eq.magnitude.toFixed(1)}
                </span>
                <div className="min-w-0 flex-1">
                  <div className="text-xs font-medium">{eq.place}</div>
                  <div className="text-[10px] text-muted-foreground">
                    Profondeur {eq.depth.toFixed(0)}km · {new Date(eq.time).toLocaleDateString("fr", { day: "numeric", month: "short", year: "numeric" })}
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
  if (species.length === 0) return <EmptyState text="Aucune observation d'especes recensee dans cette zone." />;

  const kingdoms = useMemo(() => {
    const k: Record<string, number> = {};
    species.forEach((s) => {
      const key = s.kingdom || "Inconnu";
      k[key] = (k[key] || 0) + 1;
    });
    return k;
  }, [species]);

  return (
    <div className="space-y-3 animate-fade-in-up">
      <SectionCard>
        <div className="flex items-center gap-2 mb-2">
          <Tag variant="green">Biodiversite locale</Tag>
          <span className="text-[10px] text-muted-foreground">Source GBIF</span>
        </div>
        <NarrativeBlock
          text={`${species.length} espece${species.length > 1 ? "s" : ""} observee${species.length > 1 ? "s" : ""} dans un rayon de 5km. ${Object.entries(kingdoms).map(([k, v]) => `${v} ${k}`).join(", ")}.`}
          icon={Leaf01Icon}
        />
      </SectionCard>

      <SectionCard>
        <SectionTitle>Especes observees</SectionTitle>
        {species.map((sp, i) => (
          <div key={i} className="py-2.5 border-b border-border last:border-b-0">
            <div className="text-xs font-medium">{sp.name}</div>
            <div className="text-[10px] text-muted-foreground italic">{sp.scientificName}</div>
            <div className="flex items-center gap-2 mt-1">
              {sp.kingdom && (
                <span className="text-[9px] px-1.5 py-0.5 rounded bg-pastel-green-bg text-pastel-green-text uppercase tracking-wider font-medium">
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

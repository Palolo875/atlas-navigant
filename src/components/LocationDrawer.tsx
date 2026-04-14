import { useState, useEffect } from "react";
import { Drawer } from "vaul";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  Location01Icon,
  Navigation01Icon,
  ArrowRight01Icon,
  Thermometer01Icon,
  WindIcon,
  DropIcon,
  Sun01Icon,
  Cloud01Icon,
  ViewIcon,
  ArrowDown01Icon,
  Globe02Icon,
  BookOpen01Icon,
  Hospital01Icon,
  Alert01Icon,
  Leaf01Icon,
  InformationCircleIcon,
  CompassIcon,
  TimeScheduleIcon,
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

    // Fetch all data in parallel
    Promise.allSettled([
      fetchWeather(lat, lon).then(setWeather),
      fetchAirQuality(lat, lon).then(setAirQuality),
      location.country ? fetchCountry(location.country).then(setCountry) : Promise.resolve(),
      fetchWikipedia(location.name).then(setWiki),
      fetchNearbyPOIs(lat, lon).then(setPOIs),
      fetchEarthquakes(lat, lon).then(setEarthquakes),
      fetchGBIF(lat, lon).then(setSpecies),
    ]).finally(() => setLoading(false));
  }, [location]);

  if (!location) return null;

  const narratives = weather ? generateNarrative(weather, airQuality, weather.elevation) : [];

  const handleNavigate = () => {
    window.open(`geo:${location.lat},${location.lon}?q=${location.lat},${location.lon}(${encodeURIComponent(location.name)})`, "_blank");
  };

  const wInfo = weather ? weatherCodeToLabel(weather.current.weatherCode) : null;

  return (
    <Drawer.Root open={open} onOpenChange={onOpenChange} snapPoints={[0.4, 0.85]} activeSnapPoint={undefined}>
      <Drawer.Portal>
        <Drawer.Overlay className="fixed inset-0 bg-foreground/5 z-40" />
        <Drawer.Content className="fixed bottom-0 left-0 right-0 z-50 flex flex-col rounded-t-xl bg-card border-t border-border max-h-[92vh]">
          {/* Handle */}
          <div className="flex justify-center pt-3 pb-1">
            <div className="w-10 h-1 rounded-full bg-border" />
          </div>

          {/* Header */}
          <div className="px-5 pb-3 border-b border-border">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0 flex-1">
                <h2 className="text-lg font-serif font-semibold text-foreground truncate">{location.name}</h2>
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
                className="flex items-center gap-1.5 px-3 py-1.5 bg-primary text-primary-foreground rounded text-xs font-medium hover:opacity-90 transition-opacity flex-shrink-0"
                style={{ borderRadius: "6px" }}
              >
                <HugeiconsIcon icon={Navigation01Icon} size={14} />
                Naviguer
              </button>
            </div>

            {/* Quick weather preview */}
            {weather && wInfo && (
              <div className="flex items-center gap-4 mt-3 text-sm">
                <span className="text-2xl font-serif font-semibold">{Math.round(weather.current.temperature)}&deg;</span>
                <span className="text-xs text-muted-foreground">{wInfo.label}</span>
                <span className="text-xs text-muted-foreground">
                  Ressenti {Math.round(weather.current.feelsLike)}&deg;
                </span>
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
              <div className="flex items-center justify-center py-12">
                <div className="w-5 h-5 border-2 border-border border-t-foreground rounded-full animate-spin" />
              </div>
            ) : (
              <>
                {activeTab === "weather" && weather && <WeatherTab weather={weather} narratives={narratives} />}
                {activeTab === "air" && <AirTab airQuality={airQuality} />}
                {activeTab === "culture" && <CultureTab country={country} location={location} />}
                {activeTab === "wiki" && <WikiTab wiki={wiki} />}
                {activeTab === "nearby" && <NearbyTab pois={pois} earthquakes={earthquakes} location={location} />}
                {activeTab === "nature" && <NatureTab species={species} />}
              </>
            )}
          </div>
        </Drawer.Content>
      </Drawer.Portal>
    </Drawer.Root>
  );
}

// ====== TAB COMPONENTS ======

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
      <span className={`text-sm font-medium ${mono ? "font-mono" : ""}`}>{value}</span>
    </div>
  );
}

function NarrativeBlock({ text }: { text: string }) {
  return (
    <div className="flex items-start gap-2.5 py-2 border-b border-border last:border-b-0">
      <HugeiconsIcon icon={InformationCircleIcon} size={14} className="text-muted-foreground mt-0.5 flex-shrink-0" />
      <p className="text-xs leading-relaxed text-foreground">{text}</p>
    </div>
  );
}

// ---------- Weather Tab ----------
function WeatherTab({ weather, narratives }: { weather: WeatherData; narratives: string[] }) {
  const wInfo = weatherCodeToLabel(weather.current.weatherCode);
  const todaySunrise = weather.daily[0]?.sunrise;
  const todaySunset = weather.daily[0]?.sunset;

  return (
    <div className="space-y-3 animate-fade-in-up">
      {/* Narrative Section */}
      {narratives.length > 0 && (
        <SectionCard>
          <div className="flex items-center gap-2 mb-2">
            <Tag variant="blue">Signal</Tag>
            <span className="text-[10px] text-muted-foreground uppercase tracking-widest">Analyse contextuelle</span>
          </div>
          {narratives.map((n, i) => (
            <NarrativeBlock key={i} text={n} />
          ))}
        </SectionCard>
      )}

      {/* Current conditions */}
      <SectionCard>
        <div className="text-xs text-muted-foreground uppercase tracking-widest mb-3">Conditions actuelles</div>
        <DataRow label="Temperature" value={`${weather.current.temperature}\u00B0C`} mono />
        <DataRow label="Ressenti" value={`${weather.current.feelsLike}\u00B0C`} mono />
        <DataRow label="Humidite" value={`${weather.current.humidity}%`} mono />
        <DataRow label="Vent" value={`${weather.current.windSpeed} km/h ${windDirectionToLabel(weather.current.windDirection)}`} />
        <DataRow label="Pression" value={`${Math.round(weather.current.pressure)} hPa`} mono />
        <DataRow label="Couverture nuageuse" value={`${weather.current.cloudCover}%`} mono />
        <DataRow label="Visibilite" value={weather.current.visibility >= 1000 ? `${(weather.current.visibility / 1000).toFixed(1)} km` : `${weather.current.visibility} m`} />
        <DataRow label="Precipitations" value={`${weather.current.precipitation} mm`} mono />
        <DataRow label="Indice UV" value={`${weather.current.uvIndex} (${getUVLabel(weather.current.uvIndex).label})`} />
        <DataRow label="Altitude" value={`${Math.round(weather.elevation)} m`} mono />
      </SectionCard>

      {/* Ephemerides */}
      {todaySunrise && (
        <SectionCard>
          <div className="text-xs text-muted-foreground uppercase tracking-widest mb-3">Ephemerides</div>
          <DataRow label="Lever du soleil" value={new Date(todaySunrise).toLocaleTimeString("fr", { hour: "2-digit", minute: "2-digit" })} />
          <DataRow label="Coucher du soleil" value={new Date(todaySunset).toLocaleTimeString("fr", { hour: "2-digit", minute: "2-digit" })} />
        </SectionCard>
      )}

      {/* Hourly */}
      <SectionCard>
        <div className="text-xs text-muted-foreground uppercase tracking-widest mb-3">Prochaines heures</div>
        <div className="flex gap-4 overflow-x-auto hide-scrollbar pb-1">
          {weather.hourly.slice(0, 12).map((h, i) => (
            <div key={i} className="flex flex-col items-center gap-1 min-w-[48px]">
              <span className="text-[10px] text-muted-foreground font-mono">
                {new Date(h.time).toLocaleTimeString("fr", { hour: "2-digit", minute: "2-digit" })}
              </span>
              <span className="text-xs font-medium">{Math.round(h.temperature)}&deg;</span>
              {h.precipitation > 0 && (
                <span className="text-[10px] text-pastel-blue-text">{h.precipitation}mm</span>
              )}
            </div>
          ))}
        </div>
      </SectionCard>

      {/* 7-day forecast */}
      <SectionCard>
        <div className="text-xs text-muted-foreground uppercase tracking-widest mb-3">Previsions 7 jours</div>
        {weather.daily.map((d, i) => {
          const dayInfo = weatherCodeToLabel(d.weatherCode);
          return (
            <div key={i} className="flex items-center justify-between py-2 border-b border-border last:border-b-0">
              <span className="text-xs font-medium w-16">
                {i === 0 ? "Auj." : new Date(d.date).toLocaleDateString("fr", { weekday: "short" })}
              </span>
              <span className="text-[10px] text-muted-foreground flex-1 truncate px-2">{dayInfo.label}</span>
              <div className="flex gap-2 items-center">
                <span className="text-xs font-mono">{Math.round(d.tempMin)}&deg;</span>
                <div className="w-12 h-1 bg-secondary rounded-full relative">
                  <div
                    className="absolute h-1 bg-foreground rounded-full"
                    style={{
                      left: `${((d.tempMin - Math.min(...weather.daily.map(x => x.tempMin))) / (Math.max(...weather.daily.map(x => x.tempMax)) - Math.min(...weather.daily.map(x => x.tempMin)))) * 100}%`,
                      right: `${100 - ((d.tempMax - Math.min(...weather.daily.map(x => x.tempMin))) / (Math.max(...weather.daily.map(x => x.tempMax)) - Math.min(...weather.daily.map(x => x.tempMin)))) * 100}%`,
                    }}
                  />
                </div>
                <span className="text-xs font-mono">{Math.round(d.tempMax)}&deg;</span>
              </div>
            </div>
          );
        })}
      </SectionCard>
    </div>
  );
}

// ---------- Air Tab ----------
function AirTab({ airQuality }: { airQuality: AirQualityData | null }) {
  if (!airQuality) return <p className="text-sm text-muted-foreground py-4">Chargement des donnees...</p>;

  const aqInfo = getAQILabel(airQuality.aqi);

  return (
    <div className="space-y-3 animate-fade-in-up">
      <SectionCard>
        <div className="flex items-center gap-2 mb-2">
          <Tag variant={aqInfo.color}>{aqInfo.label}</Tag>
          <span className="text-xs text-muted-foreground font-mono">AQI {airQuality.aqi}</span>
        </div>
        <NarrativeBlock text={aqInfo.signal} />
      </SectionCard>

      <SectionCard>
        <div className="text-xs text-muted-foreground uppercase tracking-widest mb-3">Polluants</div>
        <DataRow label="PM2.5 (particules fines)" value={`${airQuality.pm25.toFixed(1)} \u00B5g/m\u00B3`} mono />
        <DataRow label="PM10" value={`${airQuality.pm10.toFixed(1)} \u00B5g/m\u00B3`} mono />
        <DataRow label="NO\u2082 (dioxyde d'azote)" value={`${airQuality.no2.toFixed(1)} \u00B5g/m\u00B3`} mono />
        <DataRow label="O\u2083 (ozone)" value={`${airQuality.ozone.toFixed(1)} \u00B5g/m\u00B3`} mono />
        <DataRow label="SO\u2082" value={`${airQuality.so2.toFixed(1)} \u00B5g/m\u00B3`} mono />
        <DataRow label="CO" value={`${airQuality.co.toFixed(1)} \u00B5g/m\u00B3`} mono />
      </SectionCard>
    </div>
  );
}

// ---------- Culture Tab ----------
function CultureTab({ country, location }: { country: CountryData | null; location: GeoResult }) {
  if (!country) return <p className="text-sm text-muted-foreground py-4">Donnees pays indisponibles pour cette position.</p>;

  const langText = country.languages.join(", ");
  const currText = country.currencies.map(c => `${c.name} (${c.symbol})`).join(", ");

  return (
    <div className="space-y-3 animate-fade-in-up">
      <SectionCard>
        <div className="flex items-center gap-2 mb-2">
          <Tag variant="purple">Identite culturelle</Tag>
        </div>
        <NarrativeBlock text={`Parlez ${langText}. Prevoyez vos ${currText}.`} />
      </SectionCard>

      <SectionCard>
        <div className="flex items-center gap-3 mb-3">
          {country.flag && (
            <img src={country.flag} alt={country.name} className="w-10 h-7 object-cover rounded" style={{ border: "1px solid hsl(0 0% 92%)" }} />
          )}
          <div>
            <div className="text-sm font-medium">{country.name}</div>
            <div className="text-[10px] text-muted-foreground">{country.officialName}</div>
          </div>
        </div>
        <DataRow label="Capitale" value={country.capital} />
        <DataRow label="Region" value={`${country.subregion}, ${country.region}`} />
        <DataRow label="Population" value={country.population.toLocaleString("fr")} mono />
        <DataRow label="Superficie" value={`${country.area.toLocaleString("fr")} km\u00B2`} mono />
        <DataRow label="Langues" value={langText} />
        <DataRow label="Monnaie" value={currText} />
        <DataRow label="Fuseaux horaires" value={country.timezones.join(", ")} />
        <DataRow label="Indicatif" value={country.callingCode} mono />
      </SectionCard>
    </div>
  );
}

// ---------- Wiki Tab ----------
function WikiTab({ wiki }: { wiki: WikiData | null }) {
  if (!wiki) return <p className="text-sm text-muted-foreground py-4">Aucun article encyclopedique trouve pour ce lieu.</p>;

  return (
    <div className="space-y-3 animate-fade-in-up">
      <SectionCard>
        <div className="flex items-center gap-2 mb-2">
          <Tag variant="yellow">Encyclopedie</Tag>
        </div>
        {wiki.thumbnail && (
          <img
            src={wiki.thumbnail}
            alt={wiki.title}
            className="w-full h-40 object-cover rounded-lg mb-3"
            style={{ border: "1px solid hsl(0 0% 92%)" }}
          />
        )}
        <h3 className="text-base font-serif font-semibold mb-2">{wiki.title}</h3>
        <p className="text-xs leading-relaxed text-muted-foreground">{wiki.extract}</p>
        {wiki.url && (
          <a
            href={wiki.url}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 mt-3 text-xs font-medium text-foreground hover:opacity-70 transition-opacity"
          >
            Lire sur Wikipedia
            <HugeiconsIcon icon={ArrowRight01Icon} size={12} />
          </a>
        )}
      </SectionCard>
    </div>
  );
}

// ---------- Nearby Tab ----------
function NearbyTab({ pois, earthquakes, location }: { pois: OverpassPOI[]; earthquakes: EarthquakeData[]; location: GeoResult }) {
  const poiTypeLabel: Record<string, string> = {
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
    information: "Information",
  };

  return (
    <div className="space-y-3 animate-fade-in-up">
      {pois.length > 0 ? (
        <SectionCard>
          <div className="text-xs text-muted-foreground uppercase tracking-widest mb-3">Services a proximite</div>
          {pois.map((poi) => (
            <div key={poi.id} className="flex items-center justify-between py-2 border-b border-border last:border-b-0">
              <div className="min-w-0 flex-1">
                <div className="text-xs font-medium truncate">{poi.name}</div>
                <div className="text-[10px] text-muted-foreground">
                  {poiTypeLabel[poi.type] || poi.type}
                  {poi.distance !== undefined && ` · ${poi.distance}m`}
                </div>
              </div>
              <button
                onClick={() => window.open(`geo:${poi.lat},${poi.lon}?q=${poi.lat},${poi.lon}(${encodeURIComponent(poi.name)})`, "_blank")}
                className="text-[10px] text-muted-foreground hover:text-foreground transition-colors"
              >
                <HugeiconsIcon icon={Navigation01Icon} size={14} />
              </button>
            </div>
          ))}
        </SectionCard>
      ) : (
        <p className="text-sm text-muted-foreground py-2">Aucun service detecte dans un rayon de 500m.</p>
      )}

      {/* Earthquakes */}
      {earthquakes.length > 0 && (
        <SectionCard>
          <div className="flex items-center gap-2 mb-3">
            <Tag variant="red">Sismicite</Tag>
            <span className="text-[10px] text-muted-foreground uppercase tracking-widest">Rayon 300km</span>
          </div>
          {earthquakes.map((eq, i) => (
            <div key={i} className="flex items-start gap-2 py-2 border-b border-border last:border-b-0">
              <span className="text-xs font-mono font-medium bg-pastel-red-bg text-pastel-red-text px-1.5 py-0.5 rounded mt-0.5">
                M{eq.magnitude.toFixed(1)}
              </span>
              <div className="min-w-0 flex-1">
                <div className="text-xs font-medium">{eq.place}</div>
                <div className="text-[10px] text-muted-foreground">
                  Profondeur {eq.depth.toFixed(0)}km · {new Date(eq.time).toLocaleDateString("fr")}
                </div>
              </div>
            </div>
          ))}
        </SectionCard>
      )}
    </div>
  );
}

// ---------- Nature Tab ----------
function NatureTab({ species }: { species: GBIFSpecies[] }) {
  if (species.length === 0) return <p className="text-sm text-muted-foreground py-4">Aucune observation d'especes recensee dans cette zone.</p>;

  return (
    <div className="space-y-3 animate-fade-in-up">
      <SectionCard>
        <div className="flex items-center gap-2 mb-3">
          <Tag variant="green">Biodiversite</Tag>
          <span className="text-[10px] text-muted-foreground">Source GBIF</span>
        </div>
        {species.map((sp, i) => (
          <div key={i} className="py-2 border-b border-border last:border-b-0">
            <div className="text-xs font-medium">{sp.name}</div>
            <div className="text-[10px] text-muted-foreground italic">{sp.scientificName}</div>
            <div className="text-[10px] text-muted-foreground">{[sp.kingdom, sp.phylum].filter(Boolean).join(" · ")}</div>
          </div>
        ))}
      </SectionCard>
    </div>
  );
}

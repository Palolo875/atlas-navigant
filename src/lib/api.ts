// ============================================
// API Layer — All free, no-key APIs
// ============================================

export interface GeoResult {
  name: string;
  country: string;
  state?: string;
  lat: number;
  lon: number;
  type?: string;
  osm_id?: number;
  osm_type?: string;
}

export async function searchPhoton(query: string): Promise<GeoResult[]> {
  const res = await fetch(
    `https://photon.komoot.io/api/?q=${encodeURIComponent(query)}&limit=6&lang=fr`
  );
  const data = await res.json();
  return data.features.map((f: any) => ({
    name: f.properties.name || f.properties.street || query,
    country: f.properties.country || "",
    state: f.properties.state,
    lat: f.geometry.coordinates[1],
    lon: f.geometry.coordinates[0],
    type: f.properties.osm_value || f.properties.type,
    osm_id: f.properties.osm_id,
    osm_type: f.properties.osm_type,
  }));
}

export async function reverseGeocode(lat: number, lon: number): Promise<GeoResult | null> {
  const res = await fetch(
    `https://photon.komoot.io/reverse?lat=${lat}&lon=${lon}&lang=fr`
  );
  const data = await res.json();
  if (!data.features?.length) return null;
  const f = data.features[0];
  return {
    name: f.properties.name || f.properties.street || f.properties.city || "Lieu inconnu",
    country: f.properties.country || "",
    state: f.properties.state,
    lat,
    lon,
    type: f.properties.osm_value || f.properties.type,
    osm_id: f.properties.osm_id,
    osm_type: f.properties.osm_type,
  };
}

// ---------- Open-Meteo Weather (enriched) ----------
export interface WeatherData {
  current: {
    temperature: number;
    feelsLike: number;
    humidity: number;
    windSpeed: number;
    windDirection: number;
    windGusts: number;
    weatherCode: number;
    isDay: boolean;
    cloudCover: number;
    pressure: number;
    precipitation: number;
    uvIndex: number;
    visibility: number;
    dewPoint: number;
  };
  daily: {
    date: string;
    tempMax: number;
    tempMin: number;
    weatherCode: number;
    precipitationSum: number;
    precipitationHours: number;
    windSpeedMax: number;
    windGustsMax: number;
    uvIndexMax: number;
    sunrise: string;
    sunset: string;
    dominantWindDir: number;
    precipitationProbMax: number;
  }[];
  hourly: {
    time: string;
    temperature: number;
    weatherCode: number;
    precipitation: number;
    precipitationProb: number;
    windSpeed: number;
    windGusts: number;
    humidity: number;
    cloudCover: number;
    feelsLike: number;
  }[];
  elevation: number;
}

export async function fetchWeather(lat: number, lon: number): Promise<WeatherData> {
  const params = new URLSearchParams({
    latitude: lat.toString(),
    longitude: lon.toString(),
    current: "temperature_2m,relative_humidity_2m,apparent_temperature,weather_code,wind_speed_10m,wind_direction_10m,wind_gusts_10m,is_day,cloud_cover,surface_pressure,precipitation,uv_index,visibility,dew_point_2m",
    daily: "temperature_2m_max,temperature_2m_min,weather_code,precipitation_sum,precipitation_hours,wind_speed_10m_max,wind_gusts_10m_max,uv_index_max,sunrise,sunset,dominant_wind_direction,precipitation_probability_max",
    hourly: "temperature_2m,weather_code,precipitation,precipitation_probability,wind_speed_10m,wind_gusts_10m,relative_humidity_2m,cloud_cover,apparent_temperature",
    timezone: "auto",
    forecast_days: "7",
    forecast_hours: "24",
  });
  const res = await fetch(`https://api.open-meteo.com/v1/forecast?${params}`);
  const d = await res.json();
  return {
    elevation: d.elevation,
    current: {
      temperature: d.current.temperature_2m,
      feelsLike: d.current.apparent_temperature,
      humidity: d.current.relative_humidity_2m,
      windSpeed: d.current.wind_speed_10m,
      windDirection: d.current.wind_direction_10m,
      windGusts: d.current.wind_gusts_10m ?? 0,
      weatherCode: d.current.weather_code,
      isDay: d.current.is_day === 1,
      cloudCover: d.current.cloud_cover,
      pressure: d.current.surface_pressure,
      precipitation: d.current.precipitation,
      uvIndex: d.current.uv_index,
      visibility: d.current.visibility,
      dewPoint: d.current.dew_point_2m ?? 0,
    },
    daily: d.daily.time.map((t: string, i: number) => ({
      date: t,
      tempMax: d.daily.temperature_2m_max[i],
      tempMin: d.daily.temperature_2m_min[i],
      weatherCode: d.daily.weather_code[i],
      precipitationSum: d.daily.precipitation_sum[i],
      precipitationHours: d.daily.precipitation_hours?.[i] ?? 0,
      windSpeedMax: d.daily.wind_speed_10m_max[i],
      windGustsMax: d.daily.wind_gusts_10m_max?.[i] ?? 0,
      uvIndexMax: d.daily.uv_index_max[i],
      sunrise: d.daily.sunrise[i],
      sunset: d.daily.sunset[i],
      dominantWindDir: d.daily.dominant_wind_direction?.[i] ?? 0,
      precipitationProbMax: d.daily.precipitation_probability_max?.[i] ?? 0,
    })),
    hourly: d.hourly.time.map((t: string, i: number) => ({
      time: t,
      temperature: d.hourly.temperature_2m[i],
      weatherCode: d.hourly.weather_code[i],
      precipitation: d.hourly.precipitation[i],
      precipitationProb: d.hourly.precipitation_probability?.[i] ?? 0,
      windSpeed: d.hourly.wind_speed_10m[i],
      windGusts: d.hourly.wind_gusts_10m?.[i] ?? 0,
      humidity: d.hourly.relative_humidity_2m?.[i] ?? 0,
      cloudCover: d.hourly.cloud_cover?.[i] ?? 0,
      feelsLike: d.hourly.apparent_temperature?.[i] ?? 0,
    })),
  };
}

// ---------- Open-Meteo Air Quality (enriched) ----------
export interface AirQualityData {
  aqi: number;
  pm25: number;
  pm10: number;
  no2: number;
  ozone: number;
  so2: number;
  co: number;
  dust: number;
  uvIndex: number;
  uvIndexClearSky: number;
  allergenIndex: {
    alder: number;
    birch: number;
    grass: number;
    mugwort: number;
    olive: number;
    ragweed: number;
  };
}

export async function fetchAirQuality(lat: number, lon: number): Promise<AirQualityData> {
  const params = new URLSearchParams({
    latitude: lat.toString(),
    longitude: lon.toString(),
    current: "european_aqi,pm2_5,pm10,nitrogen_dioxide,ozone,sulphur_dioxide,carbon_monoxide,dust,uv_index,uv_index_clear_sky,alder_pollen,birch_pollen,grass_pollen,mugwort_pollen,olive_pollen,ragweed_pollen",
  });
  const res = await fetch(`https://air-quality-api.open-meteo.com/v1/air-quality?${params}`);
  const d = await res.json();
  return {
    aqi: d.current.european_aqi ?? 0,
    pm25: d.current.pm2_5 ?? 0,
    pm10: d.current.pm10 ?? 0,
    no2: d.current.nitrogen_dioxide ?? 0,
    ozone: d.current.ozone ?? 0,
    so2: d.current.sulphur_dioxide ?? 0,
    co: d.current.carbon_monoxide ?? 0,
    dust: d.current.dust ?? 0,
    uvIndex: d.current.uv_index ?? 0,
    uvIndexClearSky: d.current.uv_index_clear_sky ?? 0,
    allergenIndex: {
      alder: d.current.alder_pollen ?? 0,
      birch: d.current.birch_pollen ?? 0,
      grass: d.current.grass_pollen ?? 0,
      mugwort: d.current.mugwort_pollen ?? 0,
      olive: d.current.olive_pollen ?? 0,
      ragweed: d.current.ragweed_pollen ?? 0,
    },
  };
}

// ---------- RestCountries ----------
export interface CountryData {
  name: string;
  officialName: string;
  capital: string;
  population: number;
  area: number;
  languages: string[];
  currencies: { name: string; symbol: string }[];
  flag: string;
  flagEmoji: string;
  region: string;
  subregion: string;
  timezones: string[];
  callingCode: string;
  borders: string[];
  continents: string[];
  gini?: number;
  carSide: string;
  startOfWeek: string;
  coatOfArms?: string;
}

export async function fetchCountry(countryName: string): Promise<CountryData | null> {
  try {
    const res = await fetch(
      `https://restcountries.com/v3.1/name/${encodeURIComponent(countryName)}?fields=name,capital,population,area,languages,currencies,flags,flag,region,subregion,timezones,idd,borders,continents,gini,car,startOfWeek,coatOfArms`
    );
    if (!res.ok) return null;
    const data = await res.json();
    const c = data[0];
    const giniVal = c.gini ? Object.values(c.gini)[0] as number : undefined;
    return {
      name: c.name.common,
      officialName: c.name.official,
      capital: c.capital?.[0] || "",
      population: c.population,
      area: c.area,
      languages: Object.values(c.languages || {}),
      currencies: Object.values(c.currencies || {}).map((cur: any) => ({
        name: cur.name,
        symbol: cur.symbol,
      })),
      flag: c.flags?.svg || c.flags?.png || "",
      flagEmoji: c.flag || "",
      region: c.region,
      subregion: c.subregion,
      timezones: c.timezones,
      callingCode: c.idd?.root ? `${c.idd.root}${c.idd.suffixes?.[0] || ""}` : "",
      borders: c.borders || [],
      continents: c.continents || [],
      gini: giniVal,
      carSide: c.car?.side || "",
      startOfWeek: c.startOfWeek || "",
      coatOfArms: c.coatOfArms?.svg || c.coatOfArms?.png || "",
    };
  } catch {
    return null;
  }
}

// ---------- Wikipedia ----------
export interface WikiData {
  title: string;
  extract: string;
  thumbnail?: string;
  url: string;
}

export async function fetchWikipedia(query: string, lang = "fr"): Promise<WikiData | null> {
  try {
    const res = await fetch(
      `https://${lang}.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(query)}`
    );
    if (!res.ok) {
      if (lang === "fr") return fetchWikipedia(query, "en");
      return null;
    }
    const d = await res.json();
    if (d.type === "disambiguation" || !d.extract) {
      if (lang === "fr") return fetchWikipedia(query, "en");
      return null;
    }
    return {
      title: d.title,
      extract: d.extract,
      thumbnail: d.thumbnail?.source,
      url: d.content_urls?.desktop?.page || "",
    };
  } catch {
    return null;
  }
}

// ---------- Wikimedia Commons Geo-Images ----------
export interface WikimediaImage {
  title: string;
  url: string;
  thumbUrl: string;
  descriptionUrl: string;
}

export async function fetchWikimediaImages(lat: number, lon: number, limit = 8): Promise<WikimediaImage[]> {
  try {
    const res = await fetch(
      `https://commons.wikimedia.org/w/api.php?action=query&generator=geosearch&ggscoord=${lat}|${lon}&ggsradius=1000&ggslimit=${limit}&prop=imageinfo&iiprop=url|extmetadata&iiurlwidth=400&format=json&origin=*`
    );
    const data = await res.json();
    if (!data.query?.pages) return [];
    return Object.values(data.query.pages)
      .filter((p: any) => p.imageinfo?.[0])
      .map((p: any) => ({
        title: p.title.replace("File:", "").replace(/\.[^.]+$/, ""),
        url: p.imageinfo[0].url,
        thumbUrl: p.imageinfo[0].thumburl || p.imageinfo[0].url,
        descriptionUrl: p.imageinfo[0].descriptionurl || "",
      }));
  } catch {
    return [];
  }
}

// ---------- Overpass (POIs nearby) ----------
export interface OverpassPOI {
  id: number;
  name: string;
  type: string;
  lat: number;
  lon: number;
  distance?: number;
  tags: Record<string, string>;
}

export async function fetchNearbyPOIs(lat: number, lon: number, radius = 500): Promise<OverpassPOI[]> {
  const query = `
    [out:json][timeout:10];
    (
      node["amenity"~"hospital|pharmacy|restaurant|cafe|bank|fuel|school|library|police|fire_station|post_office|place_of_worship|cinema|theatre|dentist|doctors|veterinary"](around:${radius},${lat},${lon});
      node["tourism"~"hotel|museum|viewpoint|attraction|information|gallery|camp_site|hostel"](around:${radius},${lat},${lon});
      node["shop"~"supermarket|convenience|bakery|butcher"](around:${radius},${lat},${lon});
      node["public_transport"="stop_position"](around:${radius},${lat},${lon});
      node["railway"="station"](around:${radius},${lat},${lon});
      node["emergency"~"defibrillator|phone"](around:${radius},${lat},${lon});
      node["natural"~"peak|spring|cave_entrance|waterfall"](around:${radius},${lat},${lon});
    );
    out body 30;
  `;
  try {
    const res = await fetch("https://overpass-api.de/api/interpreter", {
      method: "POST",
      body: `data=${encodeURIComponent(query)}`,
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
    });
    const data = await res.json();
    return (data.elements || [])
      .filter((e: any) => e.tags?.name)
      .map((e: any) => {
        const dist = haversine(lat, lon, e.lat, e.lon);
        return {
          id: e.id,
          name: e.tags.name,
          type: e.tags.amenity || e.tags.tourism || e.tags.shop || e.tags.public_transport || e.tags.railway || e.tags.emergency || e.tags.natural || "lieu",
          lat: e.lat,
          lon: e.lon,
          distance: Math.round(dist),
          tags: e.tags,
        };
      })
      .sort((a: OverpassPOI, b: OverpassPOI) => (a.distance || 0) - (b.distance || 0));
  } catch {
    return [];
  }
}

// ---------- USGS Earthquake ----------
export interface EarthquakeData {
  title: string;
  magnitude: number;
  place: string;
  time: number;
  depth: number;
  url: string;
  tsunami: boolean;
  felt: number | null;
  alert: string | null;
  significance: number;
}

export async function fetchEarthquakes(lat: number, lon: number): Promise<EarthquakeData[]> {
  try {
    const res = await fetch(
      `https://earthquake.usgs.gov/fdsnws/event/1/query?format=geojson&latitude=${lat}&longitude=${lon}&maxradiuskm=300&limit=10&orderby=time`
    );
    const data = await res.json();
    return (data.features || []).map((f: any) => ({
      title: f.properties.title,
      magnitude: f.properties.mag,
      place: f.properties.place,
      time: f.properties.time,
      depth: f.geometry.coordinates[2],
      url: f.properties.url,
      tsunami: !!f.properties.tsunami,
      felt: f.properties.felt,
      alert: f.properties.alert,
      significance: f.properties.sig || 0,
    }));
  } catch {
    return [];
  }
}

// ---------- NASA EONET (Natural Events) ----------
export interface EONETEvent {
  id: string;
  title: string;
  description: string;
  category: string;
  date: string;
  lat: number;
  lon: number;
  magnitudeValue: number | null;
  magnitudeUnit: string;
  source: string;
  sourceUrl: string;
}

export async function fetchEONET(lat: number, lon: number, radiusKm = 500): Promise<EONETEvent[]> {
  try {
    const res = await fetch(
      `https://eonet.gsfc.nasa.gov/api/v3/events?status=open&limit=20&days=30`
    );
    const data = await res.json();
    return (data.events || [])
      .filter((e: any) => {
        if (!e.geometry?.length) return false;
        const geo = e.geometry[e.geometry.length - 1];
        const coords = geo.coordinates;
        if (!coords) return false;
        const dist = haversine(lat, lon, coords[1], coords[0]);
        return dist <= radiusKm * 1000;
      })
      .map((e: any) => {
        const geo = e.geometry[e.geometry.length - 1];
        const mag = geo.magnitudeValue;
        return {
          id: e.id,
          title: e.title,
          description: e.description || "",
          category: e.categories?.[0]?.title || "Inconnu",
          date: geo.date,
          lat: geo.coordinates[1],
          lon: geo.coordinates[0],
          magnitudeValue: mag ?? null,
          magnitudeUnit: geo.magnitudeUnit || "",
          source: e.sources?.[0]?.id || "",
          sourceUrl: e.sources?.[0]?.url || "",
        };
      });
  } catch {
    return [];
  }
}

// ---------- ReliefWeb (Disasters & Alerts) ----------
export interface ReliefWebAlert {
  id: number;
  title: string;
  date: string;
  status: string;
  country: string;
  type: string;
  url: string;
  source: string;
}

export async function fetchReliefWeb(countryName: string): Promise<ReliefWebAlert[]> {
  if (!countryName) return [];
  try {
    const res = await fetch("https://api.reliefweb.int/v1/disasters?appname=atlas-weather&limit=8&sort[]=date:desc&filter[field]=country.name&filter[value]=" + encodeURIComponent(countryName) + "&fields[include][]=name&fields[include][]=date.event&fields[include][]=status&fields[include][]=country.name&fields[include][]=type.name&fields[include][]=url&fields[include][]=primary_country.name");
    if (!res.ok) return [];
    const data = await res.json();
    return (data.data || []).map((d: any) => ({
      id: d.id,
      title: d.fields?.name || "",
      date: d.fields?.date?.event || "",
      status: d.fields?.status || "",
      country: d.fields?.primary_country?.name || d.fields?.country?.[0]?.name || countryName,
      type: d.fields?.type?.[0]?.name || "",
      url: d.fields?.url || `https://reliefweb.int/disaster/${d.id}`,
      source: "ReliefWeb",
    }));
  } catch {
    return [];
  }
}

// ---------- GBIF Species ----------
export interface GBIFSpecies {
  name: string;
  scientificName: string;
  kingdom: string;
  phylum: string;
  class: string;
  order: string;
  family: string;
  count: number;
  media?: string;
}

export async function fetchGBIF(lat: number, lon: number): Promise<GBIFSpecies[]> {
  try {
    const res = await fetch(
      `https://api.gbif.org/v1/occurrence/search?decimalLatitude=${(lat - 0.05).toFixed(4)},${(lat + 0.05).toFixed(4)}&decimalLongitude=${(lon - 0.05).toFixed(4)},${(lon + 0.05).toFixed(4)}&limit=20&hasCoordinate=true&mediaType=StillImage`
    );
    const data = await res.json();
    const seen = new Set<string>();
    return (data.results || [])
      .filter((r: any) => {
        if (!r.species || seen.has(r.species)) return false;
        seen.add(r.species);
        return true;
      })
      .slice(0, 15)
      .map((r: any) => ({
        name: r.vernacularName || r.species,
        scientificName: r.scientificName || r.species,
        kingdom: r.kingdom || "",
        phylum: r.phylum || "",
        class: r.class || "",
        order: r.order || "",
        family: r.family || "",
        count: r.individualCount || 1,
        media: r.media?.[0]?.identifier || undefined,
      }));
  } catch {
    return [];
  }
}

// ---------- Helpers ----------
export function haversine(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371000;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) * Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

export function weatherCodeToLabel(code: number): { label: string; icon: string } {
  const map: Record<number, { label: string; icon: string }> = {
    0: { label: "Ciel dégagé", icon: "sun" },
    1: { label: "Principalement dégagé", icon: "sun" },
    2: { label: "Partiellement nuageux", icon: "cloud-sun" },
    3: { label: "Couvert", icon: "cloud" },
    45: { label: "Brouillard", icon: "fog" },
    48: { label: "Brouillard givrant", icon: "fog" },
    51: { label: "Bruine légère", icon: "drizzle" },
    53: { label: "Bruine modérée", icon: "drizzle" },
    55: { label: "Bruine dense", icon: "drizzle" },
    56: { label: "Bruine verglaçante", icon: "drizzle" },
    57: { label: "Bruine verglaçante forte", icon: "drizzle" },
    61: { label: "Pluie faible", icon: "rain" },
    63: { label: "Pluie modérée", icon: "rain" },
    65: { label: "Pluie forte", icon: "rain" },
    66: { label: "Pluie verglaçante", icon: "rain" },
    67: { label: "Pluie verglaçante forte", icon: "rain" },
    71: { label: "Neige faible", icon: "snow" },
    73: { label: "Neige modérée", icon: "snow" },
    75: { label: "Neige forte", icon: "snow" },
    77: { label: "Grains de neige", icon: "snow" },
    80: { label: "Averses légères", icon: "rain" },
    81: { label: "Averses modérées", icon: "rain" },
    82: { label: "Averses violentes", icon: "rain" },
    85: { label: "Averses de neige", icon: "snow" },
    86: { label: "Fortes averses de neige", icon: "snow" },
    95: { label: "Orage", icon: "storm" },
    96: { label: "Orage grêle", icon: "storm" },
    99: { label: "Orage forte grêle", icon: "storm" },
  };
  return map[code] || { label: "Inconnu", icon: "cloud" };
}

export function getAQILabel(aqi: number): { label: string; color: "green" | "yellow" | "red" | "purple"; signal: string } {
  if (aqi <= 20) return { label: "Excellent", color: "green", signal: "L'air est pur. Conditions idéales pour explorer." };
  if (aqi <= 40) return { label: "Bon", color: "green", signal: "Qualité de l'air satisfaisante. Pas de risque particulier." };
  if (aqi <= 60) return { label: "Modéré", color: "yellow", signal: "Qualité acceptable. Personnes sensibles : limitez l'effort prolongé." };
  if (aqi <= 80) return { label: "Médiocre", color: "yellow", signal: "Impact possible sur les personnes sensibles." };
  if (aqi <= 100) return { label: "Mauvais", color: "red", signal: "Risque sanitaire. Réduisez les activités en extérieur." };
  return { label: "Très mauvais", color: "purple", signal: "Danger sanitaire. Restez à l'intérieur si possible." };
}

export function getUVLabel(uv: number): { label: string; signal: string } {
  if (uv <= 2) return { label: "Faible", signal: "Aucune protection nécessaire." };
  if (uv <= 5) return { label: "Modéré", signal: "Portez des lunettes de soleil. Crème solaire conseillée." };
  if (uv <= 7) return { label: "Fort", signal: "Protection indispensable. Évitez l'exposition 12h-16h." };
  if (uv <= 10) return { label: "Très fort", signal: "Risque de brûlure en moins de 15 minutes." };
  return { label: "Extrême", signal: "Danger immédiat. Restez à l'ombre." };
}

export function windDirectionToLabel(deg: number): string {
  const dirs = ["N", "NNE", "NE", "ENE", "E", "ESE", "SE", "SSE", "S", "SSO", "SO", "OSO", "O", "ONO", "NO", "NNO"];
  return dirs[Math.round(deg / 22.5) % 16];
}

export function getDewPointComfort(dewPoint: number): { label: string; signal: string } {
  if (dewPoint < 10) return { label: "Sec", signal: "Air sec et confortable. Hydratez votre peau." };
  if (dewPoint < 16) return { label: "Confortable", signal: "Niveau d'humidité agréable." };
  if (dewPoint < 18) return { label: "Légèrement humide", signal: "Sensation de moiteur possible à l'effort." };
  if (dewPoint < 21) return { label: "Humide", signal: "Transpiration difficile à évaporer. Ralentissez." };
  if (dewPoint < 24) return { label: "Oppressant", signal: "Inconfort marqué. Risque de coup de chaleur à l'effort." };
  return { label: "Dangereux", signal: "Chaleur humide extrême. Restez au frais." };
}

export function getPollenLevel(value: number): { label: string; color: "green" | "yellow" | "red" } {
  if (value === 0) return { label: "Nul", color: "green" };
  if (value < 20) return { label: "Faible", color: "green" };
  if (value < 50) return { label: "Modéré", color: "yellow" };
  return { label: "Élevé", color: "red" };
}

export function generateNarrative(
  weather: WeatherData,
  airQuality: AirQualityData | null,
  elevation: number
): string[] {
  const narratives: string[] = [];
  const { current } = weather;

  // Altitude warning
  if (elevation > 2500) {
    narratives.push(
      `Altitude ${Math.round(elevation)}m. L'oxygénation est réduite de ~${Math.round((1 - Math.exp(-elevation / 7400)) * 100)}%. Hydratez-vous fréquemment et montez progressivement.`
    );
  }

  // UV narrative
  const uvInfo = getUVLabel(current.uvIndex);
  narratives.push(`UV ${uvInfo.label} (${current.uvIndex}). ${uvInfo.signal}`);

  // Dew point comfort
  const dpInfo = getDewPointComfort(current.dewPoint);
  if (current.dewPoint >= 18) {
    narratives.push(`Point de rosée ${current.dewPoint.toFixed(0)}°C. ${dpInfo.signal}`);
  }

  // Air quality narrative
  if (airQuality) {
    const aqInfo = getAQILabel(airQuality.aqi);
    narratives.push(`${aqInfo.signal} AQI ${airQuality.aqi}.`);
  }

  // Wind gusts
  if (current.windGusts > 60) {
    narratives.push(`Rafales à ${current.windGusts} km/h. Danger pour les activités en extérieur. Abritez-vous.`);
  } else if (current.windSpeed > 40) {
    narratives.push(`Vent fort à ${current.windSpeed} km/h (rafales ${current.windGusts} km/h). Sécurisez vos affaires.`);
  } else if (current.windSpeed > 20) {
    narratives.push(`Vent modéré de ${current.windSpeed} km/h direction ${windDirectionToLabel(current.windDirection)}.`);
  }

  // Visibility
  if (current.visibility < 1000) {
    narratives.push(`Visibilité très réduite (${current.visibility}m). Prudence sur la route.`);
  } else if (current.visibility < 5000) {
    narratives.push(`Visibilité réduite (${(current.visibility / 1000).toFixed(1)}km). Activez vos feux de croisement.`);
  }

  // Pressure trend
  if (current.pressure < 1000) {
    narratives.push(`Pression basse (${Math.round(current.pressure)} hPa). Dégradation météo probable.`);
  } else if (current.pressure > 1025) {
    narratives.push(`Haute pression (${Math.round(current.pressure)} hPa). Stabilité météo attendue.`);
  }

  // Precipitation forecast
  const rainDays = weather.daily.filter(d => d.precipitationSum > 1);
  if (rainDays.length > 0) {
    const totalRain = rainDays.reduce((s, d) => s + d.precipitationSum, 0);
    narratives.push(`${rainDays.length} jour${rainDays.length > 1 ? "s" : ""} de pluie (${totalRain.toFixed(0)}mm cumul). Prévoyez un imperméable.`);
  }

  return narratives;
}

// EONET category icons mapping
export function getEONETCategoryInfo(category: string): { label: string; variant: "red" | "yellow" | "blue" | "purple" } {
  const c = category.toLowerCase();
  if (c.includes("wildfire") || c.includes("feu")) return { label: "Feu", variant: "red" };
  if (c.includes("volcano")) return { label: "Volcan", variant: "red" };
  if (c.includes("storm") || c.includes("cyclone")) return { label: "Tempête", variant: "purple" };
  if (c.includes("flood")) return { label: "Inondation", variant: "blue" };
  if (c.includes("drought")) return { label: "Sécheresse", variant: "yellow" };
  if (c.includes("ice") || c.includes("snow")) return { label: "Glace", variant: "blue" };
  if (c.includes("earthquake")) return { label: "Séisme", variant: "red" };
  if (c.includes("landslide")) return { label: "Glissement", variant: "yellow" };
  return { label: category, variant: "yellow" };
}

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

// ---------- Open-Meteo Weather ----------
export interface WeatherData {
  current: {
    temperature: number;
    feelsLike: number;
    humidity: number;
    windSpeed: number;
    windDirection: number;
    weatherCode: number;
    isDay: boolean;
    cloudCover: number;
    pressure: number;
    precipitation: number;
    uvIndex: number;
    visibility: number;
  };
  daily: {
    date: string;
    tempMax: number;
    tempMin: number;
    weatherCode: number;
    precipitationSum: number;
    windSpeedMax: number;
    uvIndexMax: number;
    sunrise: string;
    sunset: string;
  }[];
  hourly: {
    time: string;
    temperature: number;
    weatherCode: number;
    precipitation: number;
    windSpeed: number;
  }[];
  elevation: number;
}

export async function fetchWeather(lat: number, lon: number): Promise<WeatherData> {
  const params = new URLSearchParams({
    latitude: lat.toString(),
    longitude: lon.toString(),
    current: "temperature_2m,relative_humidity_2m,apparent_temperature,weather_code,wind_speed_10m,wind_direction_10m,is_day,cloud_cover,surface_pressure,precipitation,uv_index,visibility",
    daily: "temperature_2m_max,temperature_2m_min,weather_code,precipitation_sum,wind_speed_10m_max,uv_index_max,sunrise,sunset",
    hourly: "temperature_2m,weather_code,precipitation,wind_speed_10m",
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
      weatherCode: d.current.weather_code,
      isDay: d.current.is_day === 1,
      cloudCover: d.current.cloud_cover,
      pressure: d.current.surface_pressure,
      precipitation: d.current.precipitation,
      uvIndex: d.current.uv_index,
      visibility: d.current.visibility,
    },
    daily: d.daily.time.map((t: string, i: number) => ({
      date: t,
      tempMax: d.daily.temperature_2m_max[i],
      tempMin: d.daily.temperature_2m_min[i],
      weatherCode: d.daily.weather_code[i],
      precipitationSum: d.daily.precipitation_sum[i],
      windSpeedMax: d.daily.wind_speed_10m_max[i],
      uvIndexMax: d.daily.uv_index_max[i],
      sunrise: d.daily.sunrise[i],
      sunset: d.daily.sunset[i],
    })),
    hourly: d.hourly.time.map((t: string, i: number) => ({
      time: t,
      temperature: d.hourly.temperature_2m[i],
      weatherCode: d.hourly.weather_code[i],
      precipitation: d.hourly.precipitation[i],
      windSpeed: d.hourly.wind_speed_10m[i],
    })),
  };
}

// ---------- Open-Meteo Air Quality ----------
export interface AirQualityData {
  aqi: number;
  pm25: number;
  pm10: number;
  no2: number;
  ozone: number;
  so2: number;
  co: number;
}

export async function fetchAirQuality(lat: number, lon: number): Promise<AirQualityData> {
  const params = new URLSearchParams({
    latitude: lat.toString(),
    longitude: lon.toString(),
    current: "european_aqi,pm2_5,pm10,nitrogen_dioxide,ozone,sulphur_dioxide,carbon_monoxide",
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
}

export async function fetchCountry(countryName: string): Promise<CountryData | null> {
  try {
    const res = await fetch(
      `https://restcountries.com/v3.1/name/${encodeURIComponent(countryName)}?fields=name,capital,population,area,languages,currencies,flags,flag,region,subregion,timezones,idd`
    );
    if (!res.ok) return null;
    const data = await res.json();
    const c = data[0];
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
      node["amenity"~"hospital|pharmacy|restaurant|cafe|bank|fuel|school|library|police|fire_station|post_office"](around:${radius},${lat},${lon});
      node["tourism"~"hotel|museum|viewpoint|attraction|information"](around:${radius},${lat},${lon});
      node["shop"~"supermarket|convenience"](around:${radius},${lat},${lon});
      node["public_transport"="stop_position"](around:${radius},${lat},${lon});
      node["railway"="station"](around:${radius},${lat},${lon});
    );
    out body 20;
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
          type: e.tags.amenity || e.tags.tourism || e.tags.shop || e.tags.public_transport || e.tags.railway || "lieu",
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
}

export async function fetchEarthquakes(lat: number, lon: number): Promise<EarthquakeData[]> {
  try {
    const res = await fetch(
      `https://earthquake.usgs.gov/fdsnws/event/1/query?format=geojson&latitude=${lat}&longitude=${lon}&maxradiuskm=300&limit=5&orderby=time`
    );
    const data = await res.json();
    return (data.features || []).map((f: any) => ({
      title: f.properties.title,
      magnitude: f.properties.mag,
      place: f.properties.place,
      time: f.properties.time,
      depth: f.geometry.coordinates[2],
      url: f.properties.url,
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
  count: number;
}

export async function fetchGBIF(lat: number, lon: number): Promise<GBIFSpecies[]> {
  try {
    const res = await fetch(
      `https://api.gbif.org/v1/occurrence/search?decimalLatitude=${(lat - 0.05).toFixed(4)},${(lat + 0.05).toFixed(4)}&decimalLongitude=${(lon - 0.05).toFixed(4)},${(lon + 0.05).toFixed(4)}&limit=10&hasCoordinate=true`
    );
    const data = await res.json();
    const seen = new Set<string>();
    return (data.results || [])
      .filter((r: any) => {
        if (!r.species || seen.has(r.species)) return false;
        seen.add(r.species);
        return true;
      })
      .map((r: any) => ({
        name: r.vernacularName || r.species,
        scientificName: r.scientificName || r.species,
        kingdom: r.kingdom || "",
        phylum: r.phylum || "",
        count: r.individualCount || 1,
      }));
  } catch {
    return [];
  }
}

// ---------- Helpers ----------
function haversine(lat1: number, lon1: number, lat2: number, lon2: number): number {
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
    61: { label: "Pluie faible", icon: "rain" },
    63: { label: "Pluie modérée", icon: "rain" },
    65: { label: "Pluie forte", icon: "rain" },
    71: { label: "Neige faible", icon: "snow" },
    73: { label: "Neige modérée", icon: "snow" },
    75: { label: "Neige forte", icon: "snow" },
    80: { label: "Averses légères", icon: "rain" },
    81: { label: "Averses modérées", icon: "rain" },
    82: { label: "Averses violentes", icon: "rain" },
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

  // Air quality narrative
  if (airQuality) {
    const aqInfo = getAQILabel(airQuality.aqi);
    narratives.push(`${aqInfo.signal} AQI ${airQuality.aqi}.`);
  }

  // Wind
  if (current.windSpeed > 40) {
    narratives.push(`Vent fort à ${current.windSpeed} km/h. Sécurisez vos affaires et évitez les crêtes exposées.`);
  } else if (current.windSpeed > 20) {
    narratives.push(`Vent modéré de ${current.windSpeed} km/h direction ${windDirectionToLabel(current.windDirection)}.`);
  }

  // Visibility
  if (current.visibility < 1000) {
    narratives.push(`Visibilité très réduite (${current.visibility}m). Prudence sur la route.`);
  }

  // Precipitation forecast
  const rainDays = weather.daily.filter(d => d.precipitationSum > 1);
  if (rainDays.length > 0) {
    narratives.push(`${rainDays.length} jour${rainDays.length > 1 ? 's' : ''} de pluie prévu${rainDays.length > 1 ? 's' : ''} cette semaine. Prévoyez un imperméable.`);
  }

  return narratives;
}

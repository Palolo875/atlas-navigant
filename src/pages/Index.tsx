import { useState, useCallback } from "react";
import MapView from "@/components/MapView";
import SearchBar from "@/components/SearchBar";
import LocationDrawer from "@/components/LocationDrawer";
import AmbientBackground from "@/components/AmbientBackground";
import { reverseGeocode, type GeoResult } from "@/lib/api";

export default function Index() {
  const [selectedLocation, setSelectedLocation] = useState<GeoResult | null>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [flyTo, setFlyTo] = useState<{ lat: number; lon: number } | null>(null);
  const [markerPos, setMarkerPos] = useState<{ lat: number; lon: number } | null>(null);

  const handleSearchSelect = useCallback((result: GeoResult) => {
    setSelectedLocation(result);
    setFlyTo({ lat: result.lat, lon: result.lon });
    setMarkerPos({ lat: result.lat, lon: result.lon });
    setDrawerOpen(true);
  }, []);

  const handleMapClick = useCallback(async (lat: number, lon: number) => {
    setMarkerPos({ lat, lon });
    setDrawerOpen(true);
    const geo = await reverseGeocode(lat, lon);
    if (geo) {
      setSelectedLocation(geo);
    } else {
      setSelectedLocation({
        name: "Position selectionnee",
        country: "",
        lat,
        lon,
      });
    }
  }, []);

  return (
    <main className="relative w-full overflow-hidden" style={{ minHeight: "100dvh" }}>
      {/* Atmosphère — sous tout, jamais cliquable */}
      <AmbientBackground />

      {/* Map — au-dessus de l'atmosphère mais avec opacité naturelle (positron est presque blanc) */}
      <MapView onMapClick={handleMapClick} flyTo={flyTo} markerPos={markerPos} />

      {/* UI shell */}
      <SearchBar onSelect={handleSearchSelect} />

      <LocationDrawer
        location={selectedLocation}
        open={drawerOpen}
        onOpenChange={setDrawerOpen}
      />
    </main>
  );
}

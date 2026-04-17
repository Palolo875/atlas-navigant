import { useEffect, useRef } from "react";
import maplibregl from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";

interface MapViewProps {
  onMapClick: (lat: number, lon: number) => void;
  flyTo?: { lat: number; lon: number } | null;
  markerPos?: { lat: number; lon: number } | null;
}

export default function MapView({ onMapClick, flyTo, markerPos }: MapViewProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<maplibregl.Map | null>(null);
  const markerRef = useRef<maplibregl.Marker | null>(null);
  const onMapClickRef = useRef(onMapClick);
  onMapClickRef.current = onMapClick;

  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;

    const map = new maplibregl.Map({
      container: containerRef.current,
      style: "https://basemaps.cartocdn.com/gl/positron-gl-style/style.json",
      center: [2.3522, 48.8566],
      zoom: 5,
      attributionControl: false,
    });

    map.addControl(new maplibregl.AttributionControl({ compact: true }), "bottom-right");
    map.addControl(new maplibregl.NavigationControl({ showCompass: true, showZoom: true }), "bottom-right");
    map.addControl(
      new maplibregl.GeolocateControl({
        positionOptions: { enableHighAccuracy: true },
        trackUserLocation: true,
      }),
      "bottom-right"
    );

    map.on("click", (e) => {
      onMapClickRef.current(e.lngLat.lat, e.lngLat.lng);
    });

    mapRef.current = map;

    return () => {
      map.remove();
      mapRef.current = null;
    };
  }, []);

  useEffect(() => {
    if (!flyTo || !mapRef.current) return;
    mapRef.current.flyTo({
      center: [flyTo.lon, flyTo.lat],
      zoom: 13,
      duration: 1500,
    });
  }, [flyTo]);

  useEffect(() => {
    if (markerRef.current) {
      markerRef.current.remove();
      markerRef.current = null;
    }
    if (!markerPos || !mapRef.current) return;

    // Marker éditorial : pastille warm avec halo doux
    const el = document.createElement("div");
    el.className = "map-marker-dot";
    el.style.cssText = `
      position: relative;
      width: 14px;
      height: 14px;
      border-radius: 50%;
      background: hsl(30 14% 10%);
      border: 2px solid hsl(36 22% 99%);
      box-shadow:
        0 0 0 6px hsl(38 70% 88% / 0.45),
        0 4px 14px -2px hsl(30 30% 20% / 0.25);
      transition: transform 220ms cubic-bezier(0.16,1,0.3,1);
      cursor: pointer;
    `;

    markerRef.current = new maplibregl.Marker({ element: el })
      .setLngLat([markerPos.lon, markerPos.lat])
      .addTo(mapRef.current);
  }, [markerPos]);

  return (
    <div ref={containerRef} className="absolute inset-0" style={{ zIndex: 0 }} />
  );
}

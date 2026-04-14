import { useEffect, useRef, useCallback } from "react";
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
      onMapClick(e.lngLat.lat, e.lngLat.lng);
    });

    mapRef.current = map;

    return () => {
      map.remove();
      mapRef.current = null;
    };
  }, []);

  // Update click handler ref
  const onMapClickRef = useRef(onMapClick);
  onMapClickRef.current = onMapClick;

  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;
    const handler = (e: maplibregl.MapMouseEvent) => {
      onMapClickRef.current(e.lngLat.lat, e.lngLat.lng);
    };
    map.off("click", handler);
    map.on("click", handler);
  }, []);

  // Fly to
  useEffect(() => {
    if (!flyTo || !mapRef.current) return;
    mapRef.current.flyTo({
      center: [flyTo.lon, flyTo.lat],
      zoom: 13,
      duration: 1500,
    });
  }, [flyTo]);

  // Marker
  useEffect(() => {
    if (markerRef.current) {
      markerRef.current.remove();
      markerRef.current = null;
    }
    if (!markerPos || !mapRef.current) return;

    const el = document.createElement("div");
    el.style.width = "14px";
    el.style.height = "14px";
    el.style.borderRadius = "50%";
    el.style.background = "#111111";
    el.style.border = "2px solid #FFFFFF";
    el.style.boxShadow = "0 2px 8px rgba(0,0,0,0.15)";

    markerRef.current = new maplibregl.Marker({ element: el })
      .setLngLat([markerPos.lon, markerPos.lat])
      .addTo(mapRef.current);
  }, [markerPos]);

  return (
    <div ref={containerRef} className="absolute inset-0" style={{ zIndex: 0 }} />
  );
}

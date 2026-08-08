import { useEffect, useRef } from "react";
import type { Map as LeafletMap } from "leaflet";
import "leaflet/dist/leaflet.css";

export type CoordMapa = { lat: number; lng: number };

/**
 * Mapa estático (não interativo) com o percurso real gravado durante a missão.
 * Usado dentro dos posts — leve, sem zoom/arrasto.
 */
export default function MapaPercurso({
  trilha,
  altura = 180,
  interativo = false,
}: {
  trilha: CoordMapa[];
  altura?: number;
  interativo?: boolean;
}) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<LeafletMap | null>(null);

  useEffect(() => {
    let cancelado = false;
    if (trilha.length < 2) return;

    void (async () => {
      const L = await import("leaflet");
      if (cancelado || !containerRef.current || mapRef.current) return;

      const map = L.map(containerRef.current, {
        zoomControl: interativo,
        attributionControl: true,
        dragging: interativo,
        scrollWheelZoom: false,
        doubleClickZoom: interativo,
        touchZoom: interativo,
        boxZoom: false,
        keyboard: false,
      });

      L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        maxZoom: 19,
        attribution: "&copy; OpenStreetMap",
      }).addTo(map);

      const pontos = trilha.map((p) => [p.lat, p.lng] as [number, number]);
      const linha = L.polyline(pontos, { color: "#22c55e", weight: 5, opacity: 0.95 }).addTo(map);

      const inicio = pontos[0];
      const fim = pontos[pontos.length - 1];
      if (inicio) {
        L.circleMarker(inicio, {
          radius: 6,
          color: "#ffffff",
          weight: 2,
          fillColor: "#22c55e",
          fillOpacity: 1,
        }).addTo(map);
      }
      if (fim) {
        L.circleMarker(fim, {
          radius: 6,
          color: "#22c55e",
          weight: 2,
          fillColor: "#ffffff",
          fillOpacity: 1,
        }).addTo(map);
      }

      map.fitBounds(linha.getBounds(), { padding: [24, 24] });
      mapRef.current = map;
    })();

    return () => {
      cancelado = true;
      mapRef.current?.remove();
      mapRef.current = null;
    };
  }, [trilha, interativo]);

  if (trilha.length < 2) return null;

  return (
    <div
      ref={containerRef}
      style={{ height: altura }}
      className="w-full overflow-hidden rounded-xl border border-border bg-muted/30"
      aria-label="Percurso da missão no mapa"
    />
  );
}

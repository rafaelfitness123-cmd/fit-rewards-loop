import { useEffect, useRef, useState } from "react";
import type { Map as LeafletMap, Marker, Polyline, CircleMarker } from "leaflet";
import { LocateFixed } from "lucide-react";
import "leaflet/dist/leaflet.css";

export type CoordMapa = { lat: number; lng: number };

/**
 * Mapa real (OpenStreetMap + Leaflet) com a posição do aluno e o traçado
 * percorrido. Carregado apenas no cliente.
 */
export default function MapaLeaflet({
  trilha,
  atual,
  ativo,
}: {
  trilha: CoordMapa[];
  atual: CoordMapa | null;
  ativo: boolean;
}) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<LeafletMap | null>(null);
  const linhaRef = useRef<Polyline | null>(null);
  const marcadorRef = useRef<Marker | CircleMarker | null>(null);
  const inicioRef = useRef<CircleMarker | null>(null);
  const arrastouEm = useRef<number>(0);
  const [pronto, setPronto] = useState(false);
  const [seguindo, setSeguindo] = useState(true);

  useEffect(() => {
    let cancelado = false;
    void (async () => {
      const L = await import("leaflet");
      if (cancelado || !containerRef.current || mapRef.current) return;

      const map = L.map(containerRef.current, {
        zoomControl: false,
        attributionControl: true,
      }).setView(atual ? [atual.lat, atual.lng] : [-14.235, -51.925], atual ? 17 : 4);

      L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        maxZoom: 19,
        attribution: "&copy; OpenStreetMap",
      }).addTo(map);

      map.on("dragstart", () => {
        arrastouEm.current = Date.now();
        setSeguindo(false);
      });

      mapRef.current = map;
      setPronto(true);
    })();

    return () => {
      cancelado = true;
      mapRef.current?.remove();
      mapRef.current = null;
      linhaRef.current = null;
      marcadorRef.current = null;
      inicioRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Retoma o acompanhamento automático alguns segundos após o arrasto manual.
  useEffect(() => {
    if (seguindo) return;
    const t = setInterval(() => {
      if (Date.now() - arrastouEm.current > 12000) setSeguindo(true);
    }, 2000);
    return () => clearInterval(t);
  }, [seguindo]);

  useEffect(() => {
    if (!pronto || !mapRef.current) return;
    let cancelado = false;
    void (async () => {
      const L = await import("leaflet");
      const map = mapRef.current;
      if (cancelado || !map) return;

      const coords = trilha.map((p) => [p.lat, p.lng] as [number, number]);

      if (coords.length > 1) {
        if (!linhaRef.current) {
          linhaRef.current = L.polyline(coords, {
            color: "#22e06a",
            weight: 6,
            opacity: 0.95,
            lineCap: "round",
            lineJoin: "round",
          }).addTo(map);
        } else {
          linhaRef.current.setLatLngs(coords);
        }
      }

      const primeiro = trilha[0];
      if (primeiro && !inicioRef.current) {
        inicioRef.current = L.circleMarker([primeiro.lat, primeiro.lng], {
          radius: 6,
          color: "#ffffff",
          weight: 2,
          fillColor: "#22e06a",
          fillOpacity: 1,
        }).addTo(map);
      }

      if (atual) {
        if (!marcadorRef.current) {
          marcadorRef.current = L.circleMarker([atual.lat, atual.lng], {
            radius: 9,
            color: "#0b0f0d",
            weight: 3,
            fillColor: "#22e06a",
            fillOpacity: 1,
          }).addTo(map);
        } else {
          (marcadorRef.current as CircleMarker).setLatLng([atual.lat, atual.lng]);
        }
        if (seguindo) {
          map.setView([atual.lat, atual.lng], Math.max(map.getZoom(), 17), {
            animate: true,
          });
        }
      }
    })();
    return () => {
      cancelado = true;
    };
  }, [trilha, atual, pronto, seguindo]);

  const recentralizar = () => {
    const map = mapRef.current;
    if (!map || !atual) return;
    setSeguindo(true);
    map.setView([atual.lat, atual.lng], 17, { animate: true });
  };

  return (
    <div className="relative h-56 w-full border-b border-border">
      <div ref={containerRef} className="h-full w-full bg-muted" />
      {!atual && (
        <div className="pointer-events-none absolute inset-0 flex items-center justify-center bg-background/70 text-center text-xs text-muted-foreground">
          {ativo ? "Procurando sua posição…" : "Inicie o percurso para ver sua posição no mapa."}
        </div>
      )}
      <button
        type="button"
        onClick={recentralizar}
        aria-label="Recentralizar mapa na minha posição"
        className="absolute bottom-3 right-3 z-[500] flex size-10 items-center justify-center rounded-full bg-card/95 text-primary shadow-lg ring-1 ring-border backdrop-blur transition-transform active:scale-95"
      >
        <LocateFixed className="size-5" />
      </button>
    </div>
  );
}

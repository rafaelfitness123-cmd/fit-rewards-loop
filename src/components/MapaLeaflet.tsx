import { useEffect, useRef, useState } from "react";
import type { Map as LeafletMap, Marker, Polyline, CircleMarker, Circle } from "leaflet";
import { LocateFixed } from "lucide-react";
import "leaflet/dist/leaflet.css";

export type CoordMapa = { lat: number; lng: number };

export type ParceiroMapa = {
  clienteId: string;
  nome: string;
  avatar: string | null;
  lat: number;
  lng: number;
  distanciaM: number;
};

const iniciais = (nome: string) =>
  nome
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((n) => n[0])
    .join("")
    .toUpperCase() || "?";

/**
 * Mapa real (OpenStreetMap + Leaflet) com a posição do aluno, o traçado
 * percorrido e — em missões coletivas — os participantes por perto.
 * Carregado apenas no cliente.
 */
export default function MapaLeaflet({
  trilha,
  atual,
  ativo,
  parceiros = [],
  raioM,
  travado = false,
}: {
  trilha: CoordMapa[];
  atual: CoordMapa | null;
  ativo: boolean;
  parceiros?: ParceiroMapa[];
  raioM?: number | undefined;
  /** Modo seguro: mapa só visual, sempre centralizado no aluno e sem toques. */
  travado?: boolean;
}) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<LeafletMap | null>(null);
  const linhaRef = useRef<Polyline | null>(null);
  const marcadorRef = useRef<Marker | CircleMarker | null>(null);
  const inicioRef = useRef<CircleMarker | null>(null);
  const raioRef = useRef<Circle | null>(null);
  const parceirosRef = useRef<Map<string, { marcador: Marker; linha: Polyline }>>(new Map());
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
      raioRef.current = null;
      parceirosRef.current.clear();
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

      // Círculo do raio de proximidade (missões coletivas).
      if (raioM && atual) {
        if (!raioRef.current) {
          raioRef.current = L.circle([atual.lat, atual.lng], {
            radius: raioM,
            color: "#22e06a",
            weight: 1,
            opacity: 0.5,
            fillColor: "#22e06a",
            fillOpacity: 0.06,
          }).addTo(map);
        } else {
          raioRef.current.setLatLng([atual.lat, atual.lng]);
          raioRef.current.setRadius(raioM);
        }
      } else if (raioRef.current) {
        raioRef.current.remove();
        raioRef.current = null;
      }

      // Participantes próximos: ícone do perfil + linha de conexão.
      const vivos = new Set(parceiros.map((p) => p.clienteId));
      parceirosRef.current.forEach((ref, id) => {
        if (!vivos.has(id)) {
          ref.marcador.remove();
          ref.linha.remove();
          parceirosRef.current.delete(id);
        }
      });

      for (const p of parceiros) {
        const html = p.avatar
          ? `<img src="${p.avatar}" alt="" class="size-9 rounded-full object-cover ring-2 ring-[#22e06a] shadow-lg" />`
          : `<span class="flex size-9 items-center justify-center rounded-full bg-[#0b0f0d] text-[11px] font-black text-[#22e06a] ring-2 ring-[#22e06a] shadow-lg">${iniciais(p.nome)}</span>`;
        const icone = L.divIcon({
          html: `<div class="flex flex-col items-center gap-0.5">${html}<span class="rounded-full bg-[#0b0f0d]/85 px-1.5 py-0.5 text-[9px] font-bold text-white">${Math.round(p.distanciaM)} m</span></div>`,
          className: "pulsefit-parceiro",
          iconSize: [36, 50],
          iconAnchor: [18, 18],
        });

        const existente = parceirosRef.current.get(p.clienteId);
        if (existente) {
          existente.marcador.setLatLng([p.lat, p.lng]);
          existente.marcador.setIcon(icone);
          if (atual) existente.linha.setLatLngs([[atual.lat, atual.lng], [p.lat, p.lng]]);
        } else {
          const marcador = L.marker([p.lat, p.lng], { icon: icone, title: p.nome }).addTo(map);
          const linha = L.polyline(
            atual ? [[atual.lat, atual.lng], [p.lat, p.lng]] : [[p.lat, p.lng]],
            { color: "#22e06a", weight: 2, opacity: 0.55, dashArray: "4 6" },
          ).addTo(map);
          parceirosRef.current.set(p.clienteId, { marcador, linha });
        }
      }
    })();
    return () => {
      cancelado = true;
    };
  }, [trilha, atual, pronto, seguindo, parceiros, raioM]);

  const recentralizar = () => {
    const map = mapRef.current;
    if (!map || !atual) return;
    setSeguindo(true);
    map.setView([atual.lat, atual.lng], 17, { animate: true });
  };

  return (
    <div className="relative isolate h-56 w-full border-b border-border">
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

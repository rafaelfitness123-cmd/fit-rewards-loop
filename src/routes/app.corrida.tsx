import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { Footprints, MapPin, Play, Square } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { getMissoes } from "@/lib/db";
import { useClienteAtual, useStore } from "@/lib/session";
import {
  corridasDe,
  distanciaEntre,
  fmtDataHora,
  fmtDistancia,
  missaoVigente,
  progressoDaMissao,
  registrarCorrida,
} from "@/lib/gamificacao";

export const Route = createFileRoute("/app/corrida")({
  head: () => ({
    meta: [
      { title: "Corrida GPS — PulseFit" },
      {
        name: "description",
        content:
          "Registre corridas e caminhadas por GPS e conclua missões de distância da academia.",
      },
      { property: "og:title", content: "Corrida GPS — PulseFit" },
      {
        property: "og:description",
        content: "Inicie o rastreamento, corra a distância da missão e receba seus pontos.",
      },
    ],
  }),
  component: Corrida,
});

const fmtTempo = (s: number) =>
  `${String(Math.floor(s / 60)).padStart(2, "0")}:${String(s % 60).padStart(2, "0")}`;

function Corrida() {
  const cliente = useClienteAtual();
  const id = cliente?.id;

  const [ativo, setAtivo] = useState(false);
  const [metros, setMetros] = useState(0);
  const [segundos, setSegundos] = useState(0);
  const [erro, setErro] = useState<string | null>(null);
  const watchRef = useRef<number | null>(null);
  const ultimoRef = useRef<{ lat: number; lng: number } | null>(null);

  const [dados, atualizar] = useStore(() => {
    if (!id) return { missoes: [] as ReturnType<typeof getMissoes>, historico: [] };
    return {
      missoes: getMissoes().filter(
        (m) =>
          m.objetivo === "distancia" &&
          missaoVigente(m) &&
          progressoDaMissao(id, m).aceita &&
          !progressoDaMissao(id, m).concedida,
      ),
      historico: corridasDe(id).slice(0, 10),
    };
  });

  useEffect(() => {
    if (!ativo) return;
    const t = setInterval(() => setSegundos((s) => s + 1), 1000);
    return () => clearInterval(t);
  }, [ativo]);

  useEffect(() => {
    return () => {
      if (watchRef.current !== null) navigator.geolocation.clearWatch(watchRef.current);
    };
  }, []);

  const iniciar = () => {
    if (typeof navigator === "undefined" || !navigator.geolocation) {
      setErro("Este dispositivo não suporta GPS.");
      return;
    }
    setErro(null);
    setMetros(0);
    setSegundos(0);
    ultimoRef.current = null;
    setAtivo(true);
    watchRef.current = navigator.geolocation.watchPosition(
      (pos) => {
        const ponto = { lat: pos.coords.latitude, lng: pos.coords.longitude };
        const anterior = ultimoRef.current;
        if (anterior) {
          const d = distanciaEntre(anterior, ponto);
          // ignora ruído do GPS e saltos irreais
          if (d > 3 && d < 200 && (pos.coords.accuracy ?? 99) < 50) {
            setMetros((m) => m + d);
            ultimoRef.current = ponto;
          }
        } else {
          ultimoRef.current = ponto;
        }
      },
      () => {
        setAtivo(false);
        setErro("Não foi possível acessar sua localização. Autorize o GPS e tente de novo.");
      },
      { enableHighAccuracy: true, maximumAge: 0, timeout: 20000 },
    );
  };

  const parar = () => {
    if (watchRef.current !== null) navigator.geolocation.clearWatch(watchRef.current);
    watchRef.current = null;
    setAtivo(false);
    if (!id) return;
    if (metros < 10) {
      toast.error("Distância muito curta para registrar.");
      return;
    }
    const concluidas = registrarCorrida(id, null, metros, segundos);
    atualizar();
    toast.success(`Corrida registrada: ${fmtDistancia(metros)}`);
    concluidas.forEach((n) => toast.success(`Missão concluída: ${n}`));
    setMetros(0);
    setSegundos(0);
  };

  if (!cliente) return null;

  return (
    <div className="space-y-5">
      <header>
        <h1 className="text-2xl font-black">Corrida GPS</h1>
        <p className="text-sm text-muted-foreground">
          Aceite uma missão de distância e registre seu percurso ao vivo.
        </p>
      </header>

      <section className="surface p-6 text-center">
        <Footprints className="mx-auto size-6 text-primary" />
        <p className="mt-3 text-5xl font-black tabular-nums">
          {(metros / 1000).toFixed(2)}
          <span className="text-lg font-bold text-muted-foreground"> km</span>
        </p>
        <p className="mt-1 text-sm text-muted-foreground tabular-nums">
          {fmtTempo(segundos)} em movimento
        </p>
        {erro && <p className="mt-3 text-xs text-destructive">{erro}</p>}
        <Button
          className="mt-5 w-full font-bold"
          variant={ativo ? "secondary" : "default"}
          onClick={ativo ? parar : iniciar}
        >
          {ativo ? (
            <>
              <Square className="mr-2 size-4" /> Parar e salvar
            </>
          ) : (
            <>
              <Play className="mr-2 size-4" /> Iniciar corrida
            </>
          )}
        </Button>
      </section>

      <section className="space-y-3">
        <h2 className="text-sm font-bold">Missões de distância aceitas</h2>
        {dados.missoes.length === 0 ? (
          <p className="surface p-4 text-sm text-muted-foreground">
            Nenhuma missão de corrida aceita. Vá em Missões e aceite um desafio.
          </p>
        ) : (
          dados.missoes.map((m) => {
            const p = id ? progressoDaMissao(id, m) : null;
            return (
              <article key={m.id} className="surface p-4">
                <p className="font-semibold">{m.nome}</p>
                <p className="text-xs text-muted-foreground">{m.descricao}</p>
                <p className="mt-2 text-xs font-semibold text-primary">
                  {fmtDistancia(p?.progresso ?? 0)} de {fmtDistancia(m.quantidade)} · +
                  {m.pontos} pts
                </p>
              </article>
            );
          })
        )}
      </section>

      <section className="space-y-3">
        <h2 className="text-sm font-bold">Últimas corridas</h2>
        {dados.historico.length === 0 ? (
          <p className="surface p-4 text-sm text-muted-foreground">
            Você ainda não registrou corridas.
          </p>
        ) : (
          dados.historico.map((c) => (
            <div key={c.id} className="surface flex items-center justify-between p-4">
              <div className="min-w-0">
                <p className="flex items-center gap-2 text-sm font-semibold">
                  <MapPin className="size-4 shrink-0 text-primary" />
                  {fmtDistancia(c.distanciaM)}
                </p>
                <p className="truncate text-[11px] text-muted-foreground">
                  {fmtDataHora(c.finalizadaEm)}
                </p>
              </div>
              <span className="shrink-0 text-xs text-muted-foreground tabular-nums">
                {fmtTempo(c.duracaoS)}
              </span>
            </div>
          ))
        )}
      </section>
    </div>
  );
}

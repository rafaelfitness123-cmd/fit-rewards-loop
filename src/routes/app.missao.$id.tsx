import { createFileRoute, Link, useParams } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { ArrowLeft, CheckCircle2, Footprints, MapPin, Play, Square, Target } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { DIAS, getMissoes } from "@/lib/db";
import { useClienteAtual, useStore } from "@/lib/session";
import {
  aceitarMissao,
  corridasDe,
  distanciaEntre,
  fmtDataHora,
  fmtDistancia,
  missaoVigente,
  progressoDaMissao,
  registrarCorrida,
} from "@/lib/gamificacao";

export const Route = createFileRoute("/app/missao/$id")({
  head: () => ({
    meta: [
      { title: "Detalhes da missão — PulseFit" },
      {
        name: "description",
        content:
          "Veja o objetivo da missão, acompanhe seu progresso e registre a atividade necessária.",
      },
      { property: "og:title", content: "Detalhes da missão — PulseFit" },
      {
        property: "og:description",
        content: "Cada missão tem sua própria tela com instruções e rastreamento.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  errorComponent: () => (
    <div className="space-y-4">
      <Voltar />
      <p className="surface p-4 text-sm text-muted-foreground">
        Algo deu errado ao carregar esta missão. Volte e abra novamente.
      </p>
    </div>
  ),
  component: DetalheMissao,
});

const fmtTempo = (s: number) =>
  `${String(Math.floor(s / 60)).padStart(2, "0")}:${String(s % 60).padStart(2, "0")}`;

function DetalheMissao() {
  const { id: missaoId } = useParams({ from: "/app/missao/$id" });
  const cliente = useClienteAtual();
  const clienteId = cliente?.id;

  const [dados, atualizar] = useStore(() => {
    const m = getMissoes().find((x) => x.id === missaoId) ?? null;
    if (!m || !clienteId) return { m, p: null, corridas: [] as ReturnType<typeof corridasDe> };
    return {
      m,
      p: progressoDaMissao(clienteId, m),
      corridas: corridasDe(clienteId)
        .filter((c) => c.missaoId === m.id)
        .slice(0, 10),
    };
  });

  if (!cliente) return null;

  const m = dados.m;
  if (!m) {
    return (
      <div className="space-y-4">
        <Voltar />
        <p className="surface p-4 text-sm text-muted-foreground">Missão não encontrada.</p>
      </div>
    );
  }

  const p = dados.p;
  const progresso = p?.progresso ?? 0;
  const concluida = Boolean(p?.concluida || p?.concedida);
  const vigente = missaoVigente(m);

  const comoFazer =
    m.objetivo === "distancia"
      ? `Percorra ${fmtDistancia(m.quantidade)} correndo ou caminhando. Use o rastreador GPS desta tela — ele conta a distância somente para esta missão.`
      : m.objetivo === "dia_semana"
        ? `Faça check-in na academia ${m.quantidade}x em ${DIAS[m.diaSemana ?? 6]}, escaneando o QR Code da recepção.`
        : `Faça ${m.quantidade} treino(s) no período, escaneando o QR Code da recepção na entrada e na saída.`;

  return (
    <div className="space-y-5">
      <Voltar />

      <header>
        <h1 className="flex items-center gap-2 text-2xl font-black">
          {concluida ? (
            <CheckCircle2 className="size-6 shrink-0 text-primary" />
          ) : (
            <Target className="size-6 shrink-0 text-muted-foreground" />
          )}
          {m.nome}
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">{m.descricao}</p>
      </header>

      <section className="surface space-y-3 p-4">
        <div className="flex items-center justify-between gap-3">
          <span className="text-xs font-semibold uppercase text-muted-foreground">{m.tipo}</span>
          <span className="rounded-full bg-primary/15 px-2.5 py-1 text-xs font-bold text-primary">
            +{m.pontos} pts
          </span>
        </div>
        <div>
          <p className="text-sm font-bold">Como concluir</p>
          <p className="mt-1 text-sm text-muted-foreground">{comoFazer}</p>
        </div>
        <Progress
          className="h-2"
          value={Math.min(100, (progresso / Math.max(1, m.quantidade)) * 100)}
        />
        <p className="text-[11px] text-muted-foreground">
          {concluida
            ? "Missão concluída 🎉"
            : m.objetivo === "distancia"
              ? `${fmtDistancia(progresso)} de ${fmtDistancia(m.quantidade)}`
              : `${progresso}/${m.quantidade} concluídos`}
        </p>
        {!vigente && (
          <p className="text-[11px] text-destructive">
            Esta missão não está disponível no momento.
          </p>
        )}
      </section>

      {m.objetivo === "distancia" && vigente && !concluida && (
        <>
          {!p?.aceita ? (
            <section className="surface space-y-3 p-4">
              <p className="text-sm text-muted-foreground">
                Aceite o desafio para liberar o rastreamento por GPS desta missão.
              </p>
              <Button
                className="w-full font-bold"
                onClick={() => {
                  if (!clienteId) return;
                  aceitarMissao(clienteId, m);
                  atualizar();
                  toast.success("Missão aceita! Bora correr.");
                }}
              >
                Aceitar missão
              </Button>
            </section>
          ) : (
            <RastreadorGps
              clienteId={clienteId!}
              missaoId={m.id}
              onFim={(nomes) => {
                atualizar();
                nomes.forEach((n) => toast.success(`Missão concluída: ${n}`));
              }}
            />
          )}
        </>
      )}

      {m.objetivo === "distancia" && dados.corridas.length > 0 && (
        <section className="space-y-3">
          <h2 className="text-sm font-bold">Percursos desta missão</h2>
          {dados.corridas.map((c) => (
            <div key={c.id} className="surface flex items-center justify-between p-4">
              <div className="min-w-0">
                <p className="flex items-center gap-2 text-sm font-semibold">
                  <MapPin className="size-4 shrink-0 text-primary" />
                  {fmtDistancia(c.distanciaM)}
                </p>
                <p className="truncate text-[11px] text-muted-foreground">
                  {fmtDataHora(c.finalizadaEm ?? c.iniciadaEm)}
                </p>
              </div>
              <span className="shrink-0 text-xs text-muted-foreground tabular-nums">
                {fmtTempo(c.duracaoS)}
              </span>
            </div>
          ))}
        </section>
      )}
    </div>
  );
}

function Voltar() {
  return (
    <Link
      to="/app/missoes"
      className="inline-flex items-center gap-1 text-xs font-semibold text-muted-foreground"
    >
      <ArrowLeft className="size-4" /> Voltar para missões
    </Link>
  );
}

function RastreadorGps({
  clienteId,
  missaoId,
  onFim,
}: {
  clienteId: string;
  missaoId: string;
  onFim: (nomes: string[]) => void;
}) {
  const [ativo, setAtivo] = useState(false);
  const [metros, setMetros] = useState(0);
  const [segundos, setSegundos] = useState(0);
  const [erro, setErro] = useState<string | null>(null);
  const [emIframe, setEmIframe] = useState(false);
  const watchRef = useRef<number | null>(null);
  const ultimoRef = useRef<{ lat: number; lng: number } | null>(null);

  useEffect(() => {
    try {
      setEmIframe(window.self !== window.top);
    } catch {
      setEmIframe(true);
    }
  }, []);

  const limpar = () => {
    try {
      if (watchRef.current !== null && typeof navigator !== "undefined" && navigator.geolocation) {
        navigator.geolocation.clearWatch(watchRef.current);
      }
    } catch {
      /* ignora */
    }
    watchRef.current = null;
  };

  useEffect(() => {
    if (!ativo) return;
    const t = setInterval(() => setSegundos((s) => s + 1), 1000);
    return () => clearInterval(t);
  }, [ativo]);

  useEffect(() => limpar, []);

  const mensagemErroGeo = (code?: number) => {
    if (code === 1)
      return emIframe
        ? "O navegador bloqueou o GPS dentro do preview. Abra o app em uma aba separada e autorize a localização."
        : "Permissão de localização negada. Autorize o GPS nas configurações do navegador e tente novamente.";
    if (code === 2) return "Sinal de GPS indisponível. Vá para um local aberto e tente novamente.";
    if (code === 3) return "O GPS demorou para responder. Tente novamente.";
    return "Não foi possível acessar sua localização. Autorize o GPS e tente de novo.";
  };

  const iniciar = () => {
    try {
      if (typeof navigator === "undefined" || !navigator.geolocation) {
        setErro("Este dispositivo/navegador não suporta GPS.");
        return;
      }
      if (typeof window !== "undefined" && !window.isSecureContext) {
        setErro("O GPS só funciona em conexão segura (https).");
        return;
      }
      setErro(null);
      setMetros(0);
      setSegundos(0);
      ultimoRef.current = null;

      // pede a permissão antes de abrir o watch contínuo
      navigator.geolocation.getCurrentPosition(
        () => {
          try {
            setAtivo(true);
            watchRef.current = navigator.geolocation.watchPosition(
              (pos) => {
                try {
                  const ponto = { lat: pos.coords.latitude, lng: pos.coords.longitude };
                  const anterior = ultimoRef.current;
                  if (!anterior) {
                    ultimoRef.current = ponto;
                    return;
                  }
                  const d = distanciaEntre(anterior, ponto);
                  if (d > 3 && d < 200 && (pos.coords.accuracy ?? 99) < 50) {
                    setMetros((mm) => mm + d);
                    ultimoRef.current = ponto;
                  }
                } catch {
                  /* ignora leitura inválida */
                }
              },
              (err) => {
                limpar();
                setAtivo(false);
                setErro(mensagemErroGeo(err?.code));
              },
              { enableHighAccuracy: true, maximumAge: 0, timeout: 30000 },
            );
          } catch {
            setAtivo(false);
            setErro("Não foi possível iniciar o rastreamento neste dispositivo.");
          }
        },
        (err) => {
          setAtivo(false);
          setErro(mensagemErroGeo(err?.code));
        },
        { enableHighAccuracy: true, timeout: 30000, maximumAge: 0 },
      );
    } catch {
      setAtivo(false);
      setErro("Não foi possível iniciar o GPS neste dispositivo.");
    }
  };

  const parar = () => {
    limpar();
    setAtivo(false);
    if (metros < 10) {
      toast.error("Distância muito curta para registrar.");
      setMetros(0);
      setSegundos(0);
      return;
    }
    try {
      const concluidas = registrarCorrida(clienteId, missaoId, metros, segundos);
      toast.success(`Percurso registrado: ${fmtDistancia(metros)}`);
      onFim(concluidas);
    } catch {
      toast.error("Não foi possível salvar o percurso. Tente novamente.");
    }
    setMetros(0);
    setSegundos(0);
  };

  return (
    <section className="surface p-6 text-center">
      <Footprints className="mx-auto size-6 text-primary" />
      <p className="mt-3 text-5xl font-black tabular-nums">
        {(metros / 1000).toFixed(2)}
        <span className="text-lg font-bold text-muted-foreground"> km</span>
      </p>
      <p className="mt-1 text-sm text-muted-foreground tabular-nums">
        {fmtTempo(segundos)} em movimento
      </p>
      {erro && (
        <div className="mt-3 space-y-2">
          <p className="text-xs text-destructive">{erro}</p>
          {emIframe && (
            <a
              href={typeof window !== "undefined" ? window.location.href : "#"}
              target="_blank"
              rel="noreferrer"
              className="inline-block text-xs font-semibold text-primary underline"
            >
              Abrir em uma aba separada
            </a>
          )}
        </div>
      )}
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
            <Play className="mr-2 size-4" /> Iniciar percurso
          </>
        )}
      </Button>
      <p className="mt-2 text-[11px] text-muted-foreground">
        Mantenha esta tela aberta enquanto corre.
      </p>
    </section>
  );
}

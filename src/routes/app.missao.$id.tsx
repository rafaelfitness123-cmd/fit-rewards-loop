import { createFileRoute, Link, useParams } from "@tanstack/react-router";
import { useCallback, useEffect, useRef, useState } from "react";
import {
  ArrowLeft,
  CheckCircle2,
  Crosshair,
  Footprints,
  LocateFixed,
  MapPin,
  Play,
  ShieldCheck,
  Square,
  Target,
} from "lucide-react";
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
  errorComponent: ({ reset }) => (
    <div className="space-y-4">
      <Voltar />
      <section className="surface space-y-3 p-4">
        <p className="text-sm text-muted-foreground">
          Não foi possível abrir esta missão agora. Seus dados não foram perdidos.
        </p>
        <Button className="w-full" onClick={reset}>Tentar novamente</Button>
      </section>
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
            clienteId ? (
              <RastreadorGps
                clienteId={clienteId}
                missaoId={m.id}
                metaM={Math.max(1, m.quantidade - progresso)}
                onFim={(nomes) => {
                  atualizar();
                  nomes.forEach((n) => toast.success(`Missão concluída: ${n}`));
                }}
              />
            ) : null
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
  metaM,
  onFim,
}: {
  clienteId: string;
  missaoId: string;
  metaM: number;
  onFim: (nomes: string[]) => void;
}) {
  const [ativo, setAtivo] = useState(false);
  const [solicitando, setSolicitando] = useState(false);
  const [metros, setMetros] = useState(0);
  const [segundos, setSegundos] = useState(0);
  const [erro, setErro] = useState<string | null>(null);
  const [emIframe, setEmIframe] = useState(false);
  const [permissao, setPermissao] = useState<PermissionState | "indisponivel">("prompt");
  const [pontos, setPontos] = useState<Array<{ lat: number; lng: number; accuracy: number }>>([]);
  const watchRef = useRef<number | null>(null);
  const ultimoRef = useRef<{ lat: number; lng: number } | null>(null);
  const metrosRef = useRef(0);
  const segundosRef = useRef(0);
  const finalizandoRef = useRef(false);

  useEffect(() => {
    try {
      setEmIframe(window.self !== window.top);
    } catch {
      setEmIframe(true);
    }
  }, []);

  useEffect(() => {
    let mounted = true;
    if (typeof navigator === "undefined" || !("permissions" in navigator)) {
      setPermissao("indisponivel");
      return;
    }
    void navigator.permissions
      .query({ name: "geolocation" })
      .then((status) => {
        if (!mounted) return;
        setPermissao(status.state);
        status.onchange = () => setPermissao(status.state);
      })
      .catch(() => setPermissao("indisponivel"));
    return () => {
      mounted = false;
    };
  }, []);

  const limpar = useCallback(() => {
    try {
      if (watchRef.current !== null && typeof navigator !== "undefined" && navigator.geolocation) {
        navigator.geolocation.clearWatch(watchRef.current);
      }
    } catch {
      /* ignora */
    }
    watchRef.current = null;
  }, []);

  useEffect(() => {
    if (!ativo) return;
    const t = setInterval(() => setSegundos((s) => s + 1), 1000);
    return () => clearInterval(t);
  }, [ativo]);

  useEffect(() => limpar, [limpar]);

  const mensagemErroGeo = (code?: number) => {
    if (code === 1)
      return emIframe
        ? "O navegador bloqueou o GPS dentro do preview. Abra o app em uma aba separada e autorize a localização."
        : "Permissão de localização negada. Autorize o GPS nas configurações do navegador e tente novamente.";
    if (code === 2) return "Sinal de GPS indisponível. Vá para um local aberto e tente novamente.";
    if (code === 3) return "O GPS demorou para responder. Tente novamente.";
    return "Não foi possível acessar sua localização. Autorize o GPS e tente de novo.";
  };

  const concluirPercurso = useCallback(
    (distancia: number, duracao: number, automatico: boolean) => {
      if (finalizandoRef.current) return;
      finalizandoRef.current = true;
      limpar();
      setAtivo(false);
      setSolicitando(false);
      try {
        const concluidas = registrarCorrida(clienteId, missaoId, distancia, duracao);
        toast.success(
          automatico
            ? `Meta atingida! ${fmtDistancia(distancia)} registrados.`
            : `Percurso registrado: ${fmtDistancia(distancia)}`,
        );
        onFim(concluidas);
      } catch (error) {
        console.error("Falha ao salvar percurso", error);
        finalizandoRef.current = false;
        setErro("O percurso terminou, mas não foi possível salvá-lo. Tente novamente.");
      }
    },
    [clienteId, limpar, missaoId, onFim],
  );

  const iniciarMonitoramento = useCallback(
    (inicial: GeolocationPosition) => {
      const primeiro = {
        lat: inicial.coords.latitude,
        lng: inicial.coords.longitude,
        accuracy: inicial.coords.accuracy,
      };
      ultimoRef.current = primeiro;
      setPontos([primeiro]);
      setPermissao("granted");
      setSolicitando(false);
      setAtivo(true);
      watchRef.current = navigator.geolocation.watchPosition(
        (pos) => {
          const ponto = {
            lat: pos.coords.latitude,
            lng: pos.coords.longitude,
            accuracy: pos.coords.accuracy,
          };
          const anterior = ultimoRef.current;
          if (!anterior) {
            ultimoRef.current = ponto;
            setPontos([ponto]);
            return;
          }
          const d = distanciaEntre(anterior, ponto);
          const precisaoAceitavel = Number.isFinite(ponto.accuracy) && ponto.accuracy <= 45;
          if (d >= 2 && d <= 150 && precisaoAceitavel) {
            const total = metrosRef.current + d;
            metrosRef.current = total;
            ultimoRef.current = ponto;
            setMetros(total);
            setPontos((atuais) => [...atuais.slice(-199), ponto]);
            if (total >= metaM) concluirPercurso(total, segundosRef.current, true);
          }
        },
        (geoError) => {
          limpar();
          setAtivo(false);
          setSolicitando(false);
          setErro(mensagemErroGeo(geoError.code));
        },
        { enableHighAccuracy: true, maximumAge: 2000, timeout: 30000 },
      );
    },
    [concluirPercurso, limpar, metaM],
  );

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
      setSolicitando(true);
      setMetros(0);
      setSegundos(0);
      setPontos([]);
      metrosRef.current = 0;
      segundosRef.current = 0;
      finalizandoRef.current = false;
      ultimoRef.current = null;

      navigator.geolocation.getCurrentPosition(
        iniciarMonitoramento,
        (geoError) => {
          setAtivo(false);
          setSolicitando(false);
          if (geoError.code === 1) setPermissao("denied");
          setErro(mensagemErroGeo(geoError.code));
        },
        { enableHighAccuracy: true, timeout: 30000, maximumAge: 2000 },
      );
    } catch (error) {
      console.error("Falha ao iniciar GPS", error);
      setAtivo(false);
      setSolicitando(false);
      setErro("Não foi possível iniciar o GPS neste dispositivo.");
    }
  };

  const parar = () => {
    if (metrosRef.current < 10) {
      limpar();
      setAtivo(false);
      toast.error("Distância muito curta para registrar.");
      setMetros(0);
      setSegundos(0);
      setPontos([]);
      return;
    }
    concluirPercurso(metrosRef.current, segundosRef.current, false);
  };

  useEffect(() => {
    if (!ativo) return;
    segundosRef.current = segundos;
  }, [ativo, segundos]);

  return (
    <section className="surface overflow-hidden">
      <MapaPercurso pontos={pontos} ativo={ativo} />
      <div className="p-5 text-center">
      <Footprints className="mx-auto size-6 text-primary" />
      <p className="mt-3 text-5xl font-black tabular-nums">
        {(metros / 1000).toFixed(2)}
        <span className="text-lg font-bold text-muted-foreground"> km</span>
      </p>
      <p className="mt-1 text-sm text-muted-foreground tabular-nums">
        {fmtTempo(segundos)} em movimento
      </p>
      <div className="mt-3 flex items-center justify-center gap-2 text-xs text-muted-foreground">
        <Crosshair className="size-4 text-primary" />
        Faltam {fmtDistancia(Math.max(0, metaM - metros))}
      </div>
      {!ativo && !erro && (
        <div className="mt-4 flex items-center justify-center gap-2 rounded-md bg-primary/10 p-3 text-left text-xs text-muted-foreground">
          <ShieldCheck className="size-5 shrink-0 text-primary" />
          Ao iniciar, permita o uso da localização precisa. O GPS será usado apenas durante esta missão.
        </div>
      )}
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
        disabled={solicitando}
      >
        {solicitando ? (
          <><LocateFixed className="mr-2 size-4 animate-pulse" /> Aguardando localização…</>
        ) : ativo ? (
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
        {permissao === "denied"
          ? "Libere a localização para este site nas configurações do navegador."
          : "Mantenha esta tela aberta. A missão termina automaticamente ao atingir a meta."}
      </p>
      </div>
    </section>
  );
}

function MapaPercurso({
  pontos,
  ativo,
}: {
  pontos: Array<{ lat: number; lng: number; accuracy: number }>;
  ativo: boolean;
}) {
  const largura = 320;
  const altura = 190;
  if (pontos.length === 0) {
    return (
      <div className="flex h-48 flex-col items-center justify-center border-b border-border bg-muted/30 text-muted-foreground">
        <MapPin className="size-8 text-primary" />
        <p className="mt-2 text-sm font-semibold">Seu percurso aparecerá aqui</p>
        <p className="mt-1 text-xs">Inicie para localizar sua posição.</p>
      </div>
    );
  }

  const lats = pontos.map((p) => p.lat);
  const lngs = pontos.map((p) => p.lng);
  const minLat = Math.min(...lats);
  const maxLat = Math.max(...lats);
  const minLng = Math.min(...lngs);
  const maxLng = Math.max(...lngs);
  const latSpan = Math.max(maxLat - minLat, 0.0002);
  const lngSpan = Math.max(maxLng - minLng, 0.0002);
  const projetar = (p: { lat: number; lng: number }) => ({
    x: 20 + ((p.lng - minLng) / lngSpan) * (largura - 40),
    y: 20 + ((maxLat - p.lat) / latSpan) * (altura - 40),
  });
  const linha = pontos.map((p) => projetar(p)).map((p) => `${p.x},${p.y}`).join(" ");
  const atual = projetar(pontos[pontos.length - 1]);

  return (
    <div className="relative h-48 border-b border-border bg-muted/30">
      <svg viewBox={`0 0 ${largura} ${altura}`} className="h-full w-full" role="img" aria-label="Mapa do percurso atual">
        <path d="M0 48H320M0 96H320M0 144H320M64 0V190M128 0V190M192 0V190M256 0V190" className="stroke-border" strokeWidth="1" fill="none" />
        {pontos.length > 1 && <polyline points={linha} fill="none" className="stroke-primary" strokeWidth="5" strokeLinecap="round" strokeLinejoin="round" />}
        <circle cx={atual.x} cy={atual.y} r="10" className="fill-primary/20" />
        <circle cx={atual.x} cy={atual.y} r="5" className="fill-primary" />
      </svg>
      <span className="absolute left-3 top-3 rounded-md bg-background/90 px-2 py-1 text-[11px] font-semibold text-foreground">
        {ativo ? "GPS ativo" : "Percurso finalizado"}
      </span>
    </div>
  );
}

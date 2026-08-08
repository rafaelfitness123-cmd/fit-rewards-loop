import { createFileRoute, Link, useParams } from "@tanstack/react-router";
import { lazy, Suspense, useCallback, useEffect, useRef, useState } from "react";
import {
  ArrowLeft,
  CheckCircle2,
  Crosshair,
  Footprints,
  MapPin,
  Pause,
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
import { rastreador, type EstadoRastreio } from "@/lib/rastreador-gps";
import {
  aceitarMissao,
  corridasDe,
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

const MapaLeaflet = lazy(() => import("@/components/MapaLeaflet"));

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
  const [estado, setEstado] = useState<EstadoRastreio>(() => rastreador.ler());
  const [emIframe, setEmIframe] = useState(false);
  const [recuperavel, setRecuperavel] = useState<EstadoRastreio | null>(null);
  const [montado, setMontado] = useState(false);
  const finalizandoRef = useRef(false);

  useEffect(() => {
    setMontado(true);
    try {
      setEmIframe(window.self !== window.top);
    } catch {
      setEmIframe(true);
    }
    const salvo = rastreador.recuperar(missaoId);
    if (salvo && rastreador.ler().status === "parado") setRecuperavel(salvo);
  }, [missaoId]);

  useEffect(() => rastreador.assinar(setEstado), []);

  useEffect(() => {
    const aoFoco = () => rastreador.aoVoltarAoFoco();
    document.addEventListener("visibilitychange", aoFoco);
    return () => document.removeEventListener("visibilitychange", aoFoco);
  }, []);

  const ativo = estado.status === "ativo";
  const pausado = estado.status === "pausado";
  const rodando = ativo || pausado;

  const concluirPercurso = useCallback(
    (automatico: boolean) => {
      if (finalizandoRef.current) return;
      finalizandoRef.current = true;
      const final = rastreador.parar();
      try {
        const concluidas = registrarCorrida(
          clienteId,
          missaoId,
          final.metros,
          final.duracaoS,
        );
        rastreador.zerar();
        setRecuperavel(null);
        toast.success(
          automatico
            ? `Meta atingida! ${fmtDistancia(final.metros)} registrados.`
            : `Percurso registrado: ${fmtDistancia(final.metros)}`,
        );
        onFim(concluidas);
      } catch (error) {
        console.error("Falha ao salvar percurso", error);
        toast.error("Não foi possível salvar o percurso. Tente novamente.");
      } finally {
        finalizandoRef.current = false;
      }
    },
    [clienteId, missaoId, onFim],
  );

  // Conclusão automática ao bater a meta (mantém a regra atual do sistema).
  useEffect(() => {
    if (rodando && estado.metros >= metaM) concluirPercurso(true);
  }, [rodando, estado.metros, metaM, concluirPercurso]);

  const iniciar = (retomando?: EstadoRastreio) => {
    if (typeof window !== "undefined" && !window.isSecureContext) {
      toast.error("O GPS só funciona em conexão segura (https).");
      return;
    }
    setRecuperavel(null);
    rastreador.iniciar(missaoId, retomando);
  };

  const parar = () => {
    if (estado.metros < 10) {
      rastreador.zerar();
      toast.error("Distância muito curta para registrar.");
      return;
    }
    concluirPercurso(false);
  };

  const trilha = estado.trilha;
  const atual = estado.atual ?? trilha.at(-1) ?? null;
  const restante = Math.max(0, metaM - estado.metros);

  const badge =
    estado.qualidade === "boa"
      ? { cor: "text-primary", texto: "GPS preciso" }
      : estado.qualidade === "baixa"
        ? { cor: "text-gold", texto: "Precisão baixa" }
        : { cor: "text-destructive", texto: "GPS indisponível" };

  return (
    <section className="surface overflow-hidden">
      {montado ? (
        <Suspense
          fallback={
            <div className="flex h-56 items-center justify-center border-b border-border bg-muted/30 text-xs text-muted-foreground">
              Carregando mapa…
            </div>
          }
        >
          <MapaLeaflet trilha={trilha} atual={atual} ativo={rodando} />
        </Suspense>
      ) : (
        <div className="h-56 border-b border-border bg-muted/30" />
      )}

      <div className="flex items-center justify-between gap-2 border-b border-border px-4 py-2.5 text-xs">
        <span className={`flex items-center gap-1.5 font-semibold ${badge.cor}`}>
          <span className="inline-block size-2 rounded-full bg-current" />
          {badge.texto}
        </span>
        <span className="text-muted-foreground tabular-nums">
          {estado.accuracy != null && Number.isFinite(estado.accuracy)
            ? `±${Math.round(estado.accuracy)} m`
            : "sem sinal"}
        </span>
      </div>

      <div className="p-5 text-center">
        <Footprints className="mx-auto size-6 text-primary" />
        <p className="mt-3 text-5xl font-black tabular-nums">
          {(estado.metros / 1000).toFixed(2)}
          <span className="text-lg font-bold text-muted-foreground"> km</span>
        </p>
        <p className="mt-1 text-xs text-muted-foreground">
          de {fmtDistancia(metaM)}
        </p>
        <p className="mt-2 text-sm text-muted-foreground tabular-nums">
          {fmtTempo(estado.duracaoS)} ·{" "}
          {pausado ? "pausado" : estado.emMovimento ? "em movimento" : "parado"}
        </p>
        <div className="mt-3 flex items-center justify-center gap-2 text-xs text-muted-foreground">
          <Crosshair className="size-4 text-primary" />
          Faltam {fmtDistancia(restante)}
        </div>

        {!rodando && !estado.erro && (
          <div className="mt-4 flex items-center gap-2 rounded-md bg-primary/10 p-3 text-left text-xs text-muted-foreground">
            <ShieldCheck className="size-5 shrink-0 text-primary" />
            Ao iniciar, permita o uso da localização precisa. Ela é usada apenas nesta
            missão e não é compartilhada com outros alunos.
          </div>
        )}

        {recuperavel && !rodando && (
          <div className="mt-4 space-y-2 rounded-md bg-muted/50 p-3 text-left text-xs">
            <p className="text-muted-foreground">
              Encontramos um percurso não finalizado com{" "}
              <strong className="text-foreground">
                {fmtDistancia(recuperavel.metros)}
              </strong>
              . Deseja continuar?
            </p>
            <div className="flex gap-2">
              <Button size="sm" className="flex-1" onClick={() => iniciar(recuperavel)}>
                Continuar
              </Button>
              <Button
                size="sm"
                variant="secondary"
                className="flex-1"
                onClick={() => {
                  rastreador.limparSalvo();
                  setRecuperavel(null);
                }}
              >
                Descartar
              </Button>
            </div>
          </div>
        )}

        {estado.erro && (
          <div className="mt-3 space-y-2">
            <p className="text-xs text-destructive">{estado.erro}</p>
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

        {!rodando ? (
          <Button className="mt-5 w-full font-bold" onClick={() => iniciar()}>
            <Play className="mr-2 size-4" /> Iniciar percurso
          </Button>
        ) : (
          <div className="mt-5 grid grid-cols-2 gap-2">
            <Button
              variant="secondary"
              className="font-bold"
              onClick={() => (pausado ? rastreador.retomar() : rastreador.pausar())}
            >
              {pausado ? (
                <><Play className="mr-2 size-4" /> Continuar</>
              ) : (
                <><Pause className="mr-2 size-4" /> Pausar</>
              )}
            </Button>
            <Button className="font-bold" onClick={parar}>
              <Square className="mr-2 size-4" /> Parar e salvar
            </Button>
          </div>
        )}

        <p className="mt-2 text-[11px] text-muted-foreground">
          O navegador pausa o GPS com a tela bloqueada. Mantenha a tela ligada — a
          missão termina sozinha ao atingir a meta e o percurso é salvo automaticamente.
        </p>
      </div>
    </section>
  );
}


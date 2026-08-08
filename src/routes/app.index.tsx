import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { Flame, LocateFixed, MapPin, Megaphone, Star, Timer, Trophy } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { getAvisos, getClientes, getMissoes, getSessao } from "@/lib/db";
import { useClienteAtual, useStore } from "@/lib/session";
import {
  duracaoMinutos,
  fmtHora,
  formatarDuracao,
  missaoVigente,
  posicaoNoRanking,
  progressoDaMissao,
  saldoDe,
  sequenciaAtual,
  treinosDe,
} from "@/lib/gamificacao";

export const Route = createFileRoute("/app/")({
  head: () => ({
    meta: [
      { title: "Início — PulseFit" },
      {
        name: "description",
        content: "Seu resumo diário: pontos, sequência de treinos e missões do dia.",
      },
      { property: "og:title", content: "Início — PulseFit" },
      {
        property: "og:description",
        content: "Acompanhe pontos, sequência e missões da sua academia.",
      },
    ],
  }),
  component: Inicio,
});

function Inicio() {
  const cliente = useClienteAtual();
  const [dados] = useStore(() => {
    const s = getSessao();
    const id = s?.tipo === "cliente" ? s.clienteId : undefined;
    if (!id) return null;
    const treinos = treinosDe(id);
    return {
      pontos: saldoDe(id),
      streak: sequenciaAtual(id),
      posicao: posicaoNoRanking(
        id,
        getClientes().map((c) => c.id),
      ),
      totalClientes: getClientes().length,
      ultimo: treinos[0] ?? null,
      missoes: getMissoes()
        .filter((m) => missaoVigente(m))
        .map((m) => ({ m, p: progressoDaMissao(id, m) }))
        .filter((x) => !x.p.concedida)
        .slice(0, 3),
      avisos: getAvisos().slice(0, 3),
      temMissaoGps: getMissoes().some((m) => m.objetivo === "distancia" && missaoVigente(m)),
    };
  });

  if (!cliente || !dados) return null;

  const iniciais = cliente.nome
    .split(" ")
    .slice(0, 2)
    .map((n) => n[0])
    .join("")
    .toUpperCase();

  return (
    <div className="space-y-5">
      <section className="hero-surface p-5">
        <div className="flex items-center gap-3">
          <div className="flex size-12 items-center justify-center rounded-2xl bg-primary text-lg font-black text-primary-foreground">
            {cliente.avatar ? (
              <img
                src={cliente.avatar}
                alt={`Avatar de ${cliente.nome}`}
                className="size-12 rounded-2xl object-cover"
              />
            ) : (
              iniciais
            )}
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Bem-vindo de volta</p>
            <h1 className="text-xl font-black">Olá, {cliente.nome.split(" ")[0]}! 👋</h1>
          </div>
        </div>

        <div className="mt-5 grid grid-cols-3 gap-2 text-center">
          <div className="rounded-2xl bg-background/40 p-3">
            <Flame className="mx-auto size-5 text-flame" />
            <p className="mt-1 text-lg font-black">{dados.streak}</p>
            <p className="text-[11px] text-muted-foreground">dias seguidos</p>
          </div>
          <div className="rounded-2xl bg-background/40 p-3">
            <Star className="mx-auto size-5 text-gold" />
            <p className="mt-1 text-lg font-black">{dados.pontos}</p>
            <p className="text-[11px] text-muted-foreground">pontos</p>
          </div>
          <div className="rounded-2xl bg-background/40 p-3">
            <Trophy className="mx-auto size-5 text-primary" />
            <p className="mt-1 text-lg font-black">#{dados.posicao}</p>
            <p className="text-[11px] text-muted-foreground">
              de {dados.totalClientes}
            </p>
          </div>
        </div>

        <Button asChild className="mt-5 w-full font-bold">
          <Link to="/app/scan">Escanear QR Code da academia</Link>
        </Button>
      </section>

      {dados.temMissaoGps && <AtivacaoLocalizacao />}

      <section className="surface p-4">
        <h2 className="flex items-center gap-2 text-sm font-bold">
          <Timer className="size-4 text-primary" /> Último treino
        </h2>
        {dados.ultimo ? (
          <p className="mt-2 text-sm text-muted-foreground">
            {new Date(dados.ultimo.entrada).toLocaleDateString("pt-BR")} —{" "}
            {fmtHora(dados.ultimo.entrada)}
            {dados.ultimo.saida
              ? ` às ${fmtHora(dados.ultimo.saida)} · ${formatarDuracao(
                  duracaoMinutos(dados.ultimo),
                )}`
              : " · em andamento 🟢"}
          </p>
        ) : (
          <p className="mt-2 text-sm text-muted-foreground">
            Você ainda não registrou treinos. Escaneie o QR Code na recepção.
          </p>
        )}
      </section>

      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-bold">Missões de hoje</h2>
          <Link to="/app/missoes" className="text-xs font-semibold text-primary">
            Ver todas
          </Link>
        </div>
        {dados.missoes.length === 0 ? (
          <p className="surface p-4 text-sm text-muted-foreground">
            Nenhuma missão ativa no momento.
          </p>
        ) : (
          dados.missoes.map(({ m, p }) => (
            <div key={m.id} className="surface p-4">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="font-semibold">{m.nome}</p>
                  <p className="text-xs text-muted-foreground">{m.descricao}</p>
                </div>
                <span className="shrink-0 rounded-full bg-primary/15 px-2.5 py-1 text-xs font-bold text-primary">
                  +{m.pontos} pts
                </span>
              </div>
              <Progress
                className="mt-3 h-2"
                value={Math.min(100, (p.progresso / Math.max(1, m.quantidade)) * 100)}
              />
              <p className="mt-1 text-[11px] text-muted-foreground">
                {p.progresso}/{m.quantidade}
              </p>
            </div>
          ))
        )}
      </section>

      {dados.avisos.length > 0 && (
        <section className="space-y-3">
          <h2 className="text-sm font-bold">Avisos da academia</h2>
          {dados.avisos.map((a) => (
            <article
              key={a.id}
              className={`surface p-4 ${a.destaque ? "border-primary/40" : ""}`}
            >
              <p className="flex items-center gap-2 font-semibold">
                <Megaphone className="size-4 text-primary" /> {a.titulo}
              </p>
              <p className="mt-1 text-sm text-muted-foreground">{a.texto}</p>
              <p className="mt-2 text-[11px] text-muted-foreground">
                {new Date(a.data).toLocaleDateString("pt-BR")}
              </p>
            </article>
          ))}
        </section>
      )}
    </div>
  );
}

function AtivacaoLocalizacao() {
  const [estado, setEstado] = useState<"pronto" | "solicitando" | "ativo" | "negado">("pronto");

  const ativar = () => {
    if (typeof navigator === "undefined" || !navigator.geolocation) {
      toast.error("Este navegador não oferece suporte à localização.");
      return;
    }
    setEstado("solicitando");
    navigator.geolocation.getCurrentPosition(
      () => {
        setEstado("ativo");
        toast.success("Localização ativada para as missões de corrida.");
      },
      (error) => {
        setEstado("negado");
        toast.error(
          error.code === 1
            ? "Localização bloqueada. Libere a permissão deste site no navegador."
            : "Não foi possível obter sua localização. Tente em um local aberto.",
        );
      },
      { enableHighAccuracy: true, timeout: 30000, maximumAge: 5000 },
    );
  };

  return (
    <section className="surface flex items-center gap-3 p-4">
      <div className="flex size-10 shrink-0 items-center justify-center rounded-md bg-primary/15 text-primary">
        <MapPin className="size-5" />
      </div>
      <div className="min-w-0 flex-1">
        <h2 className="text-sm font-bold">GPS para missões de corrida</h2>
        <p className="mt-0.5 text-xs text-muted-foreground">
          {estado === "ativo"
            ? "Localização pronta. Abra uma missão de distância para começar."
            : estado === "negado"
              ? "Permissão bloqueada. Libere a localização nas configurações do navegador."
              : "Ative a localização precisa antes de iniciar um percurso."}
        </p>
      </div>
      {estado !== "ativo" && (
        <Button size="sm" onClick={ativar} disabled={estado === "solicitando"}>
          <LocateFixed className={estado === "solicitando" ? "animate-pulse" : ""} />
          {estado === "solicitando" ? "Ativando" : "Ativar"}
        </Button>
      )}
    </section>
  );
}

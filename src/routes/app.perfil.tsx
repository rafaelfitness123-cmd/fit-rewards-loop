import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { CalendarDays, Flame, LogOut, Star, Timer, Trophy } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { getClientes, getMissoes, getResgates } from "@/lib/db";
import { logout, useClienteAtual, useStore } from "@/lib/session";
import {
  duracaoMinutos,
  fmtDataHora,
  formatarDuracao,
  historicoDe,
  maiorSequencia,
  posicaoNoRanking,
  progressoDaMissao,
  saldoDe,
  sequenciaAtual,
  tempoTotalMinutos,
  treinosDe,
} from "@/lib/gamificacao";

export const Route = createFileRoute("/app/perfil")({
  head: () => ({
    meta: [
      { title: "Perfil — PulseFit" },
      {
        name: "description",
        content: "Seu perfil: estatísticas, histórico de treinos, pontos e resgates.",
      },
      { property: "og:title", content: "Perfil — PulseFit" },
      {
        property: "og:description",
        content: "Estatísticas completas de treinos, sequência e conquistas.",
      },
    ],
  }),
  component: Perfil,
});

function Perfil() {
  const navigate = useNavigate();
  const cliente = useClienteAtual();
  const [dados] = useStore(() => {
    const s = JSON.parse(
      (typeof window !== "undefined" && window.localStorage.getItem("academia_sessao")) ||
        "null",
    );
    const id = s?.clienteId as string | undefined;
    if (!id) return null;
    return {
      pontos: saldoDe(id),
      posicao: posicaoNoRanking(
        id,
        getClientes().map((c) => c.id),
      ),
      treinos: treinosDe(id),
      streak: sequenciaAtual(id),
      recorde: maiorSequencia(id),
      minutos: tempoTotalMinutos(id),
      historico: historicoDe(id),
      missoes: getMissoes().map((m) => ({ m, p: progressoDaMissao(id, m) })),
      resgates: getResgates().filter((r) => r.clienteId === id),
    };
  });

  if (!cliente || !dados) return null;

  const stats = [
    { icon: Star, label: "Pontos", valor: String(dados.pontos) },
    { icon: Trophy, label: "Ranking", valor: `#${dados.posicao}` },
    { icon: CalendarDays, label: "Treinos", valor: String(dados.treinos.length) },
    { icon: Flame, label: "Sequência", valor: `${dados.streak} dias` },
    { icon: Flame, label: "Recorde", valor: `${dados.recorde} dias` },
    { icon: Timer, label: "Tempo total", valor: formatarDuracao(dados.minutos) },
  ];

  return (
    <div className="space-y-4">
      <section className="hero-surface p-5 text-center">
        <div className="mx-auto flex size-20 items-center justify-center rounded-3xl bg-primary text-2xl font-black text-primary-foreground">
          {cliente.avatar ? (
            <img
              src={cliente.avatar}
              alt={`Avatar de ${cliente.nome}`}
              className="size-20 rounded-3xl object-cover"
            />
          ) : (
            cliente.nome
              .split(" ")
              .slice(0, 2)
              .map((n) => n[0])
              .join("")
              .toUpperCase()
          )}
        </div>
        <h1 className="mt-3 text-xl font-black">{cliente.nome}</h1>
        <p className="text-xs text-muted-foreground">CPF {cliente.cpf}</p>
      </section>

      <section className="grid grid-cols-3 gap-2">
        {stats.map((s) => (
          <div key={s.label} className="surface p-3 text-center">
            <s.icon className="mx-auto size-4 text-primary" />
            <p className="mt-1 text-sm font-black">{s.valor}</p>
            <p className="text-[10px] text-muted-foreground">{s.label}</p>
          </div>
        ))}
      </section>

      <Tabs defaultValue="treinos">
        <TabsList className="w-full">
          <TabsTrigger value="treinos" className="flex-1 text-xs">
            Treinos
          </TabsTrigger>
          <TabsTrigger value="pontos" className="flex-1 text-xs">
            Pontos
          </TabsTrigger>
          <TabsTrigger value="missoes" className="flex-1 text-xs">
            Missões
          </TabsTrigger>
          <TabsTrigger value="resgates" className="flex-1 text-xs">
            Resgates
          </TabsTrigger>
        </TabsList>

        <TabsContent value="treinos" className="space-y-2 pt-4">
          {dados.treinos.length === 0 && (
            <p className="surface p-4 text-sm text-muted-foreground">Sem treinos.</p>
          )}
          {dados.treinos.map((t) => (
            <div key={t.id} className="surface flex items-center justify-between p-3">
              <div>
                <p className="text-sm font-semibold">{fmtDataHora(t.entrada)}</p>
                <p className="text-[11px] text-muted-foreground">
                  {t.saida
                    ? `Saída ${fmtDataHora(t.saida)} · ${formatarDuracao(duracaoMinutos(t))}`
                    : "Em andamento"}
                </p>
              </div>
              <span className="text-sm font-black text-primary">
                +{t.pontosEntrada + t.pontosSaida}
              </span>
            </div>
          ))}
        </TabsContent>

        <TabsContent value="pontos" className="space-y-2 pt-4">
          {dados.historico.length === 0 && (
            <p className="surface p-4 text-sm text-muted-foreground">Sem registros.</p>
          )}
          {dados.historico.map((h) => (
            <div key={h.id} className="surface flex items-center justify-between p-3">
              <div>
                <p className="text-sm font-semibold">{h.motivo}</p>
                <p className="text-[11px] text-muted-foreground">{fmtDataHora(h.data)}</p>
              </div>
              <span
                className={`text-sm font-black ${h.delta >= 0 ? "text-primary" : "text-destructive"}`}
              >
                {h.delta >= 0 ? "+" : ""}
                {h.delta}
              </span>
            </div>
          ))}
        </TabsContent>

        <TabsContent value="missoes" className="space-y-2 pt-4">
          {dados.missoes.length === 0 && (
            <p className="surface p-4 text-sm text-muted-foreground">Sem missões.</p>
          )}
          {dados.missoes.map(({ m, p }) => (
            <div key={m.id} className="surface flex items-center justify-between p-3">
              <div>
                <p className="text-sm font-semibold">{m.nome}</p>
                <p className="text-[11px] text-muted-foreground">
                  {p.progresso}/{m.quantidade} · {m.tipo}
                </p>
              </div>
              <span className="text-xs font-bold text-primary">
                {p.concedida ? "Concluída" : `+${m.pontos} pts`}
              </span>
            </div>
          ))}
        </TabsContent>

        <TabsContent value="resgates" className="space-y-2 pt-4">
          {dados.resgates.length === 0 && (
            <p className="surface p-4 text-sm text-muted-foreground">Sem resgates.</p>
          )}
          {dados.resgates.map((r) => (
            <div key={r.id} className="surface flex items-center justify-between p-3">
              <div>
                <p className="text-sm font-semibold">{r.recompensaNome}</p>
                <p className="text-[11px] text-muted-foreground">
                  {fmtDataHora(r.data)} · {r.pontos} pts
                </p>
              </div>
              <span className="rounded-full bg-accent px-2.5 py-1 text-[11px] font-semibold capitalize">
                {r.status}
              </span>
            </div>
          ))}
        </TabsContent>
      </Tabs>

      <Button
        variant="secondary"
        className="w-full"
        onClick={() => {
          logout();
          navigate({ to: "/" });
        }}
      >
        <LogOut className="mr-2 size-4" /> Sair da conta
      </Button>
    </div>
  );
}

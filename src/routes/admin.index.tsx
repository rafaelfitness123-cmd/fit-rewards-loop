import { createFileRoute, Link } from "@tanstack/react-router";
import {
  Activity,
  Dumbbell,
  Gift,
  ListChecks,
  PackageCheck,
  QrCode,
  Settings,
  Star,
  Trophy,
  Users,
} from "lucide-react";
import {
  getClientes,
  getHistorico,
  getMissoes,
  getResgates,
  getTreinos,
} from "@/lib/db";
import { useStore } from "@/lib/session";
import { diaKey, missaoVigente } from "@/lib/gamificacao";

export const Route = createFileRoute("/admin/")({
  head: () => ({
    meta: [
      { title: "Dashboard — Painel PulseFit" },
      {
        name: "description",
        content: "Visão geral da academia: clientes, treinos, pontos e resgates.",
      },
      { property: "og:title", content: "Dashboard — Painel PulseFit" },
      {
        property: "og:description",
        content: "Indicadores em tempo real da academia e atalhos de gestão.",
      },
    ],
  }),
  component: Dashboard,
});

const atalhos = [
  { to: "/admin/qrcode", label: "QR Code", icon: QrCode },
  { to: "/admin/clientes", label: "Clientes", icon: Users },
  { to: "/admin/pontuacao", label: "Pontuação", icon: Star },
  { to: "/admin/missoes", label: "Missões", icon: ListChecks },
  { to: "/admin/recompensas", label: "Recompensas", icon: Gift },
  { to: "/admin/resgates", label: "Resgates", icon: PackageCheck },
  { to: "/admin/ranking", label: "Ranking", icon: Trophy },
  { to: "/admin/configuracoes", label: "Configurações", icon: Settings },
] as const;

function Dashboard() {
  const [d] = useStore(() => {
    const hoje = diaKey(new Date());
    const treinos = getTreinos();
    return {
      clientes: getClientes().length,
      agora: treinos.filter((t) => !t.saida).length,
      hoje: treinos.filter((t) => diaKey(new Date(t.entrada)) === hoje).length,
      pontos: getHistorico()
        .filter((h) => h.delta > 0)
        .reduce((a, h) => a + h.delta, 0),
      missoes: getMissoes().filter((m) => missaoVigente(m)).length,
      pendentes: getResgates().filter((r) => r.status === "solicitado").length,
    };
  });

  const cards = [
    { label: "Total de clientes", valor: d.clientes, icon: Users },
    { label: "Treinando agora", valor: d.agora, icon: Activity },
    { label: "Treinos de hoje", valor: d.hoje, icon: Dumbbell },
    { label: "Pontos distribuídos", valor: d.pontos, icon: Star },
    { label: "Missões ativas", valor: d.missoes, icon: ListChecks },
    { label: "Resgates pendentes", valor: d.pendentes, icon: PackageCheck },
  ];

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-2xl font-black">Dashboard</h1>
        <p className="text-sm text-muted-foreground">Visão geral da academia.</p>
      </header>

      <section className="grid grid-cols-2 gap-3 md:grid-cols-3">
        {cards.map((c) => (
          <div key={c.label} className="surface p-4">
            <c.icon className="size-4 text-primary" />
            <p className="mt-2 text-2xl font-black">{c.valor}</p>
            <p className="text-xs text-muted-foreground">{c.label}</p>
          </div>
        ))}
      </section>

      <section>
        <h2 className="mb-3 text-sm font-bold">Atalhos</h2>
        <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
          {atalhos.map((a) => (
            <Link
              key={a.to}
              to={a.to}
              className="surface flex flex-col items-center gap-2 p-4 text-sm font-semibold transition-colors hover:border-primary/50"
            >
              <a.icon className="size-5 text-primary" />
              {a.label}
            </Link>
          ))}
        </div>
      </section>
    </div>
  );
}

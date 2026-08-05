import { createFileRoute } from "@tanstack/react-router";
import { Trophy } from "lucide-react";
import { getClientes, getPontos } from "@/lib/db";
import { useStore } from "@/lib/session";
import { sequenciaAtual, treinosDe } from "@/lib/gamificacao";

export const Route = createFileRoute("/admin/ranking")({
  head: () => ({
    meta: [
      { title: "Ranking dos alunos — Painel PulseFit" },
      {
        name: "description",
        content: "Classificação geral dos alunos por pontos acumulados.",
      },
      { property: "og:title", content: "Ranking dos alunos — Painel PulseFit" },
      {
        property: "og:description",
        content: "Ranking real calculado a partir dos pontos registrados.",
      },
    ],
  }),
  component: RankingAdmin,
});

function RankingAdmin() {
  const [lista] = useStore(() => {
    const pontos = getPontos();
    return getClientes()
      .map((c) => ({
        id: c.id,
        nome: c.nome,
        total: pontos[c.id] ?? 0,
        treinos: treinosDe(c.id).length,
        streak: sequenciaAtual(c.id),
      }))
      .sort((a, b) => b.total - a.total || a.nome.localeCompare(b.nome));
  });

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-2xl font-black">Ranking</h1>
        <p className="text-sm text-muted-foreground">Ordenado por pontos.</p>
      </header>

      <section className="space-y-2">
        {lista.map((c, i) => (
          <div key={c.id} className="surface flex items-center gap-3 p-4">
            <span className="w-10 text-center text-lg font-black">
              {i === 0 ? "🥇" : i === 1 ? "🥈" : i === 2 ? "🥉" : `#${i + 1}`}
            </span>
            <div className="flex-1">
              <p className="font-semibold">{c.nome}</p>
              <p className="text-[11px] text-muted-foreground">
                {c.treinos} treinos · 🔥 {c.streak} dias
              </p>
            </div>
            <span className="flex items-center gap-1 font-black text-primary">
              <Trophy className="size-4" /> {c.total}
            </span>
          </div>
        ))}
      </section>
    </div>
  );
}

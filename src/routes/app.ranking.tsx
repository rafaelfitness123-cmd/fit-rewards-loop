import { createFileRoute } from "@tanstack/react-router";
import { Trophy } from "lucide-react";
import { getClientes, getPontos } from "@/lib/db";
import { useClienteAtual, useStore } from "@/lib/session";
import { sequenciaAtual } from "@/lib/gamificacao";

export const Route = createFileRoute("/app/ranking")({
  head: () => ({
    meta: [
      { title: "Ranking — PulseFit" },
      {
        name: "description",
        content: "Ranking real de pontos dos alunos da academia e sua posição.",
      },
      { property: "og:title", content: "Ranking — PulseFit" },
      {
        property: "og:description",
        content: "Veja quem está liderando o ranking de pontos da academia.",
      },
    ],
  }),
  component: Ranking,
});

const medalha = (i: number) => (i === 0 ? "🥇" : i === 1 ? "🥈" : i === 2 ? "🥉" : `#${i + 1}`);

function Ranking() {
  const cliente = useClienteAtual();
  const [lista] = useStore(() => {
    const pontos = getPontos();
    return getClientes()
      .map((c) => ({
        id: c.id,
        nome: c.nome,
        total: pontos[c.id] ?? 0,
        streak: sequenciaAtual(c.id),
      }))
      .sort((a, b) => b.total - a.total || a.nome.localeCompare(b.nome));
  });

  if (!cliente) return null;
  const minhaPos = lista.findIndex((c) => c.id === cliente.id) + 1;
  const meu = lista.find((c) => c.id === cliente.id);

  return (
    <div className="space-y-4">
      <header>
        <h1 className="text-2xl font-black">Ranking</h1>
        <p className="text-sm text-muted-foreground">Classificação por pontos.</p>
      </header>

      <section className="hero-surface flex items-center justify-between p-5">
        <div>
          <p className="text-xs text-muted-foreground">Sua posição</p>
          <p className="text-3xl font-black">#{minhaPos || "-"}</p>
        </div>
        <div className="text-right">
          <p className="text-xs text-muted-foreground">Total</p>
          <p className="text-3xl font-black">{meu?.total ?? 0}</p>
        </div>
      </section>

      <section className="space-y-2">
        {lista.map((c, i) => (
          <div
            key={c.id}
            className={`surface flex items-center gap-3 p-3 ${
              c.id === cliente.id ? "border-primary/60" : ""
            }`}
          >
            <span className="w-9 text-center text-lg font-black">{medalha(i)}</span>
            <div className="flex-1">
              <p className="text-sm font-semibold">{c.nome}</p>
              <p className="text-[11px] text-muted-foreground">
                🔥 {c.streak} dias de sequência
              </p>
            </div>
            <span className="flex items-center gap-1 text-sm font-black text-primary">
              <Trophy className="size-4" /> {c.total}
            </span>
          </div>
        ))}
      </section>
    </div>
  );
}

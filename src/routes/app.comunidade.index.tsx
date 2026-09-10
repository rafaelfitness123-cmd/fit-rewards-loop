import { createFileRoute } from "@tanstack/react-router";
import { Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import FeedComunidade from "@/components/FeedComunidade";

export { useAutores, useSouAdmin } from "@/components/FeedComunidade";

export const Route = createFileRoute("/app/comunidade/")({
  head: () => ({
    meta: [
      { title: "Comunidade — PulseFit" },
      {
        name: "description",
        content:
          "O feed da Companhia Fitness: treinos, conquistas e missões concluídas pelos alunos.",
      },
      { property: "og:title", content: "Comunidade — PulseFit" },
      {
        property: "og:description",
        content: "Veja e curta as conquistas dos colegas da Companhia Fitness.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  errorComponent: ({ reset }) => (
    <div className="surface space-y-3 p-4">
      <p className="text-sm text-muted-foreground">Não foi possível carregar a comunidade agora.</p>
      <Button className="w-full" onClick={reset}>
        Tentar novamente
      </Button>
    </div>
  ),
  notFoundComponent: () => (
    <p className="surface p-4 text-sm text-muted-foreground">Nada por aqui ainda.</p>
  ),
  component: Comunidade,
});

function Comunidade() {
  return (
    <div className="space-y-4">
      <header className="hero-surface flex items-center justify-between gap-3 p-4">
        <div className="min-w-0">
          <h1 className="flex items-center gap-2 text-xl font-black">
            <Users className="size-5 text-primary" /> Comunidade
          </h1>
          <p className="text-[11px] text-muted-foreground">
            Exclusivo para os alunos da Companhia Fitness.
          </p>
        </div>
      </header>

      <FeedComunidade />
    </div>
  );
}

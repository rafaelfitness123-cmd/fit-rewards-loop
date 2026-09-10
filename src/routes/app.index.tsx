import { createFileRoute } from "@tanstack/react-router";
import { Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import FeedComunidade from "@/components/FeedComunidade";

export const Route = createFileRoute("/app/")({
  head: () => ({
    meta: [
      { title: "Início — PulseFit" },
      {
        name: "description",
        content: "O feed da Companhia Fitness: treinos, conquistas e missões dos alunos.",
      },
      { property: "og:title", content: "Início — PulseFit" },
      {
        property: "og:description",
        content: "Veja e curta as publicações dos colegas da Companhia Fitness.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  errorComponent: ({ reset }) => (
    <div className="surface space-y-3 p-4">
      <p className="text-sm text-muted-foreground">Não foi possível carregar o feed agora.</p>
      <Button className="w-full" onClick={reset}>
        Tentar novamente
      </Button>
    </div>
  ),
  component: Inicio,
});

function Inicio() {
  return (
    <div className="space-y-4">
      <header className="hero-surface flex items-center justify-between gap-3 p-4">
        <div className="min-w-0">
          <h1 className="flex items-center gap-2 text-xl font-black">
            <Users className="size-5 text-primary" /> Início
          </h1>
          <p className="text-[11px] text-muted-foreground">
            O que está rolando na Companhia Fitness.
          </p>
        </div>
      </header>

      <FeedComunidade />
    </div>
  );
}

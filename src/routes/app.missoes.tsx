import { createFileRoute, Link } from "@tanstack/react-router";
import { CheckCircle2, ChevronRight, Target } from "lucide-react";

import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { getMissoes, type Missao, type MissaoTipo } from "@/lib/db";
import { useClienteAtual, useStore } from "@/lib/session";
import { missaoVigente, progressoDaMissao } from "@/lib/gamificacao";


export const Route = createFileRoute("/app/missoes")({
  head: () => ({
    meta: [
      { title: "Missões — PulseFit" },
      {
        name: "description",
        content: "Missões diárias, semanais, mensais e desafios especiais da academia.",
      },
      { property: "og:title", content: "Missões — PulseFit" },
      {
        property: "og:description",
        content: "Cumpra missões, acompanhe o progresso e ganhe pontos extras.",
      },
    ],
  }),
  component: Missoes,
});

const tipos: { valor: MissaoTipo | "todas"; label: string }[] = [
  { valor: "todas", label: "Todas" },
  { valor: "diaria", label: "Diárias" },
  { valor: "semanal", label: "Semanais" },
  { valor: "mensal", label: "Mensais" },
  { valor: "especial", label: "Especiais" },
];

function Missoes() {
  const cliente = useClienteAtual();
  const id = cliente?.id;
  const [lista, atualizar] = useStore(() => {
    if (!id)
      return [] as {
        m: Missao;
        progresso: number;
        concluida: boolean;
        aceita: boolean;
      }[];
    return getMissoes()
      .filter((m) => missaoVigente(m))
      .map((m) => {
        const p = progressoDaMissao(id, m);
        return {
          m,
          progresso: p.progresso,
          concluida: p.concedida || p.concluida,
          aceita: p.aceita,
        };
      });
  });

  if (!cliente) return null;

  return (
    <div className="space-y-4">
      <header>
        <h1 className="text-2xl font-black">Missões</h1>
        <p className="text-sm text-muted-foreground">
          Complete objetivos e ganhe pontos automaticamente.
        </p>
      </header>

      <Tabs defaultValue="todas">
        <TabsList className="w-full">
          {tipos.map((t) => (
            <TabsTrigger key={t.valor} value={t.valor} className="flex-1 text-xs">
              {t.label}
            </TabsTrigger>
          ))}
        </TabsList>
        {tipos.map((t) => {
          const filtradas = t.valor === "todas" ? lista : lista.filter((x) => x.m.tipo === t.valor);
          return (
            <TabsContent key={t.valor} value={t.valor} className="space-y-3 pt-4">
              {filtradas.length === 0 ? (
                <p className="surface p-4 text-sm text-muted-foreground">
                  Nenhuma missão ativa nesta categoria.
                </p>
              ) : (
                filtradas.map(({ m, progresso, concluida, aceita }) => (
                  <Link
                    key={m.id}
                    to="/app/missao/$id"
                    params={{ id: m.id }}
                    className={`surface block p-4 transition-colors active:opacity-80 ${
                      concluida ? "border-primary/50" : ""
                    }`}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p className="flex items-center gap-2 font-semibold">
                          {concluida ? (
                            <CheckCircle2 className="size-4 shrink-0 text-primary" />
                          ) : (
                            <Target className="size-4 shrink-0 text-muted-foreground" />
                          )}
                          {m.nome}
                        </p>
                        <p className="mt-1 text-xs text-muted-foreground">{m.descricao}</p>
                      </div>
                      <span className="shrink-0 rounded-full bg-primary/15 px-2.5 py-1 text-xs font-bold text-primary">
                        +{m.pontos} pts
                      </span>
                    </div>
                    <Progress
                      className="mt-3 h-2"
                      value={Math.min(100, (progresso / Math.max(1, m.quantidade)) * 100)}
                    />
                    <p className="mt-1 text-[11px] text-muted-foreground">
                      {concluida
                        ? "Missão concluída 🎉"
                        : m.objetivo === "distancia"
                          ? `${(progresso / 1000).toFixed(2)} km de ${(m.quantidade / 1000).toFixed(2)} km`
                          : `${progresso}/${m.quantidade} concluídos`}
                    </p>
                    <p className="mt-2 flex items-center gap-1 text-[11px] font-semibold text-primary">
                      {m.objetivo === "distancia" && !aceita
                        ? "Abrir missão para aceitar o desafio"
                        : m.objetivo === "distancia"
                          ? "Abrir missão para correr com GPS"
                          : "Ver detalhes da missão"}
                      <ChevronRight className="size-3" />
                    </p>
                  </Link>
                ))
              )}
            </TabsContent>
          );
        })}
      </Tabs>
    </div>
  );
}

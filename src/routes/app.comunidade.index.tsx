import { createFileRoute, Link } from "@tanstack/react-router";
import { useCallback, useEffect, useState } from "react";
import { Plus, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import PublicacaoCard from "@/components/PublicacaoCard";
import { getClientes, getSessao } from "@/lib/db";
import { useClienteAtual, useStore } from "@/lib/session";
import { listarFeed, PAGINA, type Publicacao } from "@/lib/comunidade";

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

export function useAutores() {
  const [autores] = useStore(
    () =>
      new Map(
        getClientes().map((c) => [
          c.id,
          { id: c.id, nome: c.nome, avatar: c.avatar as string | undefined },
        ]),
      ),
  );
  return autores;
}

export function useSouAdmin() {
  const [admin] = useStore(() => getSessao()?.tipo === "admin");
  return admin;
}

function Comunidade() {
  const cliente = useClienteAtual();
  const autores = useAutores();
  const souAdmin = useSouAdmin();
  const meuId = cliente?.id ?? "";

  const [posts, setPosts] = useState<Publicacao[]>([]);
  const [pagina, setPagina] = useState(0);
  const [temMais, setTemMais] = useState(true);
  const [carregando, setCarregando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);

  const carregar = useCallback(
    async (p: number) => {
      if (!meuId) return;
      setCarregando(true);
      setErro(null);
      try {
        const lote = await listarFeed(p, meuId);
        setPosts((atuais) => (p === 0 ? lote : [...atuais, ...lote]));
        setTemMais(lote.length === PAGINA);
        setPagina(p);
      } catch {
        setErro("Não foi possível carregar as publicações.");
      } finally {
        setCarregando(false);
      }
    },
    [meuId],
  );

  useEffect(() => {
    if (meuId) void carregar(0);
  }, [meuId, carregar]);

  if (!cliente) return null;

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

      <Button asChild className="w-full font-bold">
        <Link to="/app/comunidade/novo">
          <Plus className="mr-2 size-4" /> Criar publicação
        </Link>
      </Button>

      <BuscaAlunos alunos={[...autores.values()]} meuId={meuId} />

      {erro && (
        <div className="surface space-y-3 p-4">
          <p className="text-sm text-destructive">{erro}</p>
          <Button variant="secondary" className="w-full" onClick={() => void carregar(0)}>
            Tentar novamente
          </Button>
        </div>
      )}

      {!erro && posts.length === 0 && !carregando && (
        <p className="surface p-4 text-sm text-muted-foreground">
          Nenhuma publicação ainda. Seja o primeiro a compartilhar um treino ou uma missão!
        </p>
      )}

      {posts.map((p) => (
        <PublicacaoCard
          key={p.id}
          post={p}
          autor={autores.get(p.autorId) ?? null}
          autores={autores}
          meuId={meuId}
          souAdmin={souAdmin}
          onRemovido={(id) => setPosts((lista) => lista.filter((x) => x.id !== id))}
        />
      ))}

      {carregando && <p className="p-4 text-center text-xs text-muted-foreground">Carregando…</p>}

      {temMais && posts.length > 0 && !carregando && (
        <Button variant="secondary" className="w-full" onClick={() => void carregar(pagina + 1)}>
          Carregar mais
        </Button>
      )}
    </div>
  );
}

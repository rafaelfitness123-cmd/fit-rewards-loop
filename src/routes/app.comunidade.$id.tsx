import { createFileRoute, Link, useParams } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import PublicacaoCard from "@/components/PublicacaoCard";
import { getClientes, getSessao } from "@/lib/db";
import { useClienteAtual, useStore } from "@/lib/session";
import { obterPublicacao, type Publicacao } from "@/lib/comunidade";

export const Route = createFileRoute("/app/comunidade/$id")({
  head: () => ({
    meta: [
      { title: "Publicação — PulseFit" },
      {
        name: "description",
        content: "Veja a publicação completa de um aluno da Companhia Fitness.",
      },
      { property: "og:title", content: "Publicação — PulseFit" },
      {
        property: "og:description",
        content: "Conquistas, treinos e missões compartilhadas na comunidade.",
      },
      { property: "og:type", content: "article" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  errorComponent: ({ reset }) => (
    <div className="surface space-y-3 p-4">
      <p className="text-sm text-muted-foreground">Não foi possível abrir a publicação.</p>
      <Button className="w-full" onClick={reset}>
        Tentar novamente
      </Button>
    </div>
  ),
  notFoundComponent: () => (
    <p className="surface p-4 text-sm text-muted-foreground">Publicação não encontrada.</p>
  ),
  component: PostDetalhe,
});

function PostDetalhe() {
  const { id } = useParams({ from: "/app/comunidade/$id" });
  const cliente = useClienteAtual();
  const meuId = cliente?.id ?? "";
  const [autores] = useStore(
    () =>
      new Map(
        getClientes().map((c) => [
          c.id,
          { id: c.id, nome: c.nome, avatar: c.avatar as string | undefined },
        ]),
      ),
  );
  const [souAdmin] = useStore(() => getSessao()?.tipo === "admin");

  const [post, setPost] = useState<Publicacao | null | "removido">(null);
  const [carregando, setCarregando] = useState(true);

  useEffect(() => {
    if (!meuId) return;
    let vivo = true;
    setCarregando(true);
    void obterPublicacao(id, meuId)
      .then((p) => vivo && setPost(p))
      .catch(() => vivo && setPost(null))
      .finally(() => vivo && setCarregando(false));
    return () => {
      vivo = false;
    };
  }, [id, meuId]);

  if (!cliente) return null;

  return (
    <div className="space-y-4">
      <Link
        to="/app/comunidade"
        className="inline-flex items-center gap-1 text-xs font-semibold text-muted-foreground"
      >
        <ArrowLeft className="size-4" /> Voltar para a comunidade
      </Link>

      {carregando && <p className="surface p-4 text-sm text-muted-foreground">Carregando…</p>}

      {!carregando && (post === null || post === "removido") && (
        <p className="surface p-4 text-sm text-muted-foreground">
          Esta publicação não está mais disponível.
        </p>
      )}

      {post && post !== "removido" && (
        <PublicacaoCard
          post={post}
          autor={autores.get(post.autorId) ?? null}
          autores={autores}
          meuId={meuId}
          souAdmin={souAdmin}
          comentariosAbertos
          onRemovido={() => setPost("removido")}
        />
      )}
    </div>
  );
}

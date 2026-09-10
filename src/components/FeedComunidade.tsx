import { Link } from "@tanstack/react-router";
import { useCallback, useEffect, useState } from "react";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import PublicacaoCard from "@/components/PublicacaoCard";
import BuscaAlunos from "@/components/BuscaAlunos";
import { getClientes, getSessao } from "@/lib/db";
import { useClienteAtual, useStore } from "@/lib/session";
import { listarFeed, PAGINA, type Publicacao } from "@/lib/comunidade";

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

/** Feed da comunidade — reutilizado na tela Início e na aba Comunidade. */
export default function FeedComunidade() {
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
      <div className="flex items-center gap-2">
        <Button asChild className="flex-1 font-bold">
          <Link to="/app/comunidade/novo">
            <Plus className="mr-2 size-4" /> Criar publicação
          </Link>
        </Button>
      </div>

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

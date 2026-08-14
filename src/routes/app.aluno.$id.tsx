import { createFileRoute, Link, useParams } from "@tanstack/react-router";
import { useCallback, useEffect, useState } from "react";
import { ArrowLeft, CalendarDays, Grid3x3, Star, Trophy } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import FotoPublicacao from "@/components/FotoPublicacao";
import PublicacaoCard from "@/components/PublicacaoCard";
import { getClientes, getMissoes, getSessao } from "@/lib/db";
import { useClienteAtual, useStore } from "@/lib/session";
import {
  posicaoNoRanking,
  progressoDaMissao,
  saldoDe,
  sequenciaAtual,
  treinosDe,
} from "@/lib/gamificacao";
import { listarDoAluno, PAGINA, type Publicacao } from "@/lib/comunidade";

export const Route = createFileRoute("/app/aluno/$id")({
  head: () => ({
    meta: [
      { title: "Perfil do aluno — PulseFit" },
      {
        name: "description",
        content: "Perfil público de um aluno da Companhia Fitness: pontos, conquistas e posts.",
      },
      { property: "og:title", content: "Perfil do aluno — PulseFit" },
      {
        property: "og:description",
        content: "Veja as publicações e conquistas de um colega de treino.",
      },
      { property: "og:type", content: "profile" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  errorComponent: ({ reset }) => (
    <div className="surface space-y-3 p-4">
      <p className="text-sm text-muted-foreground">Não foi possível abrir este perfil.</p>
      <Button className="w-full" onClick={reset}>
        Tentar novamente
      </Button>
    </div>
  ),
  notFoundComponent: () => (
    <p className="surface p-4 text-sm text-muted-foreground">Aluno não encontrado.</p>
  ),
  component: PerfilPublico,
});

function PerfilPublico() {
  const { id } = useParams({ from: "/app/aluno/$id" });
  const eu = useClienteAtual();
  const meuId = eu?.id ?? "";

  const [dados] = useStore(() => {
    const clientes = getClientes();
    const aluno = clientes.find((c) => c.id === id) ?? null;
    if (!aluno) return null;
    return {
      aluno,
      pontos: saldoDe(id),
      posicao: posicaoNoRanking(
        id,
        clientes.map((c) => c.id),
      ),
      treinos: treinosDe(id).length,
      streak: sequenciaAtual(id),
      conquistas: getMissoes()
        .map((m) => ({ m, p: progressoDaMissao(id, m) }))
        .filter(({ p }) => p.concluida || p.concedida),
    };
  });

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

  const [posts, setPosts] = useState<Publicacao[]>([]);
  const [pagina, setPagina] = useState(0);
  const [temMais, setTemMais] = useState(true);
  const [carregando, setCarregando] = useState(false);

  const carregar = useCallback(
    async (p: number) => {
      if (!meuId) return;
      setCarregando(true);
      try {
        const lote = await listarDoAluno(id, p, meuId);
        setPosts((atuais) => (p === 0 ? lote : [...atuais, ...lote]));
        setTemMais(lote.length === PAGINA);
        setPagina(p);
      } finally {
        setCarregando(false);
      }
    },
    [id, meuId],
  );

  useEffect(() => {
    if (meuId) void carregar(0);
  }, [meuId, carregar]);

  if (!eu) return null;

  if (!dados) {
    return (
      <div className="space-y-4">
        <Voltar />
        <p className="surface p-4 text-sm text-muted-foreground">Aluno não encontrado.</p>
      </div>
    );
  }

  const { aluno } = dados;
  const comFoto = posts.filter((p) => p.imagemPath);

  return (
    <div className="space-y-4">
      <Voltar />

      <section className="hero-surface p-5 text-center">
        <div className="mx-auto flex size-20 items-center justify-center overflow-hidden rounded-3xl bg-primary text-2xl font-black text-primary-foreground">
          {aluno.avatar ? (
            <img
              src={aluno.avatar}
              alt={`Avatar de ${aluno.nome}`}
              className="size-20 object-cover"
            />
          ) : (
            aluno.nome
              .split(" ")
              .slice(0, 2)
              .map((n) => n[0])
              .join("")
              .toUpperCase()
          )}
        </div>
        <h1 className="mt-3 text-xl font-black">{aluno.nome}</h1>
        <p className="text-xs text-muted-foreground">Companhia Fitness</p>
        <div className="mt-3 flex justify-center">
          <BotaoSeguir meuId={meuId} alunoId={aluno.id} />
        </div>
      </section>

      <section className="grid grid-cols-4 gap-2">
        {[
          { icon: Star, label: "Pontos", valor: String(dados.pontos) },
          { icon: Trophy, label: "Ranking", valor: `#${dados.posicao}` },
          { icon: CalendarDays, label: "Treinos", valor: String(dados.treinos) },
          { icon: Grid3x3, label: "Posts", valor: String(posts.length) },
        ].map((s) => (
          <div key={s.label} className="surface p-3 text-center">
            <s.icon className="mx-auto size-4 text-primary" />
            <p className="mt-1 text-sm font-black">{s.valor}</p>
            <p className="text-[10px] text-muted-foreground">{s.label}</p>
          </div>
        ))}
      </section>

      <Tabs defaultValue="publicacoes">
        <TabsList className="w-full">
          <TabsTrigger value="publicacoes" className="flex-1 text-xs">
            Publicações
          </TabsTrigger>
          <TabsTrigger value="conquistas" className="flex-1 text-xs">
            Conquistas
          </TabsTrigger>
        </TabsList>

        <TabsContent value="publicacoes" className="space-y-3 pt-4">
          {comFoto.length > 0 && (
            <div className="grid grid-cols-3 gap-1">
              {comFoto.map((p) => (
                <Link
                  key={p.id}
                  to="/app/comunidade/$id"
                  params={{ id: p.id }}
                  className="aspect-square overflow-hidden rounded-md"
                >
                  <FotoPublicacao
                    path={p.imagemPath as string}
                    alt={`Publicação de ${aluno.nome}`}
                    className="size-full object-cover"
                  />
                </Link>
              ))}
            </div>
          )}

          {posts
            .filter((p) => !p.imagemPath)
            .map((p) => (
              <PublicacaoCard
                key={p.id}
                post={p}
                autor={autores.get(p.autorId) ?? null}
                autores={autores}
                meuId={meuId}
                souAdmin={souAdmin}
                onRemovido={(pid) => setPosts((l) => l.filter((x) => x.id !== pid))}
              />
            ))}

          {posts.length === 0 && !carregando && (
            <p className="surface p-4 text-sm text-muted-foreground">
              Este aluno ainda não publicou nada.
            </p>
          )}

          {carregando && <p className="text-center text-xs text-muted-foreground">Carregando…</p>}

          {temMais && posts.length > 0 && !carregando && (
            <Button
              variant="secondary"
              className="w-full"
              onClick={() => void carregar(pagina + 1)}
            >
              Carregar mais
            </Button>
          )}
        </TabsContent>

        <TabsContent value="conquistas" className="space-y-2 pt-4">
          {dados.conquistas.length === 0 && (
            <p className="surface p-4 text-sm text-muted-foreground">Sem conquistas ainda.</p>
          )}
          {dados.conquistas.map(({ m }) => (
            <div key={m.id} className="surface flex items-center justify-between p-3">
              <div className="min-w-0">
                <p className="truncate text-sm font-semibold">{m.nome}</p>
                <p className="text-[11px] capitalize text-muted-foreground">{m.tipo}</p>
              </div>
              <span className="shrink-0 text-xs font-bold text-primary">+{m.pontos} pts</span>
            </div>
          ))}
        </TabsContent>
      </Tabs>
    </div>
  );
}

function Voltar() {
  return (
    <Link
      to="/app/comunidade"
      className="inline-flex items-center gap-1 text-xs font-semibold text-muted-foreground"
    >
      <ArrowLeft className="size-4" /> Voltar para a comunidade
    </Link>
  );
}

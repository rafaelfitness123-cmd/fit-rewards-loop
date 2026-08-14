import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useCallback, useEffect, useState } from "react";
import { CalendarDays, Flame, LogOut, MapPin, Plus, Star, Timer, Trophy } from "lucide-react";
import { toast } from "sonner";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { getCompartilharLocal, setCompartilharLocal } from "@/lib/presenca";
import {
  getVisibilidadeLocal,
  setVisibilidadeLocal,
  type VisibilidadeLocal,
} from "@/lib/seguidores";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import FotoPublicacao from "@/components/FotoPublicacao";
import PublicacaoCard from "@/components/PublicacaoCard";
import { listarDoAluno, PAGINA, type Publicacao } from "@/lib/comunidade";

import { getClientes, getMissoes, getResgates, getSessao } from "@/lib/db";
import { logout, useClienteAtual, useStore } from "@/lib/session";
import {
  duracaoMinutos,
  fmtDataHora,
  formatarDuracao,
  historicoDe,
  maiorSequencia,
  posicaoNoRanking,
  progressoDaMissao,
  saldoDe,
  sequenciaAtual,
  tempoTotalMinutos,
  treinosDe,
} from "@/lib/gamificacao";

export const Route = createFileRoute("/app/perfil")({
  head: () => ({
    meta: [
      { title: "Perfil — PulseFit" },
      {
        name: "description",
        content: "Seu perfil: estatísticas, histórico de treinos, pontos e resgates.",
      },
      { property: "og:title", content: "Perfil — PulseFit" },
      {
        property: "og:description",
        content: "Estatísticas completas de treinos, sequência e conquistas.",
      },
    ],
  }),
  component: Perfil,
});

function Perfil() {
  const navigate = useNavigate();
  const cliente = useClienteAtual();
  const [dados] = useStore(() => {
    const s = getSessao();
    const id = s?.tipo === "cliente" ? s.clienteId : undefined;
    if (!id) return null;
    return {
      pontos: saldoDe(id),
      posicao: posicaoNoRanking(
        id,
        getClientes().map((c) => c.id),
      ),
      treinos: treinosDe(id),
      streak: sequenciaAtual(id),
      recorde: maiorSequencia(id),
      minutos: tempoTotalMinutos(id),
      historico: historicoDe(id),
      missoes: getMissoes().map((m) => ({ m, p: progressoDaMissao(id, m) })),
      resgates: getResgates().filter((r) => r.clienteId === id),
    };
  });

  if (!cliente || !dados) return null;

  const stats = [
    { icon: Star, label: "Pontos", valor: String(dados.pontos) },
    { icon: Trophy, label: "Ranking", valor: `#${dados.posicao}` },
    { icon: CalendarDays, label: "Treinos", valor: String(dados.treinos.length) },
    { icon: Flame, label: "Sequência", valor: `${dados.streak} dias` },
    { icon: Flame, label: "Recorde", valor: `${dados.recorde} dias` },
    { icon: Timer, label: "Tempo total", valor: formatarDuracao(dados.minutos) },
  ];

  return (
    <div className="space-y-4">
      <section className="hero-surface p-5 text-center">
        <div className="mx-auto flex size-20 items-center justify-center rounded-3xl bg-primary text-2xl font-black text-primary-foreground">
          {cliente.avatar ? (
            <img
              src={cliente.avatar}
              alt={`Avatar de ${cliente.nome}`}
              className="size-20 rounded-3xl object-cover"
            />
          ) : (
            cliente.nome
              .split(" ")
              .slice(0, 2)
              .map((n) => n[0])
              .join("")
              .toUpperCase()
          )}
        </div>
        <h1 className="mt-3 text-xl font-black">{cliente.nome}</h1>
        <p className="text-xs text-muted-foreground">CPF {cliente.cpf}</p>
      </section>

      <section className="grid grid-cols-3 gap-2">
        {stats.map((s) => (
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
          <TabsTrigger value="treinos" className="flex-1 text-xs">
            Treinos
          </TabsTrigger>
          <TabsTrigger value="pontos" className="flex-1 text-xs">
            Pontos
          </TabsTrigger>
          <TabsTrigger value="missoes" className="flex-1 text-xs">
            Missões
          </TabsTrigger>
          <TabsTrigger value="resgates" className="flex-1 text-xs">
            Resgates
          </TabsTrigger>
        </TabsList>

        <TabsContent value="publicacoes" className="space-y-3 pt-4">
          <Button asChild variant="secondary" className="w-full font-bold">
            <Link to="/app/comunidade/novo">
              <Plus className="mr-2 size-4" /> Criar publicação
            </Link>
          </Button>
          <MinhasPublicacoes meuId={cliente.id} nome={cliente.nome} />
        </TabsContent>


        <TabsContent value="treinos" className="space-y-2 pt-4">
          {dados.treinos.length === 0 && (
            <p className="surface p-4 text-sm text-muted-foreground">Sem treinos.</p>
          )}
          {dados.treinos.map((t) => (
            <div key={t.id} className="surface flex items-center justify-between p-3">
              <div>
                <p className="text-sm font-semibold">{fmtDataHora(t.entrada)}</p>
                <p className="text-[11px] text-muted-foreground">
                  {t.saida
                    ? `Saída ${fmtDataHora(t.saida)} · ${formatarDuracao(duracaoMinutos(t))}`
                    : "Em andamento"}
                </p>
              </div>
              <span className="text-sm font-black text-primary">
                +{t.pontosEntrada + t.pontosSaida}
              </span>
            </div>
          ))}
        </TabsContent>

        <TabsContent value="pontos" className="space-y-2 pt-4">
          {dados.historico.length === 0 && (
            <p className="surface p-4 text-sm text-muted-foreground">Sem registros.</p>
          )}
          {dados.historico.map((h) => (
            <div key={h.id} className="surface flex items-center justify-between p-3">
              <div>
                <p className="text-sm font-semibold">{h.motivo}</p>
                <p className="text-[11px] text-muted-foreground">{fmtDataHora(h.data)}</p>
              </div>
              <span
                className={`text-sm font-black ${h.delta >= 0 ? "text-primary" : "text-destructive"}`}
              >
                {h.delta >= 0 ? "+" : ""}
                {h.delta}
              </span>
            </div>
          ))}
        </TabsContent>

        <TabsContent value="missoes" className="space-y-2 pt-4">
          {dados.missoes.length === 0 && (
            <p className="surface p-4 text-sm text-muted-foreground">Sem missões.</p>
          )}
          {dados.missoes.map(({ m, p }) => (
            <div key={m.id} className="surface flex items-center justify-between p-3">
              <div>
                <p className="text-sm font-semibold">{m.nome}</p>
                <p className="text-[11px] text-muted-foreground">
                  {p.progresso}/{m.quantidade} · {m.tipo}
                </p>
              </div>
              <span className="text-xs font-bold text-primary">
                {p.concedida ? "Concluída" : `+${m.pontos} pts`}
              </span>
            </div>
          ))}
        </TabsContent>

        <TabsContent value="resgates" className="space-y-2 pt-4">
          {dados.resgates.length === 0 && (
            <p className="surface p-4 text-sm text-muted-foreground">Sem resgates.</p>
          )}
          {dados.resgates.map((r) => (
            <div key={r.id} className="surface flex items-center justify-between p-3">
              <div>
                <p className="text-sm font-semibold">{r.recompensaNome}</p>
                <p className="text-[11px] text-muted-foreground">
                  {fmtDataHora(r.data)} · {r.pontos} pts
                </p>
              </div>
              <span className="rounded-full bg-accent px-2.5 py-1 text-[11px] font-semibold capitalize">
                {r.status}
              </span>
            </div>
          ))}
        </TabsContent>
      </Tabs>

      <PrivacidadeLocalizacao clienteId={cliente.id} />

      <Button
        variant="secondary"
        className="w-full"
        onClick={() => {
          logout();
          navigate({ to: "/" });
        }}
      >
        <LogOut className="mr-2 size-4" /> Sair da conta
      </Button>
    </div>
  );
}

/** Preferência de privacidade: compartilhar localização em missões coletivas. */
function PrivacidadeLocalizacao({ clienteId }: { clienteId: string }) {
  const [ligado, setLigado] = useState<boolean | null>(null);
  const [salvando, setSalvando] = useState(false);

  useEffect(() => {
    let vivo = true;
    void getCompartilharLocal(clienteId).then((v) => {
      if (vivo) setLigado(v);
    });
    return () => {
      vivo = false;
    };
  }, [clienteId]);

  const alternar = async (valor: boolean) => {
    setSalvando(true);
    const anterior = ligado;
    setLigado(valor);
    try {
      await setCompartilharLocal(clienteId, valor);
      toast.success(
        valor
          ? "Localização compartilhada durante missões coletivas."
          : "Compartilhamento de localização desligado.",
      );
    } catch {
      setLigado(anterior);
      toast.error("Não foi possível salvar a preferência.");
    } finally {
      setSalvando(false);
    }
  };

  return (
    <section className="surface space-y-3 p-4">
      <p className="flex items-center gap-2 text-sm font-bold">
        <MapPin className="size-4 text-primary" /> Privacidade da localização
      </p>
      <div className="flex items-start justify-between gap-4">
        <p className="text-xs text-muted-foreground">
          Ao ativar, durante uma missão coletiva os alunos participantes que estiverem a
          até {RAIO_PROXIMIDADE_M} m de você veem seu ícone no mapa (atualiza a cada 7
          segundos). Fora da missão nada é compartilhado.
        </p>
        <Switch
          checked={ligado === true}
          disabled={ligado === null || salvando}
          onCheckedChange={(v) => void alternar(v)}
          aria-label="Compartilhar minha localização em missões coletivas"
        />
      </div>
    </section>
  );
}

/** Publicações do próprio aluno — grade de fotos + posts de texto. */
function MinhasPublicacoes({ meuId, nome }: { meuId: string; nome: string }) {
  const [posts, setPosts] = useState<Publicacao[]>([]);
  const [pagina, setPagina] = useState(0);
  const [temMais, setTemMais] = useState(true);
  const [carregando, setCarregando] = useState(false);
  const autores = new Map([[meuId, { id: meuId, nome }]]);

  const carregar = useCallback(
    async (p: number) => {
      setCarregando(true);
      try {
        const lote = await listarDoAluno(meuId, p, meuId);
        setPosts((atuais) => (p === 0 ? lote : [...atuais, ...lote]));
        setTemMais(lote.length === PAGINA);
        setPagina(p);
      } finally {
        setCarregando(false);
      }
    },
    [meuId],
  );

  useEffect(() => {
    void carregar(0);
  }, [carregar]);

  const comFoto = posts.filter((p) => p.imagemPath);

  return (
    <div className="space-y-3">
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
                alt="Minha publicação"
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
            autor={{ id: meuId, nome }}
            autores={autores}
            meuId={meuId}
            souAdmin={false}
            onRemovido={(id) => setPosts((l) => l.filter((x) => x.id !== id))}
          />
        ))}

      {posts.length === 0 && !carregando && (
        <p className="surface p-4 text-sm text-muted-foreground">
          Você ainda não publicou nada na comunidade.
        </p>
      )}

      {carregando && <p className="text-center text-xs text-muted-foreground">Carregando…</p>}

      {temMais && posts.length > 0 && !carregando && (
        <Button variant="secondary" className="w-full" onClick={() => void carregar(pagina + 1)}>
          Carregar mais
        </Button>
      )}
    </div>
  );
}

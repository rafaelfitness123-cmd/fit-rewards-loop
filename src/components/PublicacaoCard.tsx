import { useEffect, useState } from "react";
import { Link } from "@tanstack/react-router";
import { Flag, Heart, MessageCircle, MoreVertical, Share2, Trash2 } from "lucide-react";
import { toast } from "sonner";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import CardMissao from "@/components/CardMissao";
import FotoPublicacao from "@/components/FotoPublicacao";
import {
  alternarCurtida,
  comentar,
  denunciar,
  excluirComentario,
  excluirPublicacao,
  listarComentarios,
  tempoRelativo,
  type Comentario,
  type Publicacao,
} from "@/lib/comunidade";

export type AutorInfo = { id: string; nome: string; avatar?: string | undefined };

const iniciais = (nome: string) =>
  nome
    .split(" ")
    .slice(0, 2)
    .map((n) => n[0])
    .join("")
    .toUpperCase();

function Avatar({
  autor,
  nome,
  size = 10,
}: {
  autor?: AutorInfo | null;
  nome: string;
  size?: 9 | 10;
}) {
  return (
    <span
      className={`flex ${size === 9 ? "size-9" : "size-10"} shrink-0 items-center justify-center overflow-hidden rounded-2xl bg-primary text-xs font-black text-primary-foreground`}
    >
      {autor?.avatar ? (
        <img src={autor.avatar} alt={`Avatar de ${nome}`} className="size-full object-cover" />
      ) : (
        iniciais(nome)
      )}
    </span>
  );
}

/** Botão vertical do estilo "rail" lateral (TikTok). */
function AcaoRail({
  label,
  valor,
  ativo,
  sobreFoto,
  onClick,
  children,
}: {
  label: string;
  valor?: string;
  ativo?: boolean;
  sobreFoto: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      aria-label={label}
      onClick={onClick}
      className="flex flex-col items-center gap-1 transition-transform active:scale-90"
    >
      <span
        className={`flex size-11 items-center justify-center rounded-full backdrop-blur-sm transition-colors ${
          sobreFoto ? "bg-background/55 shadow-lg" : "bg-muted/50"
        } ${ativo ? "text-primary" : "text-foreground"}`}
      >
        {children}
      </span>
      {valor !== undefined && (
        <span
          className={`text-[11px] font-bold tabular-nums ${
            sobreFoto ? "text-foreground drop-shadow" : "text-muted-foreground"
          }`}
        >
          {valor}
        </span>
      )}
    </button>
  );
}

export default function PublicacaoCard({
  post,
  autor,
  meuId,
  souAdmin,
  autores,
  onRemovido,
  comentariosAbertos = false,
}: {
  post: Publicacao;
  autor: AutorInfo | null;
  meuId: string;
  souAdmin: boolean;
  autores: Map<string, AutorInfo>;
  onRemovido: (id: string) => void;
  comentariosAbertos?: boolean;
}) {
  const [curtiu, setCurtiu] = useState(post.curtiuEu);
  const [total, setTotal] = useState(post.curtidas);
  const [abrirComentarios, setAbrirComentarios] = useState(comentariosAbertos);
  const [comentarios, setComentarios] = useState<Comentario[] | null>(null);
  const [qtdComentarios, setQtdComentarios] = useState(post.comentarios);
  const [texto, setTexto] = useState("");
  const [confirmar, setConfirmar] = useState(false);
  const [enviando, setEnviando] = useState(false);

  useEffect(() => {
    setCurtiu(post.curtiuEu);
    setTotal(post.curtidas);
    setQtdComentarios(post.comentarios);
  }, [post.curtiuEu, post.curtidas, post.comentarios]);

  useEffect(() => {
    if (!abrirComentarios || comentarios) return;
    void listarComentarios(post.id)
      .then((l) => {
        setComentarios(l);
        setQtdComentarios(l.length);
      })
      .catch(() => setComentarios([]));
  }, [abrirComentarios, comentarios, post.id]);

  const curtir = async () => {
    const antes = curtiu;
    setCurtiu(!antes);
    setTotal((t) => t + (antes ? -1 : 1));
    try {
      await alternarCurtida(post.id, meuId, antes);
    } catch {
      setCurtiu(antes);
      setTotal((t) => t + (antes ? 1 : -1));
      toast.error("Não foi possível registrar sua curtida.");
    }
  };

  const compartilhar = () => {
    const url = `${window.location.origin}/app/comunidade/${post.id}`;
    if (navigator.share) {
      void navigator.share({ title: "PulseFit", text: post.legenda, url });
    } else {
      void navigator.clipboard.writeText(url);
      toast.success("Link copiado.");
    }
  };

  const nome = autor?.nome ?? "Aluno";
  const podeExcluir = post.autorId === meuId || souAdmin;
  const temFoto = Boolean(post.imagemPath);

  const rail = (
    <div
      className={
        temFoto
          ? "absolute bottom-3 right-2 z-10 flex flex-col items-center gap-3"
          : "flex flex-col items-center gap-3 pt-1"
      }
    >
      <AcaoRail
        label="Curtir"
        valor={String(total)}
        ativo={curtiu}
        sobreFoto={temFoto}
        onClick={() => void curtir()}
      >
        <Heart className={`size-5 ${curtiu ? "fill-current text-primary" : ""}`} />
      </AcaoRail>
      <AcaoRail
        label="Comentários"
        valor={String(qtdComentarios)}
        sobreFoto={temFoto}
        onClick={() => setAbrirComentarios(true)}
      >
        <MessageCircle className="size-5" />
      </AcaoRail>
      <AcaoRail label="Compartilhar" sobreFoto={temFoto} onClick={compartilhar}>
        <Share2 className="size-5" />
      </AcaoRail>
    </div>
  );

  return (
    <article className="surface overflow-hidden">
      <header className="flex items-center gap-3 p-3">
        <Link
          to="/app/aluno/$id"
          params={{ id: post.autorId }}
          className="flex min-w-0 flex-1 items-center gap-3"
        >
          <Avatar autor={autor} nome={nome} />
          <span className="min-w-0">
            <span className="block truncate text-sm font-bold">{nome}</span>
            <span className="block text-[11px] text-muted-foreground">
              {tempoRelativo(post.criadoEm)}
            </span>
          </span>
        </Link>

        <BotaoSeguir meuId={meuId} alunoId={post.autorId} compacto />

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button
              type="button"
              aria-label="Opções da publicação"
              className="rounded-full p-2 text-muted-foreground transition-colors hover:text-foreground"
            >
              <MoreVertical className="size-4" />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={compartilhar}>
              <Share2 className="mr-2 size-4" /> Compartilhar
            </DropdownMenuItem>
            {post.autorId !== meuId && (
              <DropdownMenuItem
                onClick={() => {
                  void denunciar(post.id, meuId, "denuncia do feed")
                    .then(() => toast.success("Denúncia enviada para a equipe."))
                    .catch(() => toast.error("Não foi possível denunciar agora."));
                }}
              >
                <Flag className="mr-2 size-4" /> Denunciar publicação
              </DropdownMenuItem>
            )}
            {podeExcluir && (
              <DropdownMenuItem className="text-destructive" onClick={() => setConfirmar(true)}>
                <Trash2 className="mr-2 size-4" /> Excluir publicação
              </DropdownMenuItem>
            )}
          </DropdownMenuContent>
        </DropdownMenu>
      </header>

      {temFoto ? (
        <div className="relative">
          <FotoPublicacao
            path={post.imagemPath as string}
            alt={`Publicação de ${nome}`}
            className="aspect-square w-full object-cover"
          />
          <div className="pointer-events-none absolute inset-x-0 bottom-0 h-32 bg-gradient-to-t from-background/70 to-transparent" />
          {rail}
        </div>
      ) : null}

      <div className={`p-3 ${temFoto ? "space-y-3" : "flex gap-3"}`}>
        <div className="min-w-0 flex-1 space-y-3">
          {post.tipo === "missao" && post.missao && <CardMissao missao={post.missao} />}
          {post.legenda && (
            <p className="whitespace-pre-wrap text-sm leading-relaxed">{post.legenda}</p>
          )}
          {temFoto && (
            <p className="text-xs font-semibold text-muted-foreground">
              {total} {total === 1 ? "curtida" : "curtidas"}
              {qtdComentarios > 0 && ` · ${qtdComentarios} comentário${qtdComentarios === 1 ? "" : "s"}`}
            </p>
          )}
        </div>
        {!temFoto && rail}
      </div>

      <Sheet open={abrirComentarios} onOpenChange={setAbrirComentarios}>
        <SheetContent side="bottom" className="flex h-[80vh] flex-col gap-0 p-0">
          <SheetHeader className="border-b border-border px-4 py-3">
            <SheetTitle className="text-base">
              {qtdComentarios} {qtdComentarios === 1 ? "comentário" : "comentários"}
            </SheetTitle>
          </SheetHeader>

          <div className="flex-1 space-y-3 overflow-y-auto px-4 py-3">
            {comentarios === null && (
              <p className="text-xs text-muted-foreground">Carregando comentários…</p>
            )}
            {comentarios?.length === 0 && (
              <p className="py-8 text-center text-sm text-muted-foreground">
                Nenhum comentário ainda. Seja o primeiro!
              </p>
            )}
            {comentarios?.map((c) => {
              const a = autores.get(c.autorId) ?? null;
              const n = a?.nome ?? "Aluno";
              return (
                <div key={c.id} className="flex items-start gap-3">
                  <Link to="/app/aluno/$id" params={{ id: c.autorId }}>
                    <Avatar autor={a} nome={n} size={9} />
                  </Link>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <Link
                        to="/app/aluno/$id"
                        params={{ id: c.autorId }}
                        className="truncate text-xs font-bold"
                      >
                        {n}
                      </Link>
                      <span className="text-[10px] text-muted-foreground">
                        {tempoRelativo(c.criadoEm)}
                      </span>
                    </div>
                    <p className="whitespace-pre-wrap break-words text-sm">{c.texto}</p>
                  </div>
                  {(c.autorId === meuId || souAdmin) && (
                    <button
                      type="button"
                      aria-label="Excluir comentário"
                      className="p-1 text-muted-foreground hover:text-destructive"
                      onClick={() => {
                        void excluirComentario(c.id).then(() => {
                          setComentarios((lista) => (lista ?? []).filter((x) => x.id !== c.id));
                          setQtdComentarios((q) => Math.max(0, q - 1));
                        });
                      }}
                    >
                      <Trash2 className="size-3.5" />
                    </button>
                  )}
                </div>
              );
            })}
          </div>

          <form
            className="flex gap-2 border-t border-border p-3"
            onSubmit={(e) => {
              e.preventDefault();
              const t = texto.trim();
              if (!t || enviando) return;
              setEnviando(true);
              void comentar(post.id, meuId, t)
                .then(() => listarComentarios(post.id))
                .then((lista) => {
                  setComentarios(lista);
                  setQtdComentarios(lista.length);
                  setTexto("");
                })
                .catch(() => toast.error("Não foi possível comentar."))
                .finally(() => setEnviando(false));
            }}
          >
            <Input
              value={texto}
              onChange={(e) => setTexto(e.target.value)}
              placeholder="Escreva um comentário…"
              maxLength={500}
              className="h-10 text-sm"
            />
            <Button type="submit" disabled={enviando || !texto.trim()}>
              Enviar
            </Button>
          </form>
        </SheetContent>
      </Sheet>

      <AlertDialog open={confirmar} onOpenChange={setConfirmar}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir publicação?</AlertDialogTitle>
            <AlertDialogDescription>
              Essa ação não pode ser desfeita. A publicação e a foto serão removidas.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                void excluirPublicacao(post.id, post.imagemPath)
                  .then(() => {
                    onRemovido(post.id);
                    toast.success("Publicação excluída.");
                  })
                  .catch(() => toast.error("Não foi possível excluir."));
              }}
            >
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </article>
  );
}

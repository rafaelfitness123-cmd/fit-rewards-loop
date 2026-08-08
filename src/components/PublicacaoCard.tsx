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
  const [texto, setTexto] = useState("");
  const [confirmar, setConfirmar] = useState(false);
  const [enviando, setEnviando] = useState(false);

  useEffect(() => {
    setCurtiu(post.curtiuEu);
    setTotal(post.curtidas);
  }, [post.curtiuEu, post.curtidas]);

  useEffect(() => {
    if (!abrirComentarios || comentarios) return;
    void listarComentarios(post.id)
      .then(setComentarios)
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

  const nome = autor?.nome ?? "Aluno";
  const podeExcluir = post.autorId === meuId || souAdmin;

  return (
    <article className="surface overflow-hidden">
      <header className="flex items-center gap-3 p-3">
        <Link
          to="/app/aluno/$id"
          params={{ id: post.autorId }}
          className="flex min-w-0 flex-1 items-center gap-3"
        >
          <span className="flex size-10 shrink-0 items-center justify-center overflow-hidden rounded-2xl bg-primary text-sm font-black text-primary-foreground">
            {autor?.avatar ? (
              <img src={autor.avatar} alt={`Avatar de ${nome}`} className="size-10 object-cover" />
            ) : (
              iniciais(nome)
            )}
          </span>
          <span className="min-w-0">
            <span className="block truncate text-sm font-bold">{nome}</span>
            <span className="block text-[11px] text-muted-foreground">
              {tempoRelativo(post.criadoEm)}
            </span>
          </span>
        </Link>

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
            <DropdownMenuItem
              onClick={() => {
                const url = `${window.location.origin}/app/comunidade/${post.id}`;
                if (navigator.share) {
                  void navigator.share({ title: "PulseFit", text: post.legenda, url });
                } else {
                  void navigator.clipboard.writeText(url);
                  toast.success("Link copiado.");
                }
              }}
            >
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

      {post.imagemPath && (
        <FotoPublicacao
          path={post.imagemPath}
          alt={`Publicação de ${nome}`}
          className="aspect-square w-full object-cover"
        />
      )}

      <div className="space-y-3 p-3">
        {post.tipo === "missao" && post.missao && <CardMissao missao={post.missao} />}

        {post.legenda && (
          <p className="whitespace-pre-wrap text-sm leading-relaxed">{post.legenda}</p>
        )}

        <div className="flex items-center gap-1 text-xs font-semibold text-muted-foreground">
          <Heart className={`size-3.5 ${total > 0 ? "fill-primary text-primary" : ""}`} />
          {total} {total === 1 ? "curtida" : "curtidas"}
        </div>

        <div className="grid grid-cols-2 gap-2 border-t border-border pt-2">
          <button
            type="button"
            onClick={() => void curtir()}
            aria-pressed={curtiu}
            className={`flex items-center justify-center gap-2 rounded-xl py-2 text-sm font-bold transition-colors ${
              curtiu ? "bg-primary/15 text-primary" : "text-muted-foreground hover:text-foreground"
            }`}
          >
            <Heart className={`size-4 ${curtiu ? "fill-current" : ""}`} />
            Curtir
          </button>
          <button
            type="button"
            onClick={() => setAbrirComentarios((v) => !v)}
            className="flex items-center justify-center gap-2 rounded-xl py-2 text-sm font-bold text-muted-foreground transition-colors hover:text-foreground"
          >
            <MessageCircle className="size-4" />
            Comentários {post.comentarios > 0 ? `(${post.comentarios})` : ""}
          </button>
        </div>

        {abrirComentarios && (
          <div className="space-y-2 border-t border-border pt-3">
            {comentarios === null && (
              <p className="text-xs text-muted-foreground">Carregando comentários…</p>
            )}
            {comentarios?.length === 0 && (
              <p className="text-xs text-muted-foreground">Nenhum comentário ainda.</p>
            )}
            {comentarios?.map((c) => {
              const a = autores.get(c.autorId);
              return (
                <div key={c.id} className="flex items-start gap-2">
                  <div className="min-w-0 flex-1 rounded-xl bg-muted/40 px-3 py-2">
                    <p className="text-xs font-bold">{a?.nome ?? "Aluno"}</p>
                    <p className="whitespace-pre-wrap break-words text-sm">{c.texto}</p>
                    <p className="mt-0.5 text-[10px] text-muted-foreground">
                      {tempoRelativo(c.criadoEm)}
                    </p>
                  </div>
                  {(c.autorId === meuId || souAdmin) && (
                    <button
                      type="button"
                      aria-label="Excluir comentário"
                      className="p-1 text-muted-foreground hover:text-destructive"
                      onClick={() => {
                        void excluirComentario(c.id).then(() =>
                          setComentarios((lista) => (lista ?? []).filter((x) => x.id !== c.id)),
                        );
                      }}
                    >
                      <Trash2 className="size-3.5" />
                    </button>
                  )}
                </div>
              );
            })}

            <form
              className="flex gap-2 pt-1"
              onSubmit={(e) => {
                e.preventDefault();
                const t = texto.trim();
                if (!t || enviando) return;
                setEnviando(true);
                void comentar(post.id, meuId, t)
                  .then(() => listarComentarios(post.id))
                  .then((lista) => {
                    setComentarios(lista);
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
                className="h-9 text-sm"
              />
              <Button type="submit" size="sm" disabled={enviando || !texto.trim()}>
                Enviar
              </Button>
            </form>
          </div>
        )}
      </div>

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

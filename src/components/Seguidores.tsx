import { useEffect, useState } from "react";
import { Link } from "@tanstack/react-router";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import BotaoSeguir from "@/components/BotaoSeguir";
import { getClientes } from "@/lib/db";
import { useStore } from "@/lib/session";
import { listarSeguidores, listarSeguindo } from "@/lib/seguidores";

type Aluno = { id: string; nome: string; avatar?: string | undefined };

const iniciais = (nome: string) =>
  nome
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((n) => n[0])
    .join("")
    .toUpperCase() || "?";

/** Contadores de seguidores/seguindo + listas em diálogo, estilo rede social. */
export default function Seguidores({
  alunoId,
  meuId,
  publicacoes,
}: {
  alunoId: string;
  meuId: string;
  publicacoes?: number;
}) {
  const [seguidores, setSeguidores] = useState<string[]>([]);
  const [seguindo, setSeguindo] = useState<string[]>([]);
  const [aberto, setAberto] = useState<null | "seguidores" | "seguindo">(null);
  const [mapa] = useStore(
    () =>
      new Map<string, Aluno>(
        getClientes().map((c) => [
          c.id,
          { id: c.id, nome: c.nome, avatar: c.avatar as string | undefined },
        ]),
      ),
  );

  useEffect(() => {
    let vivo = true;
    void listarSeguidores(alunoId).then((v) => vivo && setSeguidores(v));
    void listarSeguindo(alunoId).then((v) => vivo && setSeguindo(v));
    return () => {
      vivo = false;
    };
  }, [alunoId]);

  const lista = (aberto === "seguidores" ? seguidores : seguindo)
    .map((id) => mapa.get(id))
    .filter(Boolean) as Aluno[];

  return (
    <>
      <div className="grid grid-cols-3 divide-x divide-border">
        <div className="px-2 text-center">
          <p className="text-base font-black">{publicacoes ?? 0}</p>
          <p className="text-[11px] text-muted-foreground">publicações</p>
        </div>
        <button
          type="button"
          onClick={() => setAberto("seguidores")}
          className="px-2 text-center transition-opacity active:opacity-60"
        >
          <p className="text-base font-black">{seguidores.length}</p>
          <p className="text-[11px] text-muted-foreground">seguidores</p>
        </button>
        <button
          type="button"
          onClick={() => setAberto("seguindo")}
          className="px-2 text-center transition-opacity active:opacity-60"
        >
          <p className="text-base font-black">{seguindo.length}</p>
          <p className="text-[11px] text-muted-foreground">seguindo</p>
        </button>
      </div>

      <Dialog open={aberto !== null} onOpenChange={(v) => !v && setAberto(null)}>
        <DialogContent className="max-h-[80vh] overflow-hidden p-0">
          <DialogHeader className="border-b border-border p-4">
            <DialogTitle className="text-base">
              {aberto === "seguidores" ? "Seguidores" : "Seguindo"}
            </DialogTitle>
          </DialogHeader>
          <div className="max-h-[60vh] space-y-2 overflow-y-auto p-4">
            {lista.length === 0 && (
              <p className="py-6 text-center text-sm text-muted-foreground">
                {aberto === "seguidores" ? "Ninguém segue ainda." : "Ainda não segue ninguém."}
              </p>
            )}
            {lista.map((a) => (
              <div key={a.id} className="flex items-center gap-3 rounded-xl bg-muted/40 p-2.5">
                <Link
                  to="/app/aluno/$id"
                  params={{ id: a.id }}
                  onClick={() => setAberto(null)}
                  className="flex min-w-0 flex-1 items-center gap-3"
                >
                  <span className="flex size-10 shrink-0 items-center justify-center overflow-hidden rounded-2xl bg-primary text-xs font-black text-primary-foreground">
                    {a.avatar ? (
                      <img
                        src={a.avatar}
                        alt={`Avatar de ${a.nome}`}
                        className="size-full object-cover"
                      />
                    ) : (
                      iniciais(a.nome)
                    )}
                  </span>
                  <span className="truncate text-sm font-semibold">{a.nome}</span>
                </Link>
                <BotaoSeguir meuId={meuId} alunoId={a.id} compacto />
              </div>
            ))}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}

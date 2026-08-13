import { useMemo, useState } from "react";
import { Link } from "@tanstack/react-router";
import { Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import BotaoSeguir from "@/components/BotaoSeguir";

export type AlunoBusca = { id: string; nome: string; avatar?: string | undefined };

const iniciais = (nome: string) =>
  nome
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((n) => n[0])
    .join("")
    .toUpperCase() || "?";

/** Pesquisa de alunos da Companhia Fitness com opção de seguir. */
export default function BuscaAlunos({
  alunos,
  meuId,
}: {
  alunos: AlunoBusca[];
  meuId: string;
}) {
  const [aberto, setAberto] = useState(false);
  const [termo, setTermo] = useState("");

  const resultados = useMemo(() => {
    const t = termo.trim().toLowerCase();
    const base = alunos.filter((a) => a.id !== meuId);
    const lista = t ? base.filter((a) => a.nome.toLowerCase().includes(t)) : base;
    return lista.slice(0, 30);
  }, [alunos, termo, meuId]);

  return (
    <Dialog open={aberto} onOpenChange={setAberto}>
      <DialogTrigger asChild>
        <Button variant="secondary" className="w-full font-bold">
          <Search className="mr-2 size-4" /> Pesquisar alunos
        </Button>
      </DialogTrigger>
      <DialogContent className="max-h-[80vh] overflow-hidden p-0">
        <DialogHeader className="border-b border-border p-4">
          <DialogTitle className="text-base">Pesquisar alunos</DialogTitle>
        </DialogHeader>
        <div className="space-y-3 p-4">
          <Input
            autoFocus
            value={termo}
            onChange={(e) => setTermo(e.target.value)}
            placeholder="Digite o nome do aluno…"
          />
          <div className="max-h-[50vh] space-y-2 overflow-y-auto">
            {resultados.length === 0 && (
              <p className="py-6 text-center text-sm text-muted-foreground">
                Nenhum aluno encontrado.
              </p>
            )}
            {resultados.map((a) => (
              <div key={a.id} className="flex items-center gap-3 rounded-xl bg-muted/40 p-2.5">
                <Link
                  to="/app/aluno/$id"
                  params={{ id: a.id }}
                  onClick={() => setAberto(false)}
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
        </div>
      </DialogContent>
    </Dialog>
  );
}

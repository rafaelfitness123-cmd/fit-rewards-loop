import { createFileRoute } from "@tanstack/react-router";
import { toast } from "sonner";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { getResgates, setResgates, type ResgateStatus } from "@/lib/db";
import { useStore } from "@/lib/session";
import { addPontos, fmtDataHora } from "@/lib/gamificacao";

export const Route = createFileRoute("/admin/resgates")({
  head: () => ({
    meta: [
      { title: "Resgates — Painel PulseFit" },
      {
        name: "description",
        content: "Acompanhe e altere o status dos resgates de recompensas dos alunos.",
      },
      { property: "og:title", content: "Resgates — Painel PulseFit" },
      {
        property: "og:description",
        content: "Aprovação, entrega e cancelamento de resgates com devolução de pontos.",
      },
    ],
  }),
  component: ResgatesAdmin,
});

const status: ResgateStatus[] = ["solicitado", "aprovado", "entregue", "cancelado"];

function ResgatesAdmin() {
  const [lista, refresh] = useStore(() => getResgates());

  const alterar = (id: string, novo: ResgateStatus) => {
    const resgates = getResgates();
    const alvo = resgates.find((r) => r.id === id);
    if (!alvo || alvo.status === novo) return;
    if (novo === "cancelado" && alvo.status !== "cancelado") {
      addPontos(alvo.clienteId, alvo.pontos, `Estorno de resgate: ${alvo.recompensaNome}`);
      toast.success(`Resgate cancelado. ${alvo.pontos} pontos devolvidos.`);
    } else if (alvo.status === "cancelado" && novo !== "cancelado") {
      addPontos(alvo.clienteId, -alvo.pontos, `Resgate reaberto: ${alvo.recompensaNome}`);
      toast.success("Resgate reaberto e pontos debitados novamente.");
    } else {
      toast.success(`Status atualizado para ${novo}.`);
    }
    setResgates(resgates.map((r) => (r.id === id ? { ...r, status: novo } : r)));
    refresh();
  };

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-2xl font-black">Resgates</h1>
        <p className="text-sm text-muted-foreground">
          Cancelar um resgate devolve os pontos ao aluno.
        </p>
      </header>

      <section className="space-y-2">
        {lista.length === 0 && (
          <p className="surface p-4 text-sm text-muted-foreground">
            Nenhum resgate solicitado.
          </p>
        )}
        {lista.map((r) => (
          <div
            key={r.id}
            className="surface flex flex-wrap items-center gap-3 p-4 sm:flex-nowrap"
          >
            <div className="flex-1">
              <p className="font-semibold">{r.clienteNome}</p>
              <p className="text-xs text-muted-foreground">
                {r.recompensaNome} · {r.pontos} pts · {fmtDataHora(r.data)}
              </p>
            </div>
            <Select
              value={r.status}
              onValueChange={(v) => alterar(r.id, v as ResgateStatus)}
            >
              <SelectTrigger className="w-40 capitalize">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {status.map((s) => (
                  <SelectItem key={s} value={s} className="capitalize">
                    {s}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        ))}
      </section>
    </div>
  );
}

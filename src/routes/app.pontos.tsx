import { createFileRoute } from "@tanstack/react-router";
import { Gift, Star } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  getRecompensas,
  getResgates,
  setRecompensas,
  setResgates,
  uid,
  type Recompensa,
  type Resgate,
  getSessao,
} from "@/lib/db";
import { useClienteAtual, useStore } from "@/lib/session";
import { addPontos, fmtDataHora, historicoDe, saldoDe } from "@/lib/gamificacao";

export const Route = createFileRoute("/app/pontos")({
  head: () => ({
    meta: [
      { title: "Pontos e Recompensas — PulseFit" },
      {
        name: "description",
        content: "Veja seu extrato de pontos e troque por recompensas da academia.",
      },
      { property: "og:title", content: "Pontos e Recompensas — PulseFit" },
      {
        property: "og:description",
        content: "Extrato completo de pontos e resgate de brindes.",
      },
    ],
  }),
  component: Pontos,
});

function Pontos() {
  const cliente = useClienteAtual();
  const [dados, refresh] = useStore(() => {
    const s = getSessao();
    const id = s?.tipo === "cliente" ? s.clienteId : undefined;
    if (!id) return null;
    return {
      saldo: saldoDe(id),
      historico: historicoDe(id),
      recompensas: getRecompensas().filter((r) => r.ativa),
      resgates: getResgates().filter((r) => r.clienteId === id),
    };
  });

  if (!cliente || !dados) return null;

  const resgatar = (r: Recompensa) => {
    const saldo = saldoDe(cliente.id);
    if (saldo < r.pontos) {
      toast.error("Pontos insuficientes para este resgate.");
      return;
    }
    if (r.quantidade <= 0) {
      toast.error("Recompensa esgotada.");
      return;
    }
    addPontos(cliente.id, -r.pontos, `Resgate: ${r.nome}`);
    const recompensas = getRecompensas().map((x) =>
      x.id === r.id ? { ...x, quantidade: x.quantidade - 1 } : x,
    );
    setRecompensas(recompensas);
    const resgate: Resgate = {
      id: uid(),
      clienteId: cliente.id,
      clienteNome: cliente.nome,
      recompensaId: r.id,
      recompensaNome: r.nome,
      pontos: r.pontos,
      data: new Date().toISOString(),
      status: "solicitado",
    };
    setResgates([resgate, ...getResgates()]);
    refresh();
    toast.success(`Resgate solicitado! -${r.pontos} pontos`);
  };

  return (
    <div className="space-y-4">
      <header className="hero-surface p-5 text-center">
        <Star className="mx-auto size-6 text-gold" />
        <p className="mt-1 text-4xl font-black">{dados.saldo}</p>
        <p className="text-xs text-muted-foreground">pontos disponíveis</p>
      </header>

      <Tabs defaultValue="extrato">
        <TabsList className="w-full">
          <TabsTrigger value="extrato" className="flex-1">
            Extrato
          </TabsTrigger>
          <TabsTrigger value="resgatar" className="flex-1">
            Resgatar
          </TabsTrigger>
          <TabsTrigger value="meus" className="flex-1">
            Meus resgates
          </TabsTrigger>
        </TabsList>

        <TabsContent value="extrato" className="space-y-2 pt-4">
          {dados.historico.length === 0 ? (
            <p className="surface p-4 text-sm text-muted-foreground">
              Nenhuma movimentação de pontos ainda.
            </p>
          ) : (
            dados.historico.map((h) => (
              <div key={h.id} className="surface flex items-center justify-between p-3">
                <div>
                  <p className="text-sm font-semibold">{h.motivo}</p>
                  <p className="text-[11px] text-muted-foreground">
                    {fmtDataHora(h.data)}
                  </p>
                </div>
                <span
                  className={`text-sm font-black ${h.delta >= 0 ? "text-primary" : "text-destructive"}`}
                >
                  {h.delta >= 0 ? "+" : ""}
                  {h.delta}
                </span>
              </div>
            ))
          )}
        </TabsContent>

        <TabsContent value="resgatar" className="space-y-3 pt-4">
          {dados.recompensas.length === 0 ? (
            <p className="surface p-4 text-sm text-muted-foreground">
              Nenhuma recompensa disponível no momento.
            </p>
          ) : (
            dados.recompensas.map((r) => (
              <article key={r.id} className="surface p-4">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="flex items-center gap-2 font-semibold">
                      <Gift className="size-4 text-primary" /> {r.nome}
                    </p>
                    <p className="mt-1 text-xs text-muted-foreground">{r.descricao}</p>
                    <p className="mt-1 text-[11px] text-muted-foreground">
                      Disponível: {r.quantidade}
                    </p>
                  </div>
                  <span className="shrink-0 rounded-full bg-gold/15 px-2.5 py-1 text-xs font-bold text-gold">
                    {r.pontos} pts
                  </span>
                </div>
                <Button
                  className="mt-3 w-full font-bold"
                  disabled={dados.saldo < r.pontos || r.quantidade <= 0}
                  onClick={() => resgatar(r)}
                >
                  {r.quantidade <= 0
                    ? "Esgotado"
                    : dados.saldo < r.pontos
                      ? `Faltam ${r.pontos - dados.saldo} pontos`
                      : "Resgatar"}
                </Button>
              </article>
            ))
          )}
        </TabsContent>

        <TabsContent value="meus" className="space-y-2 pt-4">
          {dados.resgates.length === 0 ? (
            <p className="surface p-4 text-sm text-muted-foreground">
              Você ainda não resgatou nenhuma recompensa.
            </p>
          ) : (
            dados.resgates.map((r) => (
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
            ))
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}

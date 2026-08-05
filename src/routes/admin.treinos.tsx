import { createFileRoute } from "@tanstack/react-router";
import { getClientes, getTreinos } from "@/lib/db";
import { useStore } from "@/lib/session";
import { diaKey, duracaoMinutos, fmtDataHora, formatarDuracao } from "@/lib/gamificacao";

export const Route = createFileRoute("/admin/treinos")({
  head: () => ({
    meta: [
      { title: "Treinos — Painel PulseFit" },
      {
        name: "description",
        content: "Histórico completo de entradas, saídas e permanência dos alunos.",
      },
      { property: "og:title", content: "Treinos — Painel PulseFit" },
      {
        property: "og:description",
        content: "Registros de check-in e check-out com tempo de permanência.",
      },
    ],
  }),
  component: TreinosAdmin,
});

function TreinosAdmin() {
  const [dados] = useStore(() => {
    const clientes = new Map(getClientes().map((c) => [c.id, c.nome]));
    const treinos = getTreinos()
      .slice()
      .sort((a, b) => b.entrada.localeCompare(a.entrada));
    const hoje = diaKey(new Date());
    return {
      treinos: treinos.map((t) => ({ ...t, nome: clientes.get(t.clienteId) ?? "—" })),
      hoje: treinos.filter((t) => diaKey(new Date(t.entrada)) === hoje).length,
      abertos: treinos.filter((t) => !t.saida).length,
    };
  });

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-2xl font-black">Treinos</h1>
        <p className="text-sm text-muted-foreground">
          {dados.hoje} hoje · {dados.abertos} em andamento
        </p>
      </header>

      <section className="space-y-2">
        {dados.treinos.length === 0 && (
          <p className="surface p-4 text-sm text-muted-foreground">
            Nenhum treino registrado.
          </p>
        )}
        {dados.treinos.map((t) => (
          <div key={t.id} className="surface flex items-center gap-3 p-4">
            <div className="flex-1">
              <p className="font-semibold">{t.nome}</p>
              <p className="text-xs text-muted-foreground">
                Entrada {fmtDataHora(t.entrada)}
                {t.saida ? ` · Saída ${fmtDataHora(t.saida)}` : " · em andamento 🟢"}
              </p>
            </div>
            <div className="text-right">
              <p className="text-sm font-black text-primary">
                +{t.pontosEntrada + t.pontosSaida} pts
              </p>
              <p className="text-[11px] text-muted-foreground">
                {t.saida ? formatarDuracao(duracaoMinutos(t)) : "—"}
              </p>
            </div>
          </div>
        ))}
      </section>
    </div>
  );
}

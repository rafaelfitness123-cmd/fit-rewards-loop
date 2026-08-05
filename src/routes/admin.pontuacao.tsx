import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { DIAS, getConfigDias, setConfigDias, type ConfigDias } from "@/lib/db";
import { useStore } from "@/lib/session";

export const Route = createFileRoute("/admin/pontuacao")({
  head: () => ({
    meta: [
      { title: "Pontuação por dia — Painel PulseFit" },
      {
        name: "description",
        content: "Defina quantos pontos o aluno ganha ao treinar em cada dia da semana.",
      },
      { property: "og:title", content: "Pontuação por dia — Painel PulseFit" },
      {
        property: "og:description",
        content: "Configuração editável dos pontos de check-in por dia da semana.",
      },
    ],
  }),
  component: Pontuacao,
});

function Pontuacao() {
  const [salvo, refresh] = useStore(() => getConfigDias());
  const [form, setForm] = useState<ConfigDias>(salvo);

  const salvar = () => {
    const limpo: ConfigDias = {};
    for (const k of Object.keys(form)) limpo[k] = Math.max(0, Number(form[k]) || 0);
    setConfigDias(limpo);
    refresh();
    toast.success("Pontuação por dia salva.");
  };

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-2xl font-black">Pontuação por dia</h1>
        <p className="text-sm text-muted-foreground">
          O check-in usa automaticamente o valor do dia da semana.
        </p>
      </header>

      <section className="surface grid gap-4 p-5 sm:grid-cols-2 lg:grid-cols-4">
        {DIAS.map((nome, i) => (
          <div key={nome} className="space-y-2">
            <Label>{nome}</Label>
            <Input
              type="number"
              min={0}
              value={form[String(i)] ?? 0}
              onChange={(e) => setForm({ ...form, [String(i)]: Number(e.target.value) })}
            />
          </div>
        ))}
      </section>

      <Button className="font-bold" onClick={salvar}>
        Salvar configurações
      </Button>

      <p className="text-xs text-muted-foreground">
        Valores atuais salvos:{" "}
        {DIAS.map((n, i) => `${n}: ${salvo[String(i)] ?? 0}`).join(" · ")}
      </p>
    </div>
  );
}

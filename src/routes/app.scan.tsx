import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { ScanLine } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { QrScanner } from "@/components/QrScanner";
import { useClienteAtual, useStore } from "@/lib/session";
import {
  duracaoMinutos,
  fmtHora,
  formatarDuracao,
  registrarScan,
  treinoAberto,
  type ScanResultado,
} from "@/lib/gamificacao";

export const Route = createFileRoute("/app/scan")({
  head: () => ({
    meta: [
      { title: "Check-in por QR Code — PulseFit" },
      {
        name: "description",
        content: "Escaneie o QR Code da academia para registrar entrada e saída.",
      },
      { property: "og:title", content: "Check-in por QR Code — PulseFit" },
      {
        property: "og:description",
        content: "Registre entrada e saída do treino e ganhe pontos automaticamente.",
      },
    ],
  }),
  component: Scan,
});

function Scan() {
  const cliente = useClienteAtual();
  const id = cliente?.id;
  const [aberto, atualizar] = useStore(() => (id ? treinoAberto(id) : null));
  const [codigo, setCodigo] = useState("");
  const [resultado, setResultado] = useState<ScanResultado | null>(null);

  if (!cliente) return null;

  const processar = (texto: string) => {
    const r = registrarScan(cliente.id, texto);
    setResultado(r);
    if (r.ok) toast.success(r.mensagem);
    else toast.error(r.mensagem);
    atualizar();
    setCodigo("");
  };

  return (
    <div className="space-y-5">
      <header>
        <h1 className="text-2xl font-black">Check-in</h1>
        <p className="text-sm text-muted-foreground">
          {aberto
            ? `Treino em andamento desde ${fmtHora(aberto.entrada)} — escaneie novamente para registrar a saída.`
            : "Escaneie o QR Code da recepção para iniciar seu treino."}
        </p>
      </header>

      <section className="surface p-4">
        <QrScanner onResult={processar} />
      </section>

      <section className="surface space-y-3 p-4">
        <h2 className="flex items-center gap-2 text-sm font-bold">
          <ScanLine className="size-4 text-primary" /> Código manual
        </h2>
        <Input
          placeholder="Digite o código do QR"
          value={codigo}
          onChange={(e) => setCodigo(e.target.value)}
        />
        <Button
          className="w-full font-bold"
          disabled={!codigo.trim()}
          onClick={() => processar(codigo)}
        >
          Registrar
        </Button>
      </section>

      {resultado && (
        <section
          className={`surface p-4 ${resultado.ok ? "border-primary/50" : "border-destructive/50"}`}
        >
          <p className="font-bold">{resultado.mensagem}</p>
          {resultado.detalhes && resultado.detalhes.length > 0 && (
            <ul className="mt-2 space-y-1 text-sm text-muted-foreground">
              {resultado.detalhes.map((d) => (
                <li key={d}>🎯 {d}</li>
              ))}
            </ul>
          )}
          {resultado.tipo === "saida" && aberto === null && (
            <p className="mt-2 text-xs text-muted-foreground">
              Treino finalizado. Pontos do treino são concedidos apenas uma vez.
            </p>
          )}
        </section>
      )}

      {aberto && (
        <p className="text-center text-xs text-muted-foreground">
          Tempo atual: {formatarDuracao(
            duracaoMinutos({ ...aberto, saida: new Date().toISOString() }),
          )}
        </p>
      )}
    </div>
  );
}

import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Maximize2, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { getQRs, setQRs, uid, type QRCodeItem } from "@/lib/db";
import { useStore } from "@/lib/session";
import { fmtDataHora, janelaAtual, msRestantesJanela, tokenQR } from "@/lib/gamificacao";

export const Route = createFileRoute("/admin/qrcode")({
  head: () => ({
    meta: [
      { title: "QR Codes — Painel PulseFit" },
      {
        name: "description",
        content: "Gere e gerencie os QR Codes de check-in da academia.",
      },
      { property: "og:title", content: "QR Codes — Painel PulseFit" },
      {
        property: "og:description",
        content: "Criação, ativação e expiração de QR Codes de entrada e saída.",
      },
    ],
  }),
  component: QRAdmin,
});

function QRAdmin() {
  const [lista, refresh] = useStore(() => getQRs());
  const [nome, setNome] = useState("Recepção");
  const [horas, setHoras] = useState("24");

  const criar = () => {
    const codigo = `PULSE-${Math.random().toString(36).slice(2, 8).toUpperCase()}`;
    const h = Number(horas);
    const item: QRCodeItem = {
      id: uid(),
      codigo,
      nome: nome.trim() || "QR Code",
      criadoEm: new Date().toISOString(),
      expiraEm: h > 0 ? new Date(Date.now() + h * 3600000).toISOString() : null,
      ativo: true,
    };
    setQRs([item, ...getQRs()]);
    refresh();
    toast.success("QR Code criado.");
  };

  const alternar = (id: string) => {
    setQRs(getQRs().map((q) => (q.id === id ? { ...q, ativo: !q.ativo } : q)));
    refresh();
  };

  const excluir = (id: string) => {
    setQRs(getQRs().filter((q) => q.id !== id));
    refresh();
  };

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-2xl font-black">QR Codes</h1>
        <p className="text-sm text-muted-foreground">
          O aluno escaneia para registrar entrada e saída.
        </p>
      </header>

      <section className="surface grid gap-3 p-4 md:grid-cols-[1fr_140px_auto] md:items-end">
        <div className="space-y-2">
          <Label>Nome / local</Label>
          <Input value={nome} onChange={(e) => setNome(e.target.value)} />
        </div>
        <div className="space-y-2">
          <Label>Validade (horas)</Label>
          <Input type="number" min={0} value={horas} onChange={(e) => setHoras(e.target.value)} />
        </div>
        <Button className="font-bold" onClick={criar}>
          Gerar QR Code
        </Button>
      </section>

      <section className="grid gap-4 md:grid-cols-2">
        {lista.length === 0 && (
          <p className="surface p-4 text-sm text-muted-foreground">Nenhum QR Code criado.</p>
        )}
        {lista.map((q) => (
          <QrCard key={q.id} item={q} onToggle={alternar} onDelete={excluir} />
        ))}
      </section>
    </div>
  );
}

function QrCard({
  item,
  onToggle,
  onDelete,
}: {
  item: QRCodeItem;
  onToggle: (id: string) => void;
  onDelete: (id: string) => void;
}) {
  const [img, setImg] = useState<string | null>(null);
  const [janela, setJanela] = useState(() => janelaAtual());
  const [restante, setRestante] = useState(() => msRestantesJanela());

  // renova o código a cada 10 minutos
  useEffect(() => {
    const t = setInterval(() => {
      setJanela(janelaAtual());
      setRestante(msRestantesJanela());
    }, 1000);
    return () => clearInterval(t);
  }, []);

  const token = tokenQR(item.codigo, janela);

  useEffect(() => {
    let cancelado = false;
    import("qrcode").then(async (mod) => {
      const url = await mod.default.toDataURL(token, {
        width: 320,
        margin: 1,
        color: { dark: "#0d0f14", light: "#ffffff" },
      });
      if (!cancelado) setImg(url);
    });
    return () => {
      cancelado = true;
    };
  }, [token]);

  const expirado = item.expiraEm && new Date(item.expiraEm).getTime() < Date.now();
  const mm = Math.floor(restante / 60000);
  const ss = Math.floor((restante % 60000) / 1000);

  return (
    <article className="surface p-4">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="font-bold">{item.nome}</p>
          <p className="break-all font-mono text-sm text-primary">{token}</p>
          <p className="mt-1 text-[11px] text-muted-foreground">
            Criado em {fmtDataHora(item.criadoEm)}
          </p>
          <p className="text-[11px] text-muted-foreground">
            {item.expiraEm
              ? `${expirado ? "Expirou" : "Expira"} em ${fmtDataHora(item.expiraEm)}`
              : "Sem expiração"}
          </p>
        </div>
        <div className="flex flex-col items-end gap-2">
          <Switch checked={item.ativo} onCheckedChange={() => onToggle(item.id)} />
          <Button variant="ghost" size="icon" onClick={() => onDelete(item.id)}>
            <Trash2 className="size-4 text-destructive" />
          </Button>
        </div>
      </div>
      {img && (
        <img
          src={img}
          alt={`QR Code ${item.nome}`}
          className="mx-auto mt-3 w-48 rounded-xl bg-white p-2"
        />
      )}
      <p className="mt-2 text-center text-[11px] font-semibold text-muted-foreground tabular-nums">
        Novo código em {String(mm).padStart(2, "0")}:{String(ss).padStart(2, "0")}
      </p>
      <p className="mt-1 text-center text-[11px] text-muted-foreground">
        Deixe esta tela aberta na recepção — o código muda sozinho a cada 10 minutos.
      </p>
    </article>
  );
}

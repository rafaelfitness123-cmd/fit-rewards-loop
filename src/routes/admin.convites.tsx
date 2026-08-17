import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Copy, Link2, Loader2, RefreshCw, Share2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { conviteAtual, renovarConvite } from "@/lib/convites.functions";

export const Route = createFileRoute("/admin/convites")({
  head: () => ({
    meta: [
      { title: "Convites de cadastro — PulseFit Admin" },
      {
        name: "description",
        content:
          "Gere o link de convite temporário para novos alunos criarem conta no PulseFit.",
      },
      { property: "og:title", content: "Convites de cadastro — PulseFit Admin" },
      {
        property: "og:description",
        content: "Link de convite com validade de 12 horas para cadastro de alunos.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Convites,
});

function Convites() {
  const [token, setToken] = useState("");
  const [expiraEm, setExpiraEm] = useState<string | null>(null);
  const [carregando, setCarregando] = useState(true);
  const [renovando, setRenovando] = useState(false);
  const [agora, setAgora] = useState(() => Date.now());

  const carregar = async () => {
    try {
      const r = await conviteAtual();
      setToken(r.token);
      setExpiraEm(r.expiraEm);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Não foi possível carregar o convite.");
    } finally {
      setCarregando(false);
    }
  };

  useEffect(() => {
    void carregar();
  }, []);

  // Relógio: quando o link vence, busca automaticamente o novo válido.
  useEffect(() => {
    const t = setInterval(() => setAgora(Date.now()), 1000);
    return () => clearInterval(t);
  }, []);

  useEffect(() => {
    if (!expiraEm) return;
    if (new Date(expiraEm).getTime() - agora > 0) return;
    void carregar();
  }, [agora, expiraEm]);

  const link =
    typeof window !== "undefined" && token
      ? `${window.location.origin}/cadastro?c=${token}`
      : "";

  const restanteMs = expiraEm ? Math.max(0, new Date(expiraEm).getTime() - agora) : 0;
  const hh = Math.floor(restanteMs / 3_600_000);
  const mm = Math.floor((restanteMs % 3_600_000) / 60_000);
  const ss = Math.floor((restanteMs % 60_000) / 1000);

  const copiar = async () => {
    try {
      await navigator.clipboard.writeText(link);
      toast.success("Link copiado!");
    } catch {
      toast.error("Não foi possível copiar. Selecione o link manualmente.");
    }
  };

  const compartilhar = async () => {
    if (!navigator.share) return copiar();
    try {
      await navigator.share({ title: "Cadastro PulseFit", url: link });
    } catch {
      /* cancelado pelo usuário */
    }
  };

  const renovar = async () => {
    setRenovando(true);
    try {
      const r = await renovarConvite();
      setToken(r.token);
      setExpiraEm(r.expiraEm);
      toast.success("Novo link gerado. O anterior deixou de funcionar.");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Não foi possível gerar o link.");
    } finally {
      setRenovando(false);
    }
  };

  return (
    <div className="space-y-5">
      <header>
        <h1 className="text-2xl font-black tracking-tight">Convites de cadastro</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Só quem receber este link consegue criar conta. Ele vale por 12 horas e é
          substituído automaticamente por um novo.
        </p>
      </header>

      <section className="surface space-y-4 p-5">
        {carregando ? (
          <p className="flex items-center gap-2 text-sm text-muted-foreground">
            <Loader2 className="size-4 animate-spin" /> Gerando link…
          </p>
        ) : (
          <>
            <div className="flex items-start gap-2 rounded-xl bg-muted/50 p-3">
              <Link2 className="mt-0.5 size-4 shrink-0 text-primary" />
              <code className="break-all text-xs font-semibold">{link}</code>
            </div>

            <p className="text-sm text-muted-foreground tabular-nums">
              Expira em{" "}
              <strong className="text-foreground">
                {hh}h {String(mm).padStart(2, "0")}m {String(ss).padStart(2, "0")}s
              </strong>
            </p>

            <div className="grid gap-2 sm:grid-cols-3">
              <Button className="font-bold" onClick={() => void copiar()}>
                <Copy className="mr-2 size-4" /> Copiar link
              </Button>
              <Button variant="secondary" className="font-bold" onClick={() => void compartilhar()}>
                <Share2 className="mr-2 size-4" /> Compartilhar
              </Button>
              <Button
                variant="outline"
                className="font-bold"
                disabled={renovando}
                onClick={() => void renovar()}
              >
                {renovando ? (
                  <Loader2 className="mr-2 size-4 animate-spin" />
                ) : (
                  <RefreshCw className="mr-2 size-4" />
                )}
                Gerar novo
              </Button>
            </div>
          </>
        )}
      </section>
    </div>
  );
}

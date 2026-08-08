import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { ArrowLeft, Camera, ImagePlus, X } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import CardMissao from "@/components/CardMissao";
import { useClienteAtual } from "@/lib/session";
import {
  criarPublicacao,
  enviarFoto,
  legendaSugerida,
  lerRascunhoMissao,
  limparRascunhoMissao,
  type MissaoSnapshot,
} from "@/lib/comunidade";

export const Route = createFileRoute("/app/comunidade/novo")({
  head: () => ({
    meta: [
      { title: "Nova publicação — PulseFit" },
      {
        name: "description",
        content: "Compartilhe uma foto, um treino ou uma missão concluída com a comunidade.",
      },
      { property: "og:title", content: "Nova publicação — PulseFit" },
      {
        property: "og:description",
        content: "Publique sua conquista no feed da Companhia Fitness.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: NovaPublicacao,
});

const MAX_LADO = 1280;
const MAX_BYTES = 8 * 1024 * 1024;

/** Reduz a foto antes de enviar, para não consumir dados do aluno. */
async function otimizar(arquivo: File): Promise<Blob> {
  try {
    const bitmap = await createImageBitmap(arquivo);
    const escala = Math.min(1, MAX_LADO / Math.max(bitmap.width, bitmap.height));
    const largura = Math.round(bitmap.width * escala);
    const altura = Math.round(bitmap.height * escala);
    const canvas = document.createElement("canvas");
    canvas.width = largura;
    canvas.height = altura;
    const ctx = canvas.getContext("2d");
    if (!ctx) return arquivo;
    ctx.drawImage(bitmap, 0, 0, largura, altura);
    const blob = await new Promise<Blob | null>((r) =>
      canvas.toBlob((b) => r(b), "image/jpeg", 0.82),
    );
    bitmap.close?.();
    return blob ?? arquivo;
  } catch {
    return arquivo;
  }
}

function NovaPublicacao() {
  const navigate = useNavigate();
  const cliente = useClienteAtual();
  const inputGaleria = useRef<HTMLInputElement | null>(null);
  const inputCamera = useRef<HTMLInputElement | null>(null);

  const [arquivo, setArquivo] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [legenda, setLegenda] = useState("");
  const [missao, setMissao] = useState<MissaoSnapshot | null>(null);
  const [missaoId, setMissaoId] = useState<string | null>(null);
  const [enviando, setEnviando] = useState(false);

  // Rascunho vindo do fluxo "Compartilhar missão".
  useEffect(() => {
    const r = lerRascunhoMissao();
    if (!r) return;
    setMissao(r.missao);
    setMissaoId(r.missaoId);
    setLegenda(r.legenda || legendaSugerida(r.missao));
  }, []);

  useEffect(() => {
    if (!arquivo) {
      setPreview(null);
      return;
    }
    const url = URL.createObjectURL(arquivo);
    setPreview(url);
    return () => URL.revokeObjectURL(url);
  }, [arquivo]);

  if (!cliente) return null;

  const escolher = (f: File | undefined) => {
    if (!f) return;
    if (!f.type.startsWith("image/")) {
      toast.error("Selecione uma imagem.");
      return;
    }
    if (f.size > MAX_BYTES) {
      toast.error("Imagem muito grande (máx. 8 MB).");
      return;
    }
    setArquivo(f);
  };

  const publicar = async () => {
    if (enviando) return;
    if (!arquivo && !legenda.trim() && !missao) {
      toast.error("Escreva uma legenda ou escolha uma foto.");
      return;
    }
    setEnviando(true);
    try {
      let imagemPath: string | null = null;
      if (arquivo) {
        const otimizada = await otimizar(arquivo);
        imagemPath = await enviarFoto(otimizada, cliente.id);
      }
      await criarPublicacao({
        autorId: cliente.id,
        legenda: legenda.trim(),
        imagemPath,
        tipo: missao ? "missao" : "normal",
        missaoId,
        missao,
      });
      limparRascunhoMissao();
      toast.success(missao ? "Conquista publicada! 🏆" : "Publicação criada!");
      void navigate({ to: "/app/comunidade" });
    } catch (e) {
      console.error("Falha ao publicar", e);
      toast.error("Não foi possível publicar. Tente novamente.");
    } finally {
      setEnviando(false);
    }
  };

  return (
    <div className="space-y-4">
      <Link
        to="/app/comunidade"
        className="inline-flex items-center gap-1 text-xs font-semibold text-muted-foreground"
        onClick={() => limparRascunhoMissao()}
      >
        <ArrowLeft className="size-4" /> Voltar para a comunidade
      </Link>

      <h1 className="text-2xl font-black">
        {missao ? "🏆 Compartilhar missão" : "Nova publicação"}
      </h1>

      {missao && <CardMissao missao={missao} />}

      <section className="surface space-y-3 p-4">
        {preview ? (
          <div className="relative overflow-hidden rounded-xl">
            <img src={preview} alt="Prévia da publicação" className="w-full object-cover" />
            <button
              type="button"
              aria-label="Remover foto"
              onClick={() => setArquivo(null)}
              className="absolute right-2 top-2 rounded-full bg-background/85 p-2 text-foreground"
            >
              <X className="size-4" />
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-2">
            <Button
              type="button"
              variant="secondary"
              className="h-24 flex-col gap-2 font-bold"
              onClick={() => inputGaleria.current?.click()}
            >
              <ImagePlus className="size-5 text-primary" />
              Galeria
            </Button>
            <Button
              type="button"
              variant="secondary"
              className="h-24 flex-col gap-2 font-bold"
              onClick={() => inputCamera.current?.click()}
            >
              <Camera className="size-5 text-primary" />
              Câmera
            </Button>
          </div>
        )}

        <input
          ref={inputGaleria}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={(e) => escolher(e.target.files?.[0])}
        />
        <input
          ref={inputCamera}
          type="file"
          accept="image/*"
          capture="environment"
          className="hidden"
          onChange={(e) => escolher(e.target.files?.[0])}
        />

        <div>
          <label htmlFor="legenda" className="text-xs font-bold uppercase text-muted-foreground">
            Legenda
          </label>
          <Textarea
            id="legenda"
            value={legenda}
            onChange={(e) => setLegenda(e.target.value)}
            placeholder="Como foi seu treino hoje?"
            rows={5}
            maxLength={1000}
            className="mt-1"
          />
          <p className="mt-1 text-right text-[10px] text-muted-foreground">
            {legenda.length}/1000
          </p>
        </div>
      </section>

      <div className="grid grid-cols-2 gap-2">
        <Button
          variant="secondary"
          className="font-bold"
          disabled={enviando}
          onClick={() => {
            limparRascunhoMissao();
            void navigate({ to: "/app/comunidade" });
          }}
        >
          Cancelar
        </Button>
        <Button className="font-bold" disabled={enviando} onClick={() => void publicar()}>
          {enviando ? "Publicando…" : missao ? "Publicar conquista" : "Publicar"}
        </Button>
      </div>
    </div>
  );
}

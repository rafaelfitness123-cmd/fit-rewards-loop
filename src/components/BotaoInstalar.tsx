import { useEffect, useState } from "react";
import { Download, Share } from "lucide-react";
import { Button } from "@/components/ui/button";

type PromptInstalacao = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
};

/**
 * Botão "Instalar app" (PWA). Usa o prompt nativo quando o navegador oferece;
 * no iPhone mostra a instrução de "Compartilhar › Adicionar à Tela de Início".
 */
export default function BotaoInstalar({ className = "" }: { className?: string }) {
  const [evento, setEvento] = useState<PromptInstalacao | null>(null);
  const [instalado, setInstalado] = useState(false);
  const [ios, setIos] = useState(false);
  const [dica, setDica] = useState(false);

  useEffect(() => {
    const standalone =
      window.matchMedia("(display-mode: standalone)").matches ||
      (window.navigator as unknown as { standalone?: boolean }).standalone === true;
    setInstalado(standalone);
    setIos(/iphone|ipad|ipod/i.test(window.navigator.userAgent));

    const aoPrompt = (e: Event) => {
      e.preventDefault();
      setEvento(e as PromptInstalacao);
    };
    const aoInstalar = () => setInstalado(true);
    window.addEventListener("beforeinstallprompt", aoPrompt);
    window.addEventListener("appinstalled", aoInstalar);
    return () => {
      window.removeEventListener("beforeinstallprompt", aoPrompt);
      window.removeEventListener("appinstalled", aoInstalar);
    };
  }, []);

  if (instalado) return null;
  if (!evento && !ios) return null;

  return (
    <div className={`w-full ${className}`}>
      <Button
        type="button"
        variant="outline"
        className="w-full font-bold"
        onClick={() => {
          if (evento) {
            void evento.prompt();
            void evento.userChoice.finally(() => setEvento(null));
            return;
          }
          setDica((v) => !v);
        }}
      >
        <Download className="mr-2 size-4" /> Instalar o app
      </Button>
      {dica && ios && (
        <p className="mt-2 flex items-start gap-2 text-[11px] text-muted-foreground">
          <Share className="mt-0.5 size-3.5 shrink-0 text-primary" />
          No iPhone: toque em Compartilhar e depois em "Adicionar à Tela de Início".
        </p>
      )}
    </div>
  );
}

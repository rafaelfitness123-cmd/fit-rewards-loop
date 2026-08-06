import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";

type Props = { onResult: (text: string) => void };

type Scanner = {
  start: (
    cam: unknown,
    config: unknown,
    onOk: (texto: string) => void,
    onErr: () => void,
  ) => Promise<void>;
  stop: () => Promise<void>;
  clear: () => void;
  getState: () => number;
};

const REGIAO = "qr-scanner-region";

export function QrScanner({ onResult }: Props) {
  const scannerRef = useRef<Scanner | null>(null);
  const [ativo, setAtivo] = useState(false);
  const [carregando, setCarregando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);

  const encerrar = async () => {
    const s = scannerRef.current;
    scannerRef.current = null;
    if (!s) return;
    try {
      if (s.getState() === 2) await s.stop();
      s.clear();
    } catch {
      /* scanner já estava parado */
    }
  };

  useEffect(() => {
    return () => {
      void encerrar();
    };
  }, []);

  const iniciar = async () => {
    setErro(null);
    setCarregando(true);
    try {
      if (!window.isSecureContext) {
        throw new Error("insecure");
      }
      const { Html5Qrcode } = await import("html5-qrcode");
      // garante que o container existe e está vazio antes de iniciar
      const el = document.getElementById(REGIAO);
      if (!el) throw new Error("sem-container");
      el.innerHTML = "";
      setAtivo(true);
      // aguarda o layout aplicar a altura do container
      await new Promise((r) => requestAnimationFrame(() => r(null)));

      const scanner = new Html5Qrcode(REGIAO, false) as unknown as Scanner;
      scannerRef.current = scanner;
      await scanner.start(
        { facingMode: "environment" },
        { fps: 10, qrbox: { width: 230, height: 230 } },
        (texto) => {
          void encerrar().then(() => {
            setAtivo(false);
            onResult(texto);
          });
        },
        () => {},
      );
    } catch (e) {
      await encerrar();
      setAtivo(false);
      const nome = e instanceof Error ? e.message : "";
      setErro(
        nome === "insecure"
          ? "A câmera só funciona em conexão segura (https). Use o código manual abaixo."
          : "Não foi possível acessar a câmera. Verifique a permissão do navegador ou use o código manual abaixo.",
      );
    } finally {
      setCarregando(false);
    }
  };

  const parar = async () => {
    await encerrar();
    setAtivo(false);
  };

  return (
    <div className="space-y-3">
      <div
        id={REGIAO}
        className="overflow-hidden rounded-2xl border border-border bg-muted/40 [&_video]:w-full"
        style={{ minHeight: ativo ? 260 : 0 }}
      />
      {erro && <p className="text-xs text-destructive">{erro}</p>}
      {ativo ? (
        <Button variant="secondary" className="w-full" onClick={() => void parar()}>
          Parar câmera
        </Button>
      ) : (
        <Button
          className="w-full font-bold"
          disabled={carregando}
          onClick={() => void iniciar()}
        >
          {carregando ? "Abrindo câmera..." : "Abrir câmera"}
        </Button>
      )}
    </div>
  );
}

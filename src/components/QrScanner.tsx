import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";

type Props = { onResult: (text: string) => void };

export function QrScanner({ onResult }: Props) {
  const containerId = "qr-scanner-region";
  const scannerRef = useRef<{ stop: () => Promise<void>; clear: () => void } | null>(
    null,
  );
  const [ativo, setAtivo] = useState(false);
  const [erro, setErro] = useState<string | null>(null);

  useEffect(() => {
    return () => {
      const s = scannerRef.current;
      if (s) s.stop().catch(() => {}) as unknown;
      scannerRef.current = null;
    };
  }, []);

  const iniciar = async () => {
    setErro(null);
    try {
      const { Html5Qrcode } = await import("html5-qrcode");
      const scanner = new Html5Qrcode(containerId);
      scannerRef.current = scanner as unknown as {
        stop: () => Promise<void>;
        clear: () => void;
      };
      setAtivo(true);
      await scanner.start(
        { facingMode: "environment" },
        { fps: 10, qrbox: { width: 230, height: 230 } },
        (texto) => {
          scanner
            .stop()
            .then(() => scanner.clear())
            .catch(() => {});
          scannerRef.current = null;
          setAtivo(false);
          onResult(texto);
        },
        () => {},
      );
    } catch {
      setAtivo(false);
      setErro(
        "Não foi possível acessar a câmera. Use o código manual abaixo para registrar.",
      );
    }
  };

  const parar = async () => {
    const s = scannerRef.current;
    if (s) {
      await s.stop().catch(() => {});
      s.clear();
    }
    scannerRef.current = null;
    setAtivo(false);
  };

  return (
    <div className="space-y-3">
      <div
        id={containerId}
        className="overflow-hidden rounded-2xl border border-border bg-muted/40"
        style={{ minHeight: ativo ? 260 : 0 }}
      />
      {erro && <p className="text-xs text-destructive">{erro}</p>}
      {ativo ? (
        <Button variant="secondary" className="w-full" onClick={parar}>
          Parar câmera
        </Button>
      ) : (
        <Button className="w-full font-bold" onClick={iniciar}>
          Abrir câmera
        </Button>
      )}
    </div>
  );
}

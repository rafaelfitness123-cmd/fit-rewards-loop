import { useEffect, useRef, useState, type ReactNode } from "react";
import { ChevronsRight, Footprints, Lock, Timer } from "lucide-react";

/**
 * Modo seguro: cobre a tela inteira durante a missão para evitar toques
 * acidentais. Só libera quando o dedo arrasta o botão até o fim da trilha.
 */
export default function BloqueioTela({
  metros,
  duracaoS,
  statusTexto,
  mapa,
  onDesbloquear,
}: {
  metros: number;
  duracaoS: number;
  statusTexto: string;
  /** Mapa ao vivo exibido dentro do bloqueio (somente visual, sem toques). */
  mapa?: ReactNode;
  onDesbloquear: () => void;
}) {
  const trilhaRef = useRef<HTMLDivElement | null>(null);
  const [x, setX] = useState(0);
  const [arrastando, setArrastando] = useState(false);
  const maxRef = useRef(0);

  useEffect(() => {
    const anterior = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = anterior;
    };
  }, []);

  const limite = () => {
    const largura = trilhaRef.current?.clientWidth ?? 0;
    maxRef.current = Math.max(0, largura - 64 - 8);
    return maxRef.current;
  };

  const mover = (clientX: number) => {
    const caixa = trilhaRef.current?.getBoundingClientRect();
    if (!caixa) return;
    const max = limite();
    setX(Math.min(max, Math.max(0, clientX - caixa.left - 36)));
  };

  const soltar = () => {
    setArrastando(false);
    if (x >= maxRef.current * 0.92) {
      onDesbloquear();
      return;
    }
    setX(0);
  };

  const mm = Math.floor(duracaoS / 60);
  const ss = duracaoS % 60;

  return (
    <div
      className="fixed inset-0 z-[100] flex flex-col items-center justify-between gap-4 overflow-y-auto bg-background/95 p-6 backdrop-blur-md"
      onContextMenu={(e) => e.preventDefault()}
    >
      <div className="flex items-center gap-2 rounded-full bg-primary/15 px-4 py-2 text-xs font-bold text-primary">
        <Lock className="size-4" /> Modo seguro ativo
      </div>

      {mapa && (
        <div className="w-full max-w-sm select-none overflow-hidden rounded-2xl border border-border">
          {/* pointer-events-none: o mapa continua vivo, mas não aceita toques. */}
          <div className="pointer-events-none touch-none [&_.leaflet-container]:h-56">
            {mapa}
          </div>
        </div>
      )}

      <div className="text-center">
        <Footprints className="mx-auto size-8 text-primary" />
        <p className="mt-4 text-6xl font-black tabular-nums">
          {(metros / 1000).toFixed(2)}
          <span className="text-xl font-bold text-muted-foreground"> km</span>
        </p>
        <p className="mt-3 flex items-center justify-center gap-2 text-sm text-muted-foreground tabular-nums">
          <Timer className="size-4" />
          {mm}:{String(ss).padStart(2, "0")} · {statusTexto}
        </p>
        <p className="mt-4 text-xs text-muted-foreground">
          A tela está bloqueada contra toques acidentais. O percurso continua sendo
          registrado normalmente.
        </p>
      </div>

      <div className="w-full max-w-sm">
        <div
          ref={trilhaRef}
          className="relative h-16 select-none overflow-hidden rounded-full border border-border bg-muted/60"
          onPointerMove={(e) => arrastando && mover(e.clientX)}
          onPointerUp={() => arrastando && soltar()}
          onPointerLeave={() => arrastando && soltar()}
        >
          <span className="pointer-events-none absolute inset-0 flex items-center justify-center text-xs font-semibold text-muted-foreground">
            Arraste para desbloquear
          </span>
          <button
            type="button"
            aria-label="Arraste para desbloquear a tela"
            onPointerDown={(e) => {
              e.currentTarget.releasePointerCapture?.(e.pointerId);
              limite();
              setArrastando(true);
            }}
            style={{ transform: `translateX(${x}px)` }}
            className={`absolute left-1 top-1 flex size-14 touch-none items-center justify-center rounded-full bg-primary text-primary-foreground shadow-lg ${
              arrastando ? "" : "transition-transform"
            }`}
          >
            <ChevronsRight className="size-6" />
          </button>
        </div>
      </div>
    </div>
  );
}

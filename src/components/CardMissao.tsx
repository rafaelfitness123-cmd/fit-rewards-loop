import { lazy, Suspense, useState } from "react";
import { Bike, Dumbbell, Flame, Footprints, MapPin, Repeat, Timer, Trophy } from "lucide-react";
import {
  fmtKm,
  fmtRitmo,
  fmtTempoLongo,
  fmtVelocidade,
  type MissaoSnapshot,
} from "@/lib/comunidade";

const MapaPercurso = lazy(() => import("@/components/MapaPercurso"));

const ICONES: Record<string, typeof Footprints> = {
  caminhada: Footprints,
  corrida: Flame,
  bicicleta: Bike,
  treino: Dumbbell,
  repeticoes: Repeat,
  frequencia: Trophy,
};

const ROTULOS: Record<string, string> = {
  caminhada: "Caminhada",
  corrida: "Corrida",
  bicicleta: "Bicicleta",
  treino: "Treino",
  repeticoes: "Desafio por repetições",
  frequencia: "Desafio de frequência",
};

/** Card visual da missão compartilhada — identidade PulseFit. */
export default function CardMissao({
  missao,
  mapa = true,
}: {
  missao: MissaoSnapshot;
  mapa?: boolean;
}) {
  const [expandido, setExpandido] = useState(false);
  const Icone = ICONES[missao.atividade] ?? Trophy;
  const trilha = missao.trilha ?? [];

  const metricas: { rotulo: string; valor: string; icone: typeof Timer }[] = [];
  if (missao.distanciaM != null) {
    metricas.push({ rotulo: "Distância", valor: fmtKm(missao.distanciaM), icone: MapPin });
  }
  if (missao.duracaoS != null) {
    metricas.push({ rotulo: "Tempo", valor: fmtTempoLongo(missao.duracaoS), icone: Timer });
  }
  if (missao.distanciaM != null && missao.duracaoS != null) {
    if (missao.atividade === "bicicleta") {
      const v = fmtVelocidade(missao.distanciaM, missao.duracaoS);
      if (v) metricas.push({ rotulo: "Velocidade média", valor: v, icone: Flame });
    } else {
      const r = fmtRitmo(missao.distanciaM, missao.duracaoS);
      if (r) metricas.push({ rotulo: "Ritmo", valor: r, icone: Flame });
    }
  }
  if (missao.quantidade != null) {
    metricas.push({
      rotulo: missao.atividade === "frequencia" ? "Dias" : "Resultado",
      valor:
        missao.meta != null
          ? `${missao.quantidade}/${missao.meta}${missao.unidade ? ` ${missao.unidade}` : ""}`
          : `${missao.quantidade}${missao.unidade ? ` ${missao.unidade}` : ""}`,
      icone: Repeat,
    });
  }

  return (
    <div className="overflow-hidden rounded-2xl border border-primary/30 bg-gradient-to-b from-primary/10 to-card">
      <div className="flex items-center gap-2 border-b border-primary/20 px-4 py-2.5">
        <Trophy className="size-4 text-primary" />
        <span className="text-[11px] font-black uppercase tracking-widest text-primary">
          Missão concluída
        </span>
      </div>

      <div className="space-y-3 p-4">
        <div className="flex items-center gap-2">
          <Icone className="size-5 shrink-0 text-primary" />
          <div className="min-w-0">
            <p className="truncate text-base font-black">{missao.nome}</p>
            <p className="text-[11px] text-muted-foreground">
              {ROTULOS[missao.atividade] ?? "Missão"}
              {missao.pontos ? ` · +${missao.pontos} pts` : ""}
            </p>
          </div>
        </div>

        {metricas.length > 0 && (
          <div className="grid grid-cols-3 gap-2">
            {metricas.map((m) => (
              <div key={m.rotulo} className="rounded-xl bg-background/60 p-2.5 text-center">
                <m.icone className="mx-auto size-3.5 text-primary" />
                <p className="mt-1 text-sm font-black tabular-nums">{m.valor}</p>
                <p className="text-[10px] text-muted-foreground">{m.rotulo}</p>
              </div>
            ))}
          </div>
        )}

        {mapa && trilha.length > 1 && (
          <div className="space-y-2">
            <Suspense
              fallback={
                <div className="h-[180px] w-full rounded-xl border border-border bg-muted/30" />
              }
            >
              <MapaPercurso
                trilha={trilha}
                altura={expandido ? 300 : 180}
                interativo={expandido}
              />
            </Suspense>
            <button
              type="button"
              onClick={() => setExpandido((v) => !v)}
              className="text-[11px] font-semibold text-primary underline"
            >
              {expandido ? "Recolher mapa" : "Abrir mapa completo"}
            </button>
          </div>
        )}

        <div className="flex items-center justify-between border-t border-border/60 pt-2.5">
          <span className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">
            Companhia Fitness
          </span>
          <span className="text-[10px] font-black uppercase tracking-widest text-primary">
            PulseFit
          </span>
        </div>
      </div>
    </div>
  );
}

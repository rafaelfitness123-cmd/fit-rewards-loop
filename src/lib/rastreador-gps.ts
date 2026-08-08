/**
 * Motor único de rastreamento GPS das missões de distância.
 *
 * Responsabilidades:
 *  - um único navigator.geolocation.watchPosition por vez (sem serviços concorrentes);
 *  - filtragem de oscilação usando precisão + distância + tempo + velocidade + sequência;
 *  - acúmulo progressivo da distância real (Haversine sobre coordenadas do GPS);
 *  - persistência periódica do percurso em localStorage (recuperação após fechar o app);
 *  - pausar / retomar / finalizar.
 */

export type PontoGps = {
  lat: number;
  lng: number;
  accuracy: number;
  t: number;
  /** m/s informado pelo GPS quando disponível */
  speed: number | null;
};

export type QualidadeGps = "boa" | "baixa" | "indisponivel";

export type EstadoRastreio = {
  status: "parado" | "aguardando" | "ativo" | "pausado";
  metros: number;
  duracaoS: number;
  trilha: PontoGps[];
  atual: PontoGps | null;
  accuracy: number | null;
  qualidade: QualidadeGps;
  emMovimento: boolean;
  erro: string | null;
  iniciadoEm: number | null;
  eventos: Array<{ tipo: "inicio" | "pausa" | "retomada" | "fim"; t: number }>;
};

const CHAVE = "pulsefit:percurso-ativo";

/** Distância Haversine em metros entre duas coordenadas reais. */
export function haversine(
  a: { lat: number; lng: number },
  b: { lat: number; lng: number },
): number {
  const R = 6371000;
  const rad = (v: number) => (v * Math.PI) / 180;
  const dLat = rad(b.lat - a.lat);
  const dLng = rad(b.lng - a.lng);
  const s =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(rad(a.lat)) * Math.cos(rad(b.lat)) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(s));
}

/** Precisão pior que isto é descartada (ponto claramente inválido). */
const ACC_MAX = 60;
/** Velocidade máxima plausível numa missão a pé (m/s) — acima disso é salto de GPS. */
const VEL_MAX = 9;

export type Filtro = {
  aceito: boolean;
  distancia: number;
  motivo?: string;
};

/**
 * Decide se o deslocamento entre a âncora e o novo ponto é real.
 * Combina precisão, distância, tempo decorrido, velocidade do GPS e a
 * sequência recente de pontos (streak de movimento).
 */
export function validarDeslocamento(
  ancora: PontoGps,
  ponto: PontoGps,
  streakMovimento: number,
): Filtro {
  if (!Number.isFinite(ponto.accuracy) || ponto.accuracy > ACC_MAX) {
    return { aceito: false, distancia: 0, motivo: "precisao" };
  }

  const d = haversine(ancora, ponto);
  const dt = Math.max(0.2, (ponto.t - ancora.t) / 1000);
  const velocidadeCalculada = d / dt;

  // Salto impossível (troca de torre, correção brusca de precisão).
  if (velocidadeCalculada > VEL_MAX || d > 200) {
    return { aceito: false, distancia: 0, motivo: "salto" };
  }

  const velGps = ponto.speed;
  const temVelocidade = velGps !== null && Number.isFinite(velGps);
  const andando = temVelocidade ? (velGps as number) >= 0.6 : false;
  const parado = temVelocidade ? (velGps as number) < 0.25 : false;

  // Limiar adaptativo: parte da precisão do sinal, e afrouxa quando há
  // evidência independente de movimento (velocidade do GPS ou sequência
  // recente de deslocamentos aceitos). Nunca é um "sempre ignore < 10 m".
  let limiar = Math.max(3, ponto.accuracy * 0.55);
  if (andando) limiar = Math.max(1.5, ponto.accuracy * 0.25);
  if (streakMovimento >= 2) limiar = Math.min(limiar, Math.max(1.5, ponto.accuracy * 0.3));
  // Se o intervalo entre fixes foi grande, um deslocamento maior é esperado.
  if (dt >= 4) limiar = Math.min(limiar, 4);

  if (parado && velocidadeCalculada < 0.5) {
    return { aceito: false, distancia: 0, motivo: "parado" };
  }
  if (d < limiar) {
    return { aceito: false, distancia: 0, motivo: "ruido" };
  }

  return { aceito: true, distancia: d };
}

type Ouvinte = (estado: EstadoRastreio) => void;

const estadoInicial = (): EstadoRastreio => ({
  status: "parado",
  metros: 0,
  duracaoS: 0,
  trilha: [],
  atual: null,
  accuracy: null,
  qualidade: "indisponivel",
  emMovimento: false,
  erro: null,
  iniciadoEm: null,
  eventos: [],
});

class Rastreador {
  private estado: EstadoRastreio = estadoInicial();
  private ouvintes = new Set<Ouvinte>();
  private watchId: number | null = null;
  private timer: ReturnType<typeof setInterval> | null = null;
  private ancora: PontoGps | null = null;
  private streak = 0;
  private ultimoMovimento = 0;
  private wakeLock: WakeLockSentinel | null = null;
  private missaoId: string | null = null;

  assinar(fn: Ouvinte) {
    this.ouvintes.add(fn);
    fn(this.estado);
    return () => this.ouvintes.delete(fn);
  }

  ler() {
    return this.estado;
  }

  private emitir(patch: Partial<EstadoRastreio>) {
    this.estado = { ...this.estado, ...patch };
    this.ouvintes.forEach((fn) => fn(this.estado));
  }

  /** Percurso salvo de uma missão, se houver, para retomar após fechar o app. */
  recuperar(missaoId: string): EstadoRastreio | null {
    if (typeof localStorage === "undefined") return null;
    try {
      const bruto = localStorage.getItem(CHAVE);
      if (!bruto) return null;
      const dados = JSON.parse(bruto) as { missaoId: string; estado: EstadoRastreio };
      if (dados.missaoId !== missaoId) return null;
      if (!dados.estado?.trilha?.length) return null;
      return dados.estado;
    } catch {
      return null;
    }
  }

  private salvar() {
    if (typeof localStorage === "undefined" || !this.missaoId) return;
    try {
      localStorage.setItem(
        CHAVE,
        JSON.stringify({
          missaoId: this.missaoId,
          salvoEm: Date.now(),
          estado: { ...this.estado, trilha: this.estado.trilha.slice(-1500) },
        }),
      );
    } catch {
      /* armazenamento cheio: o rastreio continua em memória */
    }
  }

  limparSalvo() {
    if (typeof localStorage === "undefined") return;
    try {
      localStorage.removeItem(CHAVE);
    } catch {
      /* ignora */
    }
  }

  private async pedirWakeLock() {
    try {
      const nav = navigator as Navigator & { wakeLock?: WakeLock };
      if (!nav.wakeLock) return;
      this.wakeLock = await nav.wakeLock.request("screen");
    } catch {
      /* wake lock é opcional */
    }
  }

  private soltarWakeLock() {
    void this.wakeLock?.release().catch(() => {});
    this.wakeLock = null;
  }

  /** Reaplica o wake lock quando o app volta para primeiro plano. */
  aoVoltarAoFoco() {
    if (this.estado.status === "ativo" && !this.wakeLock) void this.pedirWakeLock();
  }

  private tick = () => {
    if (this.estado.status !== "ativo") return;
    const emMovimento = Date.now() - this.ultimoMovimento < 8000;
    this.emitir({ duracaoS: this.estado.duracaoS + 1, emMovimento });
    if (this.estado.duracaoS % 5 === 0) this.salvar();
  };

  private processar = (pos: GeolocationPosition) => {
    const ponto: PontoGps = {
      lat: pos.coords.latitude,
      lng: pos.coords.longitude,
      accuracy: pos.coords.accuracy,
      speed: pos.coords.speed ?? null,
      t: pos.timestamp || Date.now(),
    };

    const qualidade: QualidadeGps =
      !Number.isFinite(ponto.accuracy) || ponto.accuracy > ACC_MAX
        ? "indisponivel"
        : ponto.accuracy <= 20
          ? "boa"
          : "baixa";

    this.emitir({ atual: ponto, accuracy: ponto.accuracy, qualidade, erro: null });

    if (this.estado.status !== "ativo") return;
    if (qualidade === "indisponivel") return;

    if (!this.ancora) {
      this.ancora = ponto;
      this.emitir({ trilha: [...this.estado.trilha, ponto] });
      this.salvar();
      return;
    }

    const r = validarDeslocamento(this.ancora, ponto, this.streak);
    if (!r.aceito) {
      if (r.motivo !== "ruido") this.streak = 0;
      return;
    }

    this.streak = Math.min(5, this.streak + 1);
    this.ultimoMovimento = Date.now();
    this.ancora = ponto;
    this.emitir({
      metros: this.estado.metros + r.distancia,
      trilha: [...this.estado.trilha, ponto],
      emMovimento: true,
    });
    this.salvar();
  };

  private erroGeo = (e: GeolocationPositionError) => {
    const msg =
      e.code === 1
        ? "Permissão de localização negada. Autorize o GPS e tente novamente."
        : e.code === 2
          ? "Sinal de GPS indisponível. Vá para um local aberto."
          : "O GPS demorou para responder.";
    this.emitir({ erro: msg, qualidade: "indisponivel" });
    if (e.code === 1) this.parar();
  };

  private ligarWatch() {
    if (this.watchId !== null) return;
    this.watchId = navigator.geolocation.watchPosition(this.processar, this.erroGeo, {
      enableHighAccuracy: true,
      // ~1 fix/s do sistema é suficiente para caminhada/corrida e evita
      // consumo desnecessário de bateria.
      maximumAge: 1000,
      timeout: 30000,
    });
  }

  private desligarWatch() {
    if (this.watchId !== null) {
      try {
        navigator.geolocation.clearWatch(this.watchId);
      } catch {
        /* ignora */
      }
      this.watchId = null;
    }
  }

  iniciar(missaoId: string, retomado?: EstadoRastreio) {
    if (typeof navigator === "undefined" || !navigator.geolocation) {
      this.emitir({ erro: "Este dispositivo não suporta GPS." });
      return;
    }
    this.missaoId = missaoId;
    this.ancora = null;
    this.streak = 0;
    this.ultimoMovimento = Date.now();
    const base = retomado
      ? { ...retomado, status: "ativo" as const, erro: null }
      : {
          ...estadoInicial(),
          status: "ativo" as const,
          iniciadoEm: Date.now(),
          eventos: [{ tipo: "inicio" as const, t: Date.now() }],
        };
    this.estado = base;
    if (retomado) {
      this.estado.eventos = [...retomado.eventos, { tipo: "retomada", t: Date.now() }];
    }
    this.ouvintes.forEach((fn) => fn(this.estado));
    this.ligarWatch();
    if (!this.timer) this.timer = setInterval(this.tick, 1000);
    void this.pedirWakeLock();
    this.salvar();
  }

  pausar() {
    if (this.estado.status !== "ativo") return;
    this.desligarWatch();
    this.soltarWakeLock();
    this.ancora = null;
    this.streak = 0;
    this.emitir({
      status: "pausado",
      emMovimento: false,
      eventos: [...this.estado.eventos, { tipo: "pausa", t: Date.now() }],
    });
    this.salvar();
  }

  retomar() {
    if (this.estado.status !== "pausado") return;
    this.ancora = null;
    this.streak = 0;
    this.ultimoMovimento = Date.now();
    this.emitir({
      status: "ativo",
      erro: null,
      eventos: [...this.estado.eventos, { tipo: "retomada", t: Date.now() }],
    });
    this.ligarWatch();
    void this.pedirWakeLock();
  }

  /** Encerra o rastreio e libera todos os recursos. */
  parar() {
    this.desligarWatch();
    this.soltarWakeLock();
    if (this.timer) {
      clearInterval(this.timer);
      this.timer = null;
    }
    this.ancora = null;
    this.streak = 0;
    const final = {
      ...this.estado,
      status: "parado" as const,
      emMovimento: false,
      eventos: [...this.estado.eventos, { tipo: "fim" as const, t: Date.now() }],
    };
    this.estado = final;
    this.ouvintes.forEach((fn) => fn(this.estado));
    return final;
  }

  zerar() {
    this.parar();
    this.limparSalvo();
    this.missaoId = null;
    this.estado = estadoInicial();
    this.ouvintes.forEach((fn) => fn(this.estado));
  }
}

export const rastreador = new Rastreador();

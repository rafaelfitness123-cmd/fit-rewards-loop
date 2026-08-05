// Camada de dados — 100% localStorage (protótipo)

export const KEYS = {
  admin: "academia_admin",
  clientes: "academia_clientes",
  treinos: "academia_treinos",
  qr: "academia_qr",
  pontos: "academia_pontos",
  missoes: "academia_missoes",
  progressoMissoes: "academia_progresso_missoes",
  recompensas: "academia_recompensas",
  resgates: "academia_resgates",
  configGamificacao: "academia_config_gamificacao",
  configDias: "academia_config_dias",
  historicoPontos: "academia_historico_pontos",
  avisos: "academia_avisos",
  sessao: "academia_sessao",
} as const;

export type Admin = { usuario: string; senha: string };

export type Cliente = {
  id: string;
  nome: string;
  cpf: string;
  senha: string;
  avatar?: string | undefined;
  criadoEm: string;
};

export type Treino = {
  id: string;
  clienteId: string;
  entrada: string; // ISO
  saida: string | null;
  pontosConcedidos: boolean;
  pontosEntrada: number;
  pontosSaida: number;
};

export type QRCodeItem = {
  id: string;
  codigo: string;
  nome: string;
  criadoEm: string;
  expiraEm: string | null;
  ativo: boolean;
};

export type MissaoTipo = "diaria" | "semanal" | "mensal" | "especial";
export type MissaoObjetivo = "treinos" | "dia_semana";

export type Missao = {
  id: string;
  nome: string;
  descricao: string;
  tipo: MissaoTipo;
  objetivo: MissaoObjetivo;
  diaSemana: number | null; // 0=Dom .. 6=Sáb (quando objetivo = dia_semana)
  quantidade: number;
  pontos: number;
  inicio: string | null; // YYYY-MM-DD
  fim: string | null;
  ativa: boolean;
};

export type ProgressoMissao = {
  id: string; // clienteId|missaoId|periodo
  clienteId: string;
  missaoId: string;
  periodo: string;
  progresso: number;
  concluida: boolean;
  concedida: boolean;
  atualizadoEm: string;
};

export type Recompensa = {
  id: string;
  nome: string;
  descricao: string;
  pontos: number;
  quantidade: number;
  ativa: boolean;
};

export type ResgateStatus = "solicitado" | "aprovado" | "entregue" | "cancelado";

export type Resgate = {
  id: string;
  clienteId: string;
  clienteNome: string;
  recompensaId: string;
  recompensaNome: string;
  pontos: number;
  data: string;
  status: ResgateStatus;
};

export type HistoricoPonto = {
  id: string;
  clienteId: string;
  delta: number;
  motivo: string;
  data: string;
};

export type BonusSequencia = { dias: number; pontos: number };

export type ConfigGamificacao = {
  pontosCheckin: number;
  usarCheckout: boolean;
  pontosCheckout: number;
  bonusSequencia: BonusSequencia[];
  minutosEntreTreinos: number;
};

export type ConfigDias = Record<string, number>; // "0".."6"

export type Aviso = {
  id: string;
  titulo: string;
  texto: string;
  data: string;
  destaque: boolean;
};

export type Sessao =
  | { tipo: "admin"; usuario: string }
  | { tipo: "cliente"; clienteId: string }
  | null;

const isBrowser = () => typeof window !== "undefined";

/**
 * Durante a primeira renderização no cliente devolvemos os mesmos valores que o
 * servidor usou (os fallbacks), evitando divergência de hidratação. Depois que
 * o app monta, `finishHydration()` libera a leitura real do localStorage.
 */
let hydrating = true;
export const finishHydration = () => {
  hydrating = false;
};

export function read<T>(key: string, fallback: T): T {
  if (!isBrowser() || hydrating) return fallback;
  try {
    const raw = window.localStorage.getItem(key);
    if (!raw) return fallback;
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}


export function write<T>(key: string, value: T) {
  if (!isBrowser()) return;
  window.localStorage.setItem(key, JSON.stringify(value));
  window.dispatchEvent(new CustomEvent("academia:update", { detail: key }));
}

export const uid = () =>
  Math.random().toString(36).slice(2, 10) + Date.now().toString(36);

export const DIAS = [
  "Domingo",
  "Segunda",
  "Terça",
  "Quarta",
  "Quinta",
  "Sexta",
  "Sábado",
];

export const DEFAULT_CONFIG_DIAS: ConfigDias = {
  "0": 70,
  "1": 10,
  "2": 10,
  "3": 10,
  "4": 20,
  "5": 30,
  "6": 50,
};

export const DEFAULT_CONFIG: ConfigGamificacao = {
  pontosCheckin: 0,
  usarCheckout: true,
  pontosCheckout: 5,
  bonusSequencia: [
    { dias: 3, pontos: 20 },
    { dias: 5, pontos: 50 },
    { dias: 7, pontos: 100 },
  ],
  minutosEntreTreinos: 60,
};

/** Cria os dados iniciais mínimos (1 admin + 1 cliente de teste). */
export function seed() {
  if (!isBrowser()) return;
  if (!window.localStorage.getItem(KEYS.admin)) {
    write<Admin>(KEYS.admin, { usuario: "admin", senha: "123" });
  }
  if (!window.localStorage.getItem(KEYS.clientes)) {
    write<Cliente[]>(KEYS.clientes, [
      {
        id: "cliente-teste",
        nome: "Cliente Teste",
        cpf: "12345678900",
        senha: "123",
        criadoEm: new Date().toISOString(),
      },
    ]);
  }
  const ensure = (key: string, value: unknown) => {
    if (!window.localStorage.getItem(key)) write(key, value);
  };
  ensure(KEYS.treinos, []);
  ensure(KEYS.qr, []);
  ensure(KEYS.pontos, {});
  ensure(KEYS.missoes, []);
  ensure(KEYS.progressoMissoes, []);
  ensure(KEYS.recompensas, []);
  ensure(KEYS.resgates, []);
  ensure(KEYS.historicoPontos, []);
  ensure(KEYS.avisos, []);
  ensure(KEYS.configDias, DEFAULT_CONFIG_DIAS);
  ensure(KEYS.configGamificacao, DEFAULT_CONFIG);
}

// ---- getters/setters tipados ----
export const getAdmin = () => read<Admin>(KEYS.admin, { usuario: "admin", senha: "123" });
export const setAdmin = (a: Admin) => write(KEYS.admin, a);

export const getClientes = () => read<Cliente[]>(KEYS.clientes, []);
export const setClientes = (c: Cliente[]) => write(KEYS.clientes, c);

export const getTreinos = () => read<Treino[]>(KEYS.treinos, []);
export const setTreinos = (t: Treino[]) => write(KEYS.treinos, t);

export const getQRs = () => read<QRCodeItem[]>(KEYS.qr, []);
export const setQRs = (q: QRCodeItem[]) => write(KEYS.qr, q);

export const getPontos = () => read<Record<string, number>>(KEYS.pontos, {});
export const setPontos = (p: Record<string, number>) => write(KEYS.pontos, p);

export const getMissoes = () => read<Missao[]>(KEYS.missoes, []);
export const setMissoes = (m: Missao[]) => write(KEYS.missoes, m);

export const getProgressos = () =>
  read<ProgressoMissao[]>(KEYS.progressoMissoes, []);
export const setProgressos = (p: ProgressoMissao[]) =>
  write(KEYS.progressoMissoes, p);

export const getRecompensas = () => read<Recompensa[]>(KEYS.recompensas, []);
export const setRecompensas = (r: Recompensa[]) => write(KEYS.recompensas, r);

export const getResgates = () => read<Resgate[]>(KEYS.resgates, []);
export const setResgates = (r: Resgate[]) => write(KEYS.resgates, r);

export const getHistorico = () => read<HistoricoPonto[]>(KEYS.historicoPontos, []);
export const setHistorico = (h: HistoricoPonto[]) => write(KEYS.historicoPontos, h);

export const getAvisos = () => read<Aviso[]>(KEYS.avisos, []);
export const setAvisos = (a: Aviso[]) => write(KEYS.avisos, a);

export const getConfigDias = () => ({
  ...DEFAULT_CONFIG_DIAS,
  ...read<ConfigDias>(KEYS.configDias, DEFAULT_CONFIG_DIAS),
});
export const setConfigDias = (c: ConfigDias) => write(KEYS.configDias, c);

export const getConfig = (): ConfigGamificacao => ({
  ...DEFAULT_CONFIG,
  ...read<Partial<ConfigGamificacao>>(KEYS.configGamificacao, {}),
});
export const setConfig = (c: ConfigGamificacao) => write(KEYS.configGamificacao, c);

export const getSessao = () => read<Sessao>(KEYS.sessao, null);
export const setSessao = (s: Sessao) => write(KEYS.sessao, s);

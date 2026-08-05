import {
  getConfig,
  getConfigDias,
  getHistorico,
  getMissoes,
  getPontos,
  getProgressos,
  getQRs,
  getTreinos,
  setHistorico,
  setPontos,
  setProgressos,
  setTreinos,
  uid,
  type HistoricoPonto,
  type Missao,
  type ProgressoMissao,
  type Treino,
} from "./db";

export const diaKey = (d: Date) =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(
    d.getDate(),
  ).padStart(2, "0")}`;

export function semanaKey(d: Date) {
  const t = new Date(d.getFullYear(), d.getMonth(), d.getDate());
  const dow = (t.getDay() + 6) % 7; // segunda = 0
  t.setDate(t.getDate() - dow);
  return `S${diaKey(t)}`;
}

export const mesKey = (d: Date) =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;

export function periodoDaMissao(m: Missao, d: Date) {
  switch (m.tipo) {
    case "diaria":
      return diaKey(d);
    case "semanal":
      return semanaKey(d);
    case "mensal":
      return mesKey(d);
    default:
      return "especial";
  }
}

export function inicioDoPeriodo(m: Missao, d: Date): Date | null {
  const base = new Date(d.getFullYear(), d.getMonth(), d.getDate());
  if (m.tipo === "diaria") return base;
  if (m.tipo === "semanal") {
    const t = new Date(base);
    t.setDate(t.getDate() - ((t.getDay() + 6) % 7));
    return t;
  }
  if (m.tipo === "mensal") return new Date(d.getFullYear(), d.getMonth(), 1);
  return m.inicio ? new Date(`${m.inicio}T00:00:00`) : null;
}

export function missaoVigente(m: Missao, d = new Date()) {
  if (!m.ativa) return false;
  const hoje = diaKey(d);
  if (m.inicio && hoje < m.inicio) return false;
  if (m.fim && hoje > m.fim) return false;
  return true;
}

// ---------- pontos ----------
export function addPontos(clienteId: string, delta: number, motivo: string) {
  if (!delta) return;
  const pontos = getPontos();
  pontos[clienteId] = Math.max(0, (pontos[clienteId] ?? 0) + delta);
  setPontos(pontos);
  const hist = getHistorico();
  const item: HistoricoPonto = {
    id: uid(),
    clienteId,
    delta,
    motivo,
    data: new Date().toISOString(),
  };
  setHistorico([item, ...hist]);
}

export const saldoDe = (clienteId: string) => getPontos()[clienteId] ?? 0;

export function historicoDe(clienteId: string) {
  return getHistorico().filter((h) => h.clienteId === clienteId);
}

// ---------- treinos / sequência ----------
export function treinosDe(clienteId: string) {
  return getTreinos()
    .filter((t) => t.clienteId === clienteId)
    .sort((a, b) => b.entrada.localeCompare(a.entrada));
}

export function treinoAberto(clienteId: string) {
  return getTreinos().find((t) => t.clienteId === clienteId && !t.saida) ?? null;
}

export function diasTreinados(clienteId: string) {
  const set = new Set(treinosDe(clienteId).map((t) => diaKey(new Date(t.entrada))));
  return Array.from(set).sort();
}

export function sequenciaAtual(clienteId: string) {
  const dias = diasTreinados(clienteId);
  if (!dias.length) return 0;
  const hoje = diaKey(new Date());
  const ontem = diaKey(new Date(Date.now() - 86400000));
  const ultimo = dias[dias.length - 1];
  if (ultimo !== hoje && ultimo !== ontem) return 0;
  let streak = 1;
  for (let i = dias.length - 1; i > 0; i--) {
    const atual = new Date(`${dias[i]}T00:00:00`).getTime();
    const anterior = new Date(`${dias[i - 1]}T00:00:00`).getTime();
    if (Math.round((atual - anterior) / 86400000) === 1) streak++;
    else break;
  }
  return streak;
}

export function maiorSequencia(clienteId: string) {
  const dias = diasTreinados(clienteId);
  let melhor = 0;
  let atual = 0;
  for (let i = 0; i < dias.length; i++) {
    if (i === 0) atual = 1;
    else {
      const diff = Math.round(
        (new Date(`${dias[i]}T00:00:00`).getTime() -
          new Date(`${dias[i - 1]}T00:00:00`).getTime()) /
          86400000,
      );
      atual = diff === 1 ? atual + 1 : 1;
    }
    melhor = Math.max(melhor, atual);
  }
  return melhor;
}

export function tempoTotalMinutos(clienteId: string) {
  return treinosDe(clienteId).reduce((acc, t) => acc + duracaoMinutos(t), 0);
}

export function duracaoMinutos(t: Treino) {
  if (!t.saida) return 0;
  return Math.max(
    0,
    Math.round(
      (new Date(t.saida).getTime() - new Date(t.entrada).getTime()) / 60000,
    ),
  );
}

export function formatarDuracao(min: number) {
  const h = Math.floor(min / 60);
  const m = min % 60;
  return h ? `${h}h ${m}min` : `${m}min`;
}

// ---------- missões ----------
export function progressoDaMissao(
  clienteId: string,
  m: Missao,
  ref = new Date(),
): ProgressoMissao {
  const periodo = periodoDaMissao(m, ref);
  const id = `${clienteId}|${m.id}|${periodo}`;
  const existente = getProgressos().find((p) => p.id === id);
  const calculado = calcularProgresso(clienteId, m, ref);
  return (
    existente ?? {
      id,
      clienteId,
      missaoId: m.id,
      periodo,
      progresso: calculado,
      concluida: calculado >= m.quantidade,
      concedida: false,
      atualizadoEm: new Date().toISOString(),
    }
  );
}

function calcularProgresso(clienteId: string, m: Missao, ref: Date) {
  const inicio = inicioDoPeriodo(m, ref);
  const limiteInicio = m.inicio ? new Date(`${m.inicio}T00:00:00`) : null;
  const limiteFim = m.fim ? new Date(`${m.fim}T23:59:59`) : null;
  const dias = new Set<string>();
  for (const t of treinosDe(clienteId)) {
    const d = new Date(t.entrada);
    if (inicio && d < inicio) continue;
    if (limiteInicio && d < limiteInicio) continue;
    if (limiteFim && d > limiteFim) continue;
    if (m.objetivo === "dia_semana" && m.diaSemana !== null && d.getDay() !== m.diaSemana)
      continue;
    dias.add(diaKey(d));
  }
  return dias.size;
}

/** Atualiza o progresso de todas as missões vigentes e concede recompensas 1x. */
export function avaliarMissoes(clienteId: string): string[] {
  const concluídas: string[] = [];
  const ref = new Date();
  const progressos = getProgressos();
  for (const m of getMissoes()) {
    if (!missaoVigente(m, ref)) continue;
    const periodo = periodoDaMissao(m, ref);
    const id = `${clienteId}|${m.id}|${periodo}`;
    const valor = calcularProgresso(clienteId, m, ref);
    const idx = progressos.findIndex((p) => p.id === id);
    const anterior = idx >= 0 ? progressos[idx] : null;
    const concluida = valor >= m.quantidade;
    const jaConcedida = anterior?.concedida ?? false;
    const registro: ProgressoMissao = {
      id,
      clienteId,
      missaoId: m.id,
      periodo,
      progresso: Math.min(valor, m.quantidade),
      concluida,
      concedida: jaConcedida || (concluida && m.pontos > 0),
      atualizadoEm: new Date().toISOString(),
    };
    if (idx >= 0) progressos[idx] = registro;
    else progressos.push(registro);
    if (concluida && !jaConcedida) {
      setProgressos([...progressos]);
      addPontos(clienteId, m.pontos, `Missão: ${m.nome}`);
      concluídas.push(`${m.nome} (+${m.pontos} pts)`);
    }
  }
  setProgressos([...progressos]);
  return concluídas;
}

// ---------- check-in / check-out ----------
export type ScanResultado = {
  ok: boolean;
  tipo: "entrada" | "saida" | "erro";
  mensagem: string;
  pontos?: number;
  detalhes?: string[];
};

export function validarQR(codigo: string) {
  const limpo = codigo.trim().toUpperCase();
  const qr = getQRs().find((q) => q.codigo.toUpperCase() === limpo);
  if (!qr) return { valido: false, motivo: "QR Code inválido." };
  if (!qr.ativo) return { valido: false, motivo: "Este QR Code está desativado." };
  if (qr.expiraEm && new Date(qr.expiraEm).getTime() < Date.now())
    return { valido: false, motivo: "Este QR Code expirou." };
  return { valido: true, motivo: "" };
}

export function registrarScan(clienteId: string, codigo: string): ScanResultado {
  const check = validarQR(codigo);
  if (!check.valido) return { ok: false, tipo: "erro", mensagem: check.motivo };

  const config = getConfig();
  const treinos = getTreinos();
  const aberto = treinos.find((t) => t.clienteId === clienteId && !t.saida);
  const agora = new Date();

  if (aberto) {
    // check-out
    const idx = treinos.findIndex((t) => t.id === aberto.id);
    let pontosSaida = 0;
    if (config.usarCheckout && config.pontosCheckout > 0) pontosSaida = config.pontosCheckout;
    treinos[idx] = { ...aberto, saida: agora.toISOString(), pontosSaida };
    setTreinos([...treinos]);
    if (pontosSaida) addPontos(clienteId, pontosSaida, "Check-out");
    const detalhes = avaliarMissoes(clienteId);
    const min = duracaoMinutos(treinos[idx]);
    return {
      ok: true,
      tipo: "saida",
      mensagem: `Saída registrada. Permanência: ${formatarDuracao(min)}`,
      pontos: pontosSaida,
      detalhes,
    };
  }

  // impedir novo treino logo após finalizar (evita duplicação de pontos)
  const ultimo = treinos
    .filter((t) => t.clienteId === clienteId && t.saida)
    .sort((a, b) => (b.saida ?? "").localeCompare(a.saida ?? ""))[0];
  if (ultimo?.saida) {
    const diffMin = (agora.getTime() - new Date(ultimo.saida).getTime()) / 60000;
    if (diffMin < config.minutosEntreTreinos) {
      const restante = Math.ceil(config.minutosEntreTreinos - diffMin);
      return {
        ok: false,
        tipo: "erro",
        mensagem: `Treino já finalizado. Aguarde ${restante} min para iniciar um novo treino.`,
      };
    }
  }

  const pontosDia = getConfigDias()[String(agora.getDay())] ?? 0;
  const pontosEntrada = pontosDia + (config.pontosCheckin ?? 0);
  const novo: Treino = {
    id: uid(),
    clienteId,
    entrada: agora.toISOString(),
    saida: null,
    pontosConcedidos: true,
    pontosEntrada,
    pontosSaida: 0,
  };
  setTreinos([novo, ...treinos]);
  if (pontosEntrada)
    addPontos(clienteId, pontosEntrada, `Treino de ${diaNome(agora.getDay())}`);

  const detalhes: string[] = [];
  // bônus de sequência (uma vez por dia/streak alcançado)
  const streak = sequenciaAtual(clienteId);
  const bonus = config.bonusSequencia
    .filter((b) => b.dias === streak && b.pontos > 0)
    .sort((a, b) => b.pontos - a.pontos)[0];
  if (bonus) {
    addPontos(clienteId, bonus.pontos, `Bônus de sequência (${bonus.dias} dias)`);
    detalhes.push(`Bônus de ${bonus.dias} dias seguidos (+${bonus.pontos} pts)`);
  }
  detalhes.push(...avaliarMissoes(clienteId));

  return {
    ok: true,
    tipo: "entrada",
    mensagem: `Entrada registrada! +${pontosEntrada} pontos`,
    pontos: pontosEntrada,
    detalhes,
  };
}

export const diaNome = (d: number) =>
  ["domingo", "segunda", "terça", "quarta", "quinta", "sexta", "sábado"][d];

// ---------- ranking ----------
export function ranking() {
  const pontos = getPontos();
  return Object.entries(pontos)
    .map(([clienteId, total]) => ({ clienteId, total }))
    .sort((a, b) => b.total - a.total);
}

export function posicaoNoRanking(clienteId: string, clientesIds: string[]) {
  const pontos = getPontos();
  const lista = clientesIds
    .map((id) => ({ id, total: pontos[id] ?? 0 }))
    .sort((a, b) => b.total - a.total);
  const idx = lista.findIndex((c) => c.id === clienteId);
  return idx >= 0 ? idx + 1 : lista.length;
}

export const fmtData = (iso: string) =>
  new Date(iso).toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit" });

export const fmtDataHora = (iso: string) =>
  new Date(iso).toLocaleString("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });

export const fmtHora = (iso: string) =>
  new Date(iso).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" });

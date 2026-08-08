import {
  getConfig,
  getCorridas,
  setCorridas,
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
  type Corrida,
  type Treino,
} from "./db";

export const diaKey = (d: Date) =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(
    2,
    "0",
  )}`;

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
  // cópia obrigatória: setPontos compara com o cache anterior para saber o que salvar
  const pontos = { ...getPontos() };
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
    Math.round((new Date(t.saida).getTime() - new Date(t.entrada).getTime()) / 60000),
  );
}

export function formatarDuracao(min: number) {
  const h = Math.floor(min / 60);
  const m = min % 60;
  return h ? `${h}h ${m}min` : `${m}min`;
}

// ---------- missões ----------
export function progressoDaMissao(clienteId: string, m: Missao, ref = new Date()): ProgressoMissao {
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
      aceita: m.objetivo !== "distancia",
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

  if (m.objetivo === "distancia") {
    let metros = 0;
    for (const c of getCorridas()) {
      if (c.clienteId !== clienteId) continue;
      if (c.missaoId !== m.id) continue;
      const d = new Date(c.iniciadaEm);
      if (inicio && d < inicio) continue;
      if (limiteInicio && d < limiteInicio) continue;
      if (limiteFim && d > limiteFim) continue;
      metros += c.distanciaM;
    }
    return Math.round(metros);
  }

  const dias = new Set<string>();
  for (const t of treinosDe(clienteId)) {
    const d = new Date(t.entrada);
    if (inicio && d < inicio) continue;
    if (limiteInicio && d < limiteInicio) continue;
    if (limiteFim && d > limiteFim) continue;
    if (m.objetivo === "dia_semana" && m.diaSemana !== null && d.getDay() !== m.diaSemana) continue;
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
    const idx = progressos.findIndex((p) => p.id === id);
    const anterior = idx >= 0 ? progressos[idx] : null;
    // Missões de distância só contam depois que o aluno aceita o desafio.
    if (m.objetivo === "distancia" && !anterior?.aceita) continue;
    const valor = calcularProgresso(clienteId, m, ref);
    const concluida = valor >= m.quantidade;
    const jaConcedida = anterior?.concedida ?? false;
    const registro: ProgressoMissao = {
      id,
      clienteId,
      missaoId: m.id,
      periodo,
      progresso: Math.min(valor, m.quantidade),
      aceita: anterior?.aceita ?? m.objetivo !== "distancia",
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

// ---------- QR rotativo ----------
/** O código exibido muda a cada 10 minutos (evita foto compartilhada). */
export const JANELA_MS = 10 * 60 * 1000;
export const janelaAtual = (t: number = Date.now()) => Math.floor(t / JANELA_MS);
export const msRestantesJanela = (t: number = Date.now()) => JANELA_MS - (t % JANELA_MS);
/** Token exibido no QR: código base + janela de tempo atual. */
export const tokenQR = (codigo: string, janela: number = janelaAtual()) =>
  `${codigo.toUpperCase()}.${janela.toString(36).toUpperCase()}`;

export function validarQR(entrada: string) {
  const limpo = entrada.trim().toUpperCase();
  const sep = limpo.lastIndexOf(".");
  if (sep <= 0)
    return {
      valido: false,
      motivo: "Código incompleto. Escaneie o QR Code que está na tela da recepção.",
    };
  const base = limpo.slice(0, sep);
  const janela = parseInt(limpo.slice(sep + 1), 36);
  const qr = getQRs().find((q) => q.codigo.toUpperCase() === base);
  if (!qr) return { valido: false, motivo: "QR Code inválido." };
  if (!qr.ativo) return { valido: false, motivo: "Este QR Code está desativado." };
  if (qr.expiraEm && new Date(qr.expiraEm).getTime() < Date.now())
    return { valido: false, motivo: "Este QR Code expirou." };
  if (!Number.isFinite(janela) || Math.abs(janelaAtual() - janela) > 1)
    return {
      valido: false,
      motivo:
        "Este código já mudou (ele é renovado a cada 10 minutos). Escaneie o QR Code atual da recepção.",
    };
  return { valido: true, motivo: "" };
}

/** Minutos que faltam para a meia-noite (liberação do próximo scan). */
function faltaParaMeiaNoite(agora = new Date()) {
  const amanha = new Date(agora.getFullYear(), agora.getMonth(), agora.getDate() + 1);
  return Math.max(1, Math.round((amanha.getTime() - agora.getTime()) / 60000));
}

export function registrarScan(clienteId: string, codigo: string): ScanResultado {
  const check = validarQR(codigo);
  if (!check.valido) return { ok: false, tipo: "erro", mensagem: check.motivo };

  const config = getConfig();
  const treinos = [...getTreinos()];
  const agora = new Date();
  const hoje = diaKey(agora);

  // Treino já finalizado hoje → bloqueado até a meia-noite.
  const finalizadoHoje = treinos.find(
    (t) => t.clienteId === clienteId && diaKey(new Date(t.entrada)) === hoje && t.saida,
  );
  if (finalizadoHoje) {
    return {
      ok: false,
      tipo: "erro",
      mensagem: `Você já fez entrada e saída hoje. Novo check-in liberado só à meia-noite (em ${formatarDuracao(faltaParaMeiaNoite(agora))}).`,
    };
  }

  const aberto = treinos.find((t) => t.clienteId === clienteId && !t.saida);

  // Treino aberto de outro dia: encerra sem pontos e segue como nova entrada.
  if (aberto && diaKey(new Date(aberto.entrada)) !== hoje) {
    const i = treinos.findIndex((t) => t.id === aberto.id);
    treinos[i] = { ...aberto, saida: aberto.entrada, pontosSaida: 0 };
    setTreinos([...treinos]);
    return registrarScan(clienteId, codigo);
  }

  if (aberto) {
    const minutos = Math.max(
      0,
      Math.round((agora.getTime() - new Date(aberto.entrada).getTime()) / 60000),
    );
    const minimo = Math.max(0, config.minutosMinimosTreino ?? 0);
    if (minutos < minimo) {
      const faltam = minimo - minutos;
      return {
        ok: false,
        tipo: "erro",
        mensagem: `Treino em andamento (${formatarDuracao(minutos)}). Faltam ${formatarDuracao(faltam)} para liberar a saída com pontos.`,
      };
    }

    // check-out válido → concede todos os pontos do dia de uma vez
    const pontosDia = getConfigDias()[String(new Date(aberto.entrada).getDay())] ?? 0;
    const pontosCheckin = config.pontosCheckin ?? 0;
    const pontosCheckout = config.usarCheckout ? (config.pontosCheckout ?? 0) : 0;
    const total = pontosDia + pontosCheckin + pontosCheckout;

    const idx = treinos.findIndex((t) => t.id === aberto.id);
    treinos[idx] = {
      ...aberto,
      saida: agora.toISOString(),
      pontosConcedidos: true,
      pontosEntrada: pontosDia + pontosCheckin,
      pontosSaida: pontosCheckout,
    };
    setTreinos([...treinos]);

    if (total > 0) {
      addPontos(clienteId, total, `Treino de ${diaNome(new Date(aberto.entrada).getDay())}`);
    }

    const detalhes: string[] = [];
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
      tipo: "saida",
      mensagem: `Saída registrada! Permanência: ${formatarDuracao(minutos)} — +${total} pontos`,
      pontos: total,
      detalhes,
    };
  }

  // check-in: apenas inicia o treino, sem pontos
  const novo: Treino = {
    id: uid(),
    clienteId,
    entrada: agora.toISOString(),
    saida: null,
    pontosConcedidos: false,
    pontosEntrada: 0,
    pontosSaida: 0,
  };
  setTreinos([novo, ...treinos]);

  const minimo = Math.max(0, config.minutosMinimosTreino ?? 0);
  return {
    ok: true,
    tipo: "entrada",
    mensagem: "Entrada registrada! Bom treino 💪",
    pontos: 0,
    detalhes: [
      minimo > 0
        ? `Fique pelo menos ${formatarDuracao(minimo)} e escaneie de novo na saída para receber os pontos do dia.`
        : "Escaneie de novo na saída para receber os pontos do dia.",
    ],
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

// ---------- missões de corrida (GPS) ----------
export function missaoAceita(clienteId: string, m: Missao) {
  return progressoDaMissao(clienteId, m).aceita;
}

/** Marca a missão como aceita pelo aluno (necessário para missões de distância). */
export function aceitarMissao(clienteId: string, m: Missao) {
  const ref = new Date();
  const periodo = periodoDaMissao(m, ref);
  const id = `${clienteId}|${m.id}|${periodo}`;
  const progressos = getProgressos();
  const idx = progressos.findIndex((p) => p.id === id);
  const base: ProgressoMissao = progressos[idx] ?? {
    id,
    clienteId,
    missaoId: m.id,
    periodo,
    progresso: 0,
    aceita: false,
    concluida: false,
    concedida: false,
    atualizadoEm: ref.toISOString(),
  };
  const atualizado = { ...base, aceita: true, atualizadoEm: ref.toISOString() };
  if (idx >= 0) progressos[idx] = atualizado;
  else progressos.push(atualizado);
  setProgressos([...progressos]);
}

/** Distância em metros entre dois pontos GPS (fórmula de Haversine). */
export function distanciaEntre(a: { lat: number; lng: number }, b: { lat: number; lng: number }) {
  const R = 6371000;
  const rad = (v: number) => (v * Math.PI) / 180;
  const dLat = rad(b.lat - a.lat);
  const dLng = rad(b.lng - a.lng);
  const s =
    Math.sin(dLat / 2) ** 2 + Math.cos(rad(a.lat)) * Math.cos(rad(b.lat)) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(s));
}

/** Salva a corrida concluída e reavalia as missões do aluno. */
export function registrarCorrida(
  clienteId: string,
  missaoId: string | null,
  distanciaM: number,
  duracaoS: number,
): string[] {
  const corrida: Corrida = {
    id: uid(),
    clienteId,
    missaoId,
    distanciaM: Math.round(distanciaM),
    duracaoS: Math.round(duracaoS),
    iniciadaEm: new Date(Date.now() - duracaoS * 1000).toISOString(),
    finalizadaEm: new Date().toISOString(),
  };
  setCorridas([corrida, ...getCorridas()]);
  return avaliarMissoes(clienteId);
}

export function corridasDe(clienteId: string) {
  return getCorridas().filter((c) => c.clienteId === clienteId);
}

export const fmtDistancia = (metros: number) =>
  metros >= 1000 ? `${(metros / 1000).toFixed(2)} km` : `${Math.round(metros)} m`;

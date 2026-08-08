// Camada de dados da Comunidade (rede social interna).
// Usa o mesmo cliente/auth do restante do PulseFit. Nada é simulado:
// publicações, curtidas e comentários vivem no banco; fotos no storage privado.
import { supabase } from "@/integrations/supabase/client";

const db = supabase as unknown as { from: (t: string) => any };

export type TipoPublicacao = "normal" | "missao";

/** Snapshot da missão gravado no post — o post nunca quebra se a missão mudar. */
export type MissaoSnapshot = {
  nome: string;
  /** caminhada | corrida | bicicleta | treino | repeticoes | frequencia | outro */
  atividade: string;
  objetivo?: string | undefined;
  distanciaM?: number | undefined;
  duracaoS?: number | undefined;
  quantidade?: number | undefined;
  meta?: number | undefined;
  unidade?: string | undefined;
  pontos?: number | undefined;
  concluidaEm?: string | undefined;
  trilha?: { lat: number; lng: number }[] | undefined;
};

export type Publicacao = {
  id: string;
  autorId: string;
  legenda: string;
  imagemPath: string | null;
  tipo: TipoPublicacao;
  missaoId: string | null;
  missao: MissaoSnapshot | null;
  criadoEm: string;
  curtidas: number;
  curtiuEu: boolean;
  comentarios: number;
};

export type Comentario = {
  id: string;
  publicacaoId: string;
  autorId: string;
  texto: string;
  criadoEm: string;
};

export const PAGINA = 8;

type Row = Record<string, unknown>;
const str = (v: unknown) => (v == null ? "" : String(v));

function mapPost(r: Row, meuId: string): Publicacao {
  const curtidas = (r["publicacao_curtidas"] ?? []) as Row[];
  const comentarios = (r["publicacao_comentarios"] ?? []) as Row[];
  return {
    id: str(r["id"]),
    autorId: str(r["autor_id"]),
    legenda: str(r["legenda"]),
    imagemPath: (r["imagem_path"] as string | null) ?? null,
    tipo: (str(r["tipo"]) || "normal") as TipoPublicacao,
    missaoId: (r["missao_id"] as string | null) ?? null,
    missao: (r["missao_dados"] as MissaoSnapshot | null) ?? null,
    criadoEm: str(r["created_at"]),
    curtidas: curtidas.length,
    curtiuEu: curtidas.some((c) => str(c["user_id"]) === meuId),
    comentarios: comentarios.length,
  };
}

const SELECT =
  "id, autor_id, legenda, imagem_path, tipo, missao_id, missao_dados, created_at, publicacao_curtidas(user_id), publicacao_comentarios(id)";

/** Feed paginado — mais recentes primeiro. */
export async function listarFeed(pagina: number, meuId: string): Promise<Publicacao[]> {
  const de = pagina * PAGINA;
  const { data, error } = await db
    .from("publicacoes")
    .select(SELECT)
    .order("created_at", { ascending: false })
    .range(de, de + PAGINA - 1);
  if (error) throw error;
  return ((data ?? []) as Row[]).map((r) => mapPost(r, meuId));
}

/** Publicações de um aluno (perfil). */
export async function listarDoAluno(
  autorId: string,
  pagina: number,
  meuId: string,
): Promise<Publicacao[]> {
  const de = pagina * PAGINA;
  const { data, error } = await db
    .from("publicacoes")
    .select(SELECT)
    .eq("autor_id", autorId)
    .order("created_at", { ascending: false })
    .range(de, de + PAGINA - 1);
  if (error) throw error;
  return ((data ?? []) as Row[]).map((r) => mapPost(r, meuId));
}

export async function obterPublicacao(id: string, meuId: string): Promise<Publicacao | null> {
  const { data, error } = await db.from("publicacoes").select(SELECT).eq("id", id).maybeSingle();
  if (error) throw error;
  return data ? mapPost(data as Row, meuId) : null;
}

export async function enviarFoto(arquivo: Blob, autorId: string): Promise<string> {
  const ext = arquivo.type.includes("png") ? "png" : "jpg";
  const caminho = `${autorId}/${Date.now()}-${Math.random().toString(16).slice(2)}.${ext}`;
  const { error } = await supabase.storage
    .from("publicacoes")
    .upload(caminho, arquivo, { contentType: arquivo.type || "image/jpeg", upsert: false });
  if (error) throw error;
  return caminho;
}

const urlsCache = new Map<string, { url: string; expira: number }>();

/** URLs assinadas — as fotos ficam em bucket privado (só alunos logados). */
export async function urlDaFoto(path: string): Promise<string | null> {
  const agora = Date.now();
  const cached = urlsCache.get(path);
  if (cached && cached.expira > agora) return cached.url;
  const { data, error } = await supabase.storage.from("publicacoes").createSignedUrl(path, 3600);
  if (error || !data?.signedUrl) return null;
  urlsCache.set(path, { url: data.signedUrl, expira: agora + 50 * 60 * 1000 });
  return data.signedUrl;
}

export async function criarPublicacao(entrada: {
  autorId: string;
  legenda: string;
  imagemPath?: string | null;
  tipo: TipoPublicacao;
  missaoId?: string | null;
  missao?: MissaoSnapshot | null;
}) {
  const { data, error } = await db
    .from("publicacoes")
    .insert({
      autor_id: entrada.autorId,
      legenda: entrada.legenda,
      imagem_path: entrada.imagemPath ?? null,
      tipo: entrada.tipo,
      missao_id: entrada.missaoId ?? null,
      missao_dados: entrada.missao ?? null,
    })
    .select("id")
    .single();
  if (error) throw error;
  return str((data as Row)["id"]);
}

export async function excluirPublicacao(id: string, imagemPath: string | null) {
  const { error } = await db.from("publicacoes").delete().eq("id", id);
  if (error) throw error;
  if (imagemPath) await supabase.storage.from("publicacoes").remove([imagemPath]);
}

export async function alternarCurtida(publicacaoId: string, userId: string, curtiu: boolean) {
  if (curtiu) {
    const { error } = await db
      .from("publicacao_curtidas")
      .delete()
      .eq("publicacao_id", publicacaoId)
      .eq("user_id", userId);
    if (error) throw error;
  } else {
    // A restrição única no banco garante no máximo 1 curtida por aluno.
    const { error } = await db
      .from("publicacao_curtidas")
      .upsert(
        { publicacao_id: publicacaoId, user_id: userId },
        { onConflict: "publicacao_id,user_id" },
      );
    if (error) throw error;
  }
}

export async function listarComentarios(publicacaoId: string): Promise<Comentario[]> {
  const { data, error } = await db
    .from("publicacao_comentarios")
    .select("*")
    .eq("publicacao_id", publicacaoId)
    .order("created_at", { ascending: true });
  if (error) throw error;
  return ((data ?? []) as Row[]).map((r) => ({
    id: str(r["id"]),
    publicacaoId: str(r["publicacao_id"]),
    autorId: str(r["autor_id"]),
    texto: str(r["texto"]),
    criadoEm: str(r["created_at"]),
  }));
}

export async function comentar(publicacaoId: string, autorId: string, texto: string) {
  const { error } = await db
    .from("publicacao_comentarios")
    .insert({ publicacao_id: publicacaoId, autor_id: autorId, texto });
  if (error) throw error;
}

export async function excluirComentario(id: string) {
  const { error } = await db.from("publicacao_comentarios").delete().eq("id", id);
  if (error) throw error;
}

/** Estrutura pronta para moderação futura. */
export async function denunciar(publicacaoId: string, userId: string, motivo: string) {
  const { error } = await db
    .from("publicacao_denuncias")
    .insert({ publicacao_id: publicacaoId, user_id: userId, motivo });
  if (error) throw error;
}

// -------- rascunho de compartilhamento de missão (memória da navegação) --------
const CHAVE_RASCUNHO = "pulsefit:comunidade:rascunho-missao";

export type RascunhoMissao = {
  missaoId: string | null;
  missao: MissaoSnapshot;
  legenda: string;
};

export function guardarRascunhoMissao(r: RascunhoMissao) {
  try {
    sessionStorage.setItem(CHAVE_RASCUNHO, JSON.stringify(r));
  } catch {
    /* storage indisponível */
  }
}

export function lerRascunhoMissao(): RascunhoMissao | null {
  try {
    const raw = sessionStorage.getItem(CHAVE_RASCUNHO);
    return raw ? (JSON.parse(raw) as RascunhoMissao) : null;
  } catch {
    return null;
  }
}

export function limparRascunhoMissao() {
  try {
    sessionStorage.removeItem(CHAVE_RASCUNHO);
  } catch {
    /* storage indisponível */
  }
}

// -------- formatação --------
export const fmtKm = (m: number) => `${(m / 1000).toFixed(2).replace(".", ",")} km`;

export function fmtTempoLongo(s: number) {
  const h = Math.floor(s / 3600);
  const min = Math.floor((s % 3600) / 60);
  const seg = Math.floor(s % 60);
  const p = (n: number) => String(n).padStart(2, "0");
  return h > 0 ? `${h}:${p(min)}:${p(seg)}` : `${p(min)}:${p(seg)}`;
}

/** Ritmo min/km. */
export function fmtRitmo(metros: number, segundos: number) {
  if (metros < 50 || segundos <= 0) return null;
  const minPorKm = segundos / 60 / (metros / 1000);
  const min = Math.floor(minPorKm);
  const seg = Math.round((minPorKm - min) * 60);
  return `${min}:${String(seg).padStart(2, "0")} min/km`;
}

/** Velocidade média km/h. */
export function fmtVelocidade(metros: number, segundos: number) {
  if (metros < 50 || segundos <= 0) return null;
  return `${(metros / 1000 / (segundos / 3600)).toFixed(1).replace(".", ",")} km/h`;
}

export function tempoRelativo(iso: string) {
  const d = new Date(iso);
  const diff = (Date.now() - d.getTime()) / 1000;
  if (diff < 60) return "agora";
  if (diff < 3600) return `há ${Math.floor(diff / 60)} min`;
  const hoje = new Date();
  const mesmoDia =
    d.getDate() === hoje.getDate() &&
    d.getMonth() === hoje.getMonth() &&
    d.getFullYear() === hoje.getFullYear();
  const hora = d.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" });
  if (mesmoDia) return `Hoje, ${hora}`;
  return `${d.toLocaleDateString("pt-BR")}, ${hora}`;
}

/** Sugestão de legenda automática (o aluno pode editar tudo). */
export function legendaSugerida(m: MissaoSnapshot) {
  const partes: string[] = ["Missão concluída! 🚀"];
  if (m.distanciaM && m.duracaoS) {
    partes.push(`Completei ${fmtKm(m.distanciaM)} em ${fmtTempoLongo(m.duracaoS)}.`);
  } else if (m.distanciaM) {
    partes.push(`Completei ${fmtKm(m.distanciaM)}.`);
  } else if (m.duracaoS) {
    partes.push(`Foram ${fmtTempoLongo(m.duracaoS)} de treino.`);
  } else if (m.quantidade != null && m.meta != null) {
    partes.push(`${m.quantidade}/${m.meta} ${m.unidade ?? ""} concluídos.`.replace("  ", " "));
  }
  partes.push(`"${m.nome}" — mais um desafio vencido no PulseFit! 💪🔥`);
  return partes.join("\n");
}

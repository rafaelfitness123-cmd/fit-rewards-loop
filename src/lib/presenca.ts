// Presença ao vivo em missões coletivas: envia a própria posição e busca
// os participantes que estão a até 100 m — sempre respeitando a preferência
// de privacidade do aluno.
import { supabase } from "@/integrations/supabase/client";

export const RAIO_PROXIMIDADE_M = 100;
export const INTERVALO_PRESENCA_MS = 7000;

export type Parceiro = {
  clienteId: string;
  nome: string;
  avatar: string | null;
  lat: number;
  lng: number;
  distanciaM: number;
};

const db = supabase as unknown as { from: (t: string) => any; rpc: (n: string, a?: unknown) => any };

/** Lê a preferência de compartilhamento de localização do aluno. */
export async function getCompartilharLocal(clienteId: string): Promise<boolean> {
  const { data, error } = await db
    .from("profiles")
    .select("compartilhar_local")
    .eq("id", clienteId)
    .maybeSingle();
  if (error) {
    console.error("[presenca:get]", error);
    return false;
  }
  return Boolean(data?.compartilhar_local);
}

/** Liga/desliga o compartilhamento de localização com outros alunos. */
export async function setCompartilharLocal(clienteId: string, valor: boolean) {
  const { error } = await db
    .from("profiles")
    .update({ compartilhar_local: valor })
    .eq("id", clienteId);
  if (error) {
    console.error("[presenca:set]", error);
    throw error;
  }
  if (!valor) await sairDaPresenca(clienteId);
}

/** Publica a posição atual do aluno na missão coletiva. */
export async function publicarPosicao(
  clienteId: string,
  missaoId: string,
  ponto: { lat: number; lng: number; accuracy?: number | null },
) {
  const { error } = await db.from("posicoes_ativas").upsert(
    {
      cliente_id: clienteId,
      missao_id: missaoId,
      lat: ponto.lat,
      lng: ponto.lng,
      precisao: Math.round(ponto.accuracy ?? 0),
      compartilhando: true,
      atualizado_em: new Date().toISOString(),
    },
    { onConflict: "cliente_id" },
  );
  if (error) console.error("[presenca:publicar]", error);
}

/** Remove a posição do aluno (ao parar/pausar a missão ou desligar o compartilhamento). */
export async function sairDaPresenca(clienteId: string) {
  const { error } = await db.from("posicoes_ativas").delete().eq("cliente_id", clienteId);
  if (error) console.error("[presenca:sair]", error);
}

/** Participantes da mesma missão a até `raio` metros de distância. */
export async function buscarParceiros(
  missaoId: string,
  raio = RAIO_PROXIMIDADE_M,
): Promise<Parceiro[]> {
  const { data, error } = await db.rpc("parceiros_proximos", {
    _missao_id: missaoId,
    _raio_m: raio,
  });
  if (error) {
    console.error("[presenca:parceiros]", error);
    return [];
  }
  return ((data ?? []) as Record<string, unknown>[]).map((r) => ({
    clienteId: String(r["cliente_id"]),
    nome: String(r["nome"] ?? ""),
    avatar: (r["avatar"] as string | null) ?? null,
    lat: Number(r["lat"]),
    lng: Number(r["lng"]),
    distanciaM: Number(r["distancia_m"] ?? 0),
  }));
}

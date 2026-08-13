// Sistema de "seguir" alunos da Companhia Fitness.
// Guarda quem segue quem e alimenta a preferência de visibilidade da
// localização em missões coletivas ("todos" ou "apenas quem eu sigo").
import { supabase } from "@/integrations/supabase/client";

const db = supabase as unknown as { from: (t: string) => any };

export type VisibilidadeLocal = "todos" | "seguindo";

/** IDs dos alunos que este aluno segue. */
export async function listarSeguindo(meuId: string): Promise<string[]> {
  const { data, error } = await db
    .from("seguidores")
    .select("seguido_id")
    .eq("seguidor_id", meuId);
  if (error) {
    console.error("[seguidores:seguindo]", error);
    return [];
  }
  return ((data ?? []) as Record<string, unknown>[]).map((r) => String(r["seguido_id"]));
}

/** IDs dos alunos que seguem este aluno. */
export async function listarSeguidores(alunoId: string): Promise<string[]> {
  const { data, error } = await db
    .from("seguidores")
    .select("seguidor_id")
    .eq("seguido_id", alunoId);
  if (error) {
    console.error("[seguidores:seguidores]", error);
    return [];
  }
  return ((data ?? []) as Record<string, unknown>[]).map((r) => String(r["seguidor_id"]));
}

export async function seguir(meuId: string, alunoId: string) {
  if (meuId === alunoId) return;
  const { error } = await db
    .from("seguidores")
    .upsert({ seguidor_id: meuId, seguido_id: alunoId }, { onConflict: "seguidor_id,seguido_id" });
  if (error) throw error;
}

export async function deixarDeSeguir(meuId: string, alunoId: string) {
  const { error } = await db
    .from("seguidores")
    .delete()
    .eq("seguidor_id", meuId)
    .eq("seguido_id", alunoId);
  if (error) throw error;
}

/** Quem pode ver minha localização no mapa das missões coletivas. */
export async function getVisibilidadeLocal(clienteId: string): Promise<VisibilidadeLocal> {
  const { data, error } = await db
    .from("profiles")
    .select("visibilidade_local")
    .eq("id", clienteId)
    .maybeSingle();
  if (error) {
    console.error("[seguidores:visibilidade]", error);
    return "todos";
  }
  return (String(data?.visibilidade_local ?? "todos") as VisibilidadeLocal) || "todos";
}

export async function setVisibilidadeLocal(clienteId: string, valor: VisibilidadeLocal) {
  const { error } = await db
    .from("profiles")
    .update({ visibilidade_local: valor })
    .eq("id", clienteId);
  if (error) throw error;
}

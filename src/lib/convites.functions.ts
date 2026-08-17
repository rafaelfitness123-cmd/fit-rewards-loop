import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

const novoToken = () =>
  Array.from(crypto.getRandomValues(new Uint8Array(16)))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");

/**
 * Convite vigente do admin. Reaproveita o link ainda válido; quando ele
 * expira (12 h), gera automaticamente um novo e apaga os vencidos.
 */
export const conviteAtual = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data: ehAdmin } = await context.supabase.rpc("has_role", {
      _user_id: context.userId,
      _role: "admin",
    });
    if (!ehAdmin) throw new Error("Apenas administradores podem gerar convites.");

    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const agora = new Date().toISOString();

    await supabaseAdmin.from("convites").delete().lt("expira_em", agora);

    const { data: vigentes } = await supabaseAdmin
      .from("convites")
      .select("token, expira_em")
      .gt("expira_em", agora)
      .order("expira_em", { ascending: false })
      .limit(1);

    const vigente = vigentes?.[0];
    if (vigente) return { token: vigente.token, expiraEm: vigente.expira_em };

    const expiraEm = new Date(Date.now() + 12 * 60 * 60 * 1000).toISOString();
    const { data: criado, error } = await supabaseAdmin
      .from("convites")
      .insert({ token: novoToken(), expira_em: expiraEm })
      .select("token, expira_em")
      .single();
    if (error || !criado) throw new Error("Não foi possível gerar o convite.");
    return { token: criado.token, expiraEm: criado.expira_em };
  });

/** Invalida o link atual e cria outro imediatamente. */
export const renovarConvite = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data: ehAdmin } = await context.supabase.rpc("has_role", {
      _user_id: context.userId,
      _role: "admin",
    });
    if (!ehAdmin) throw new Error("Apenas administradores podem gerar convites.");

    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    await supabaseAdmin.from("convites").delete().neq("token", "");

    const expiraEm = new Date(Date.now() + 12 * 60 * 60 * 1000).toISOString();
    const { data: criado, error } = await supabaseAdmin
      .from("convites")
      .insert({ token: novoToken(), expira_em: expiraEm })
      .select("token, expira_em")
      .single();
    if (error || !criado) throw new Error("Não foi possível gerar o convite.");
    return { token: criado.token, expiraEm: criado.expira_em };
  });

/** Verificação pública usada pela tela de cadastro. */
export const verificarConvite = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) => z.object({ token: z.string().min(8).max(64) }).parse(input))
  .handler(async ({ data }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: linhas } = await supabaseAdmin
      .from("convites")
      .select("expira_em")
      .eq("token", data.token)
      .gt("expira_em", new Date().toISOString())
      .limit(1);
    return { valido: Boolean(linhas && linhas.length > 0) };
  });

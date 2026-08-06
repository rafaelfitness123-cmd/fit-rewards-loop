import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

export const emailDoCpf = (cpf: string) =>
  `${cpf.replace(/\D/g, "")}@aluno.pulsefit.app`;
export const EMAIL_ADMIN = "admin@pulsefit.app";

/** Cria a conta padrão do administrador caso ainda não exista nenhuma. */
export const prepararAdmin = createServerFn({ method: "POST" }).handler(async () => {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  const { data: papeis } = await supabaseAdmin
    .from("user_roles")
    .select("id")
    .eq("role", "admin")
    .limit(1);
  if (papeis && papeis.length > 0) return { criado: false };

  const { data: criado, error } = await supabaseAdmin.auth.admin.createUser({
    email: EMAIL_ADMIN,
    password: "123456",
    email_confirm: true,
  });
  if (error || !criado.user) return { criado: false, erro: error?.message };

  await supabaseAdmin
    .from("profiles")
    .upsert({ id: criado.user.id, nome: "Administrador", cpf: "admin" });
  await supabaseAdmin
    .from("user_roles")
    .insert({ user_id: criado.user.id, role: "admin" });
  return { criado: true };
});

const clienteSchema = z.object({
  nome: z.string().min(1),
  cpf: z.string().min(3),
  senha: z.string().min(6),
  avatar: z.string().optional(),
});

async function garantirAdmin(context: { supabase: any; userId: string }) {
  const { data } = await context.supabase.rpc("has_role", {
    _user_id: context.userId,
    _role: "admin",
  });
  if (!data) throw new Error("Apenas administradores podem gerenciar alunos.");
}

export const criarCliente = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => clienteSchema.parse(input))
  .handler(async ({ data, context }) => {
    await garantirAdmin(context);
    const cpf = data.cpf.replace(/\D/g, "");
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: criado, error } = await supabaseAdmin.auth.admin.createUser({
      email: emailDoCpf(cpf),
      password: data.senha,
      email_confirm: true,
    });
    if (error || !criado.user) throw new Error(error?.message ?? "Falha ao criar aluno.");

    const { error: perfilErro } = await supabaseAdmin.from("profiles").upsert({
      id: criado.user.id,
      nome: data.nome,
      cpf,
      avatar: data.avatar || null,
      pontos: 0,
    });
    if (perfilErro) throw new Error(perfilErro.message);
    await supabaseAdmin
      .from("user_roles")
      .upsert({ user_id: criado.user.id, role: "cliente" }, { onConflict: "user_id,role" });
    return { id: criado.user.id };
  });

export const atualizarSenhaCliente = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) =>
    z.object({ id: z.string().uuid(), senha: z.string().min(6) }).parse(input),
  )
  .handler(async ({ data, context }) => {
    await garantirAdmin(context);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { error } = await supabaseAdmin.auth.admin.updateUserById(data.id, {
      password: data.senha,
    });
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const excluirCliente = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => z.object({ id: z.string().uuid() }).parse(input))
  .handler(async ({ data, context }) => {
    await garantirAdmin(context);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { error } = await supabaseAdmin.auth.admin.deleteUser(data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

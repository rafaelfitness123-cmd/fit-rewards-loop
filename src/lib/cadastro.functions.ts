import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

/** E-mail técnico derivado do CPF (mesma regra do login). */
const emailDoCpf = (cpf: string) => `${cpf.replace(/\D/g, "")}@aluno.pulsefit.app`;

const schema = z.object({
  nome: z.string().trim().min(2).max(80),
  cpf: z.string().min(11).max(20),
  senha: z.string().min(6).max(72),
  convite: z.string().min(8).max(64),
});

/**
 * Autocadastro público do aluno (link de convite). Cria a conta já confirmada
 * com o papel "cliente" — não concede nenhum privilégio administrativo.
 */
export const cadastrarAluno = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) => schema.parse(input))
  .handler(async ({ data }) => {
    const cpf = data.cpf.replace(/\D/g, "");
    if (cpf.length !== 11) throw new Error("Informe um CPF válido com 11 dígitos.");

    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    const { data: convites } = await supabaseAdmin
      .from("convites")
      .select("id")
      .eq("token", data.convite)
      .gt("expira_em", new Date().toISOString())
      .limit(1);
    if (!convites || convites.length === 0) {
      throw new Error("Este link de convite expirou. Peça um novo à academia.");
    }

    const { data: existente } = await supabaseAdmin
      .from("profiles")
      .select("id")
      .eq("cpf", cpf)
      .limit(1);
    if (existente && existente.length > 0) {
      throw new Error("Já existe uma conta com este CPF.");
    }

    const { data: criado, error } = await supabaseAdmin.auth.admin.createUser({
      email: emailDoCpf(cpf),
      password: data.senha,
      email_confirm: true,
    });
    if (error || !criado.user) {
      throw new Error(
        error?.message?.includes("already")
          ? "Já existe uma conta com este CPF."
          : (error?.message ?? "Não foi possível criar a conta."),
      );
    }

    const { error: perfilErro } = await supabaseAdmin.from("profiles").upsert({
      id: criado.user.id,
      nome: data.nome,
      cpf,
      pontos: 0,
    });
    if (perfilErro) throw new Error(perfilErro.message);

    await supabaseAdmin
      .from("user_roles")
      .upsert({ user_id: criado.user.id, role: "cliente" }, { onConflict: "user_id,role" });

    return { ok: true };
  });

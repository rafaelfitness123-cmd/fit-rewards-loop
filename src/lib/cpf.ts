export const soDigitos = (v: string) => v.replace(/\D/g, "");

/** Cada aluno entra com CPF; internamente vira um e-mail técnico. */
export const emailDoCpf = (cpf: string) => `${soDigitos(cpf)}@aluno.pulsefit.app`;

export const EMAIL_ADMIN = "admin@pulsefit.app";

import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Dumbbell, Loader2, ShieldAlert, UserPlus } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { cadastrarAluno } from "@/lib/cadastro.functions";
import { verificarConvite } from "@/lib/convites.functions";
import { emailDoCpf, soDigitos } from "@/lib/cpf";
import { recarregar } from "@/lib/session";

export const Route = createFileRoute("/cadastro")({
  validateSearch: (search: Record<string, unknown>) => ({
    c: typeof search['c'] === "string" ? (search['c'] as string) : "",
  }),
  head: () => ({
    meta: [
      { title: "Criar conta de aluno — PulseFit" },
      {
        name: "description",
        content:
          "Crie sua conta de aluno no PulseFit em segundos: CPF e senha para começar a pontuar.",
      },
      { property: "og:title", content: "Criar conta de aluno — PulseFit" },
      {
        property: "og:description",
        content: "Cadastro rápido do aluno: CPF e senha para entrar no app da academia.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Cadastro,
});

function Cadastro() {
  const navigate = useNavigate();
  const { c: convite } = Route.useSearch();
  const [valido, setValido] = useState<boolean | null>(null);
  const [nome, setNome] = useState("");
  const [cpf, setCpf] = useState("");
  const [senha, setSenha] = useState("");
  const [confirma, setConfirma] = useState("");
  const [carregando, setCarregando] = useState(false);

  useEffect(() => {
    if (!convite) {
      setValido(false);
      return;
    }
    void verificarConvite({ data: { token: convite } })
      .then((r) => setValido(r.valido))
      .catch(() => setValido(false));
  }, [convite]);

  const enviar = async (e: React.FormEvent) => {
    e.preventDefault();
    const doc = soDigitos(cpf);
    if (nome.trim().length < 2) {
      toast.error("Informe seu nome completo.");
      return;
    }
    if (doc.length !== 11) {
      toast.error("Informe um CPF válido (11 dígitos).");
      return;
    }
    if (senha.length < 6) {
      toast.error("A senha precisa ter ao menos 6 caracteres.");
      return;
    }
    if (senha !== confirma) {
      toast.error("As senhas não conferem.");
      return;
    }

    setCarregando(true);
    try {
      await cadastrarAluno({ data: { nome: nome.trim(), cpf: doc, senha } });
      const { error } = await supabase.auth.signInWithPassword({
        email: emailDoCpf(doc),
        password: senha,
      });
      if (error) throw new Error("Conta criada. Faça login com seu CPF.");
      await recarregar();
      toast.success("Conta criada! Bons treinos 💪");
      navigate({ to: "/app" });
    } catch (erro) {
      toast.error(erro instanceof Error ? erro.message : "Não foi possível criar a conta.");
    } finally {
      setCarregando(false);
    }
  };

  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-8 px-5 py-12">
      <header className="text-center">
        <div className="mx-auto flex size-16 items-center justify-center rounded-3xl bg-primary text-primary-foreground shadow-[var(--shadow-glow)]">
          <Dumbbell className="size-8" />
        </div>
        <h1 className="mt-5 text-3xl font-black tracking-tight">Criar conta de aluno</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Cadastre-se pelo link da academia e comece a pontuar hoje.
        </p>
      </header>

      <div className="surface w-full max-w-sm p-5">
        <form onSubmit={enviar} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="nome">Nome completo</Label>
            <Input id="nome" value={nome} onChange={(e) => setNome(e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="cpf">CPF</Label>
            <Input
              id="cpf"
              inputMode="numeric"
              placeholder="00000000000"
              value={cpf}
              onChange={(e) => setCpf(e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="senha">Senha</Label>
            <Input
              id="senha"
              type="password"
              value={senha}
              onChange={(e) => setSenha(e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="confirma">Confirmar senha</Label>
            <Input
              id="confirma"
              type="password"
              value={confirma}
              onChange={(e) => setConfirma(e.target.value)}
            />
          </div>
          <Button type="submit" className="w-full font-bold" disabled={carregando}>
            {carregando ? (
              <Loader2 className="mr-2 size-4 animate-spin" />
            ) : (
              <UserPlus className="mr-2 size-4" />
            )}
            Criar minha conta
          </Button>
          <p className="text-center text-xs text-muted-foreground">
            Já tem conta?{" "}
            <Link to="/" className="font-semibold text-primary underline">
              Entrar
            </Link>
          </p>
        </form>
      </div>
    </main>
  );
}

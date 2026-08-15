import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Dumbbell, Flame, Loader2, ShieldCheck, Trophy } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { supabase } from "@/integrations/supabase/client";
import { EMAIL_ADMIN, emailDoCpf } from "@/lib/cpf";
import { prepararAdmin } from "@/lib/contas.functions";
import { iniciarDados, recarregar, useSessao } from "@/lib/session";
import { toast } from "sonner";
import BotaoInstalar from "@/components/BotaoInstalar";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "PulseFit — App da Academia com Pontos e Missões" },
      {
        name: "description",
        content:
          "Entre no app da academia: check-in por QR Code, pontos, missões diárias, ranking e recompensas.",
      },
      { property: "og:title", content: "PulseFit — App da Academia" },
      {
        property: "og:description",
        content:
          "Check-in por QR Code, gamificação com pontos, missões, ranking e resgate de recompensas.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Login,
});

function Login() {
  const navigate = useNavigate();
  const sessao = useSessao();
  const [cpf, setCpf] = useState("");
  const [senhaCliente, setSenhaCliente] = useState("");
  const [usuario, setUsuario] = useState("admin");
  const [senhaAdmin, setSenhaAdmin] = useState("");
  const [carregando, setCarregando] = useState(false);

  useEffect(() => {
    iniciarDados();
    void prepararAdmin().catch(() => {});
  }, []);

  useEffect(() => {
    if (sessao?.tipo === "cliente") navigate({ to: "/app" });
    if (sessao?.tipo === "admin") navigate({ to: "/admin" });
  }, [sessao, navigate]);

  const entrar = async (email: string, senha: string, destino: "/app" | "/admin") => {
    setCarregando(true);
    const { error } = await supabase.auth.signInWithPassword({ email, password: senha });
    if (error) {
      setCarregando(false);
      toast.error("Dados de acesso inválidos.");
      return;
    }
    await recarregar();
    setCarregando(false);
    navigate({ to: destino });
  };

  const entrarCliente = (e: React.FormEvent) => {
    e.preventDefault();
    void entrar(emailDoCpf(cpf), senhaCliente, "/app");
  };

  const entrarAdmin = (e: React.FormEvent) => {
    e.preventDefault();
    const email = usuario.includes("@") ? usuario.trim() : EMAIL_ADMIN;
    void entrar(email, senhaAdmin, "/admin");
  };

  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-8 px-5 py-12">
      <header className="text-center">
        <div className="mx-auto flex size-16 items-center justify-center rounded-3xl bg-primary text-primary-foreground shadow-[var(--shadow-glow)]">
          <Dumbbell className="size-8" />
        </div>
        <h1 className="mt-5 text-4xl font-black tracking-tight">PulseFit</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Treine, pontue e suba no ranking da sua academia.
        </p>
        <div className="mt-4 flex flex-wrap justify-center gap-4 text-xs text-muted-foreground">
          <span className="flex items-center gap-1">
            <Flame className="size-3.5 text-flame" /> Sequências
          </span>
          <span className="flex items-center gap-1">
            <Trophy className="size-3.5 text-gold" /> Ranking
          </span>
          <span className="flex items-center gap-1">
            <ShieldCheck className="size-3.5 text-primary" /> Check-in QR
          </span>
        </div>
      </header>

      <div className="surface w-full max-w-sm p-5">
        <Tabs defaultValue="cliente">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="cliente">Aluno</TabsTrigger>
            <TabsTrigger value="admin">Administrador</TabsTrigger>
          </TabsList>

          <TabsContent value="cliente">
            <form onSubmit={entrarCliente} className="space-y-4 pt-4">
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
                  value={senhaCliente}
                  onChange={(e) => setSenhaCliente(e.target.value)}
                />
              </div>
              <Button type="submit" className="w-full font-bold" disabled={carregando}>
                {carregando && <Loader2 className="mr-2 size-4 animate-spin" />}
                Entrar
              </Button>
              <Link
                to="/cadastro"
                className="block rounded-md border border-border py-2.5 text-center text-sm font-bold text-primary"
              >
                Criar minha conta
              </Link>
              <p className="text-center text-xs text-muted-foreground">
                Recebeu o link da academia? Crie sua conta em 30 segundos.
              </p>
            </form>
          </TabsContent>

          <TabsContent value="admin">
            <form onSubmit={entrarAdmin} className="space-y-4 pt-4">
              <div className="space-y-2">
                <Label htmlFor="usuario">Usuário</Label>
                <Input
                  id="usuario"
                  value={usuario}
                  onChange={(e) => setUsuario(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="senhaAdmin">Senha</Label>
                <Input
                  id="senhaAdmin"
                  type="password"
                  value={senhaAdmin}
                  onChange={(e) => setSenhaAdmin(e.target.value)}
                />
              </div>
              <Button type="submit" className="w-full font-bold" disabled={carregando}>
                {carregando && <Loader2 className="mr-2 size-4 animate-spin" />}
                Acessar painel
              </Button>
              <p className="text-center text-xs text-muted-foreground">
                Acesso inicial: admin · 123456
              </p>
            </form>
          </TabsContent>
        </Tabs>
      </div>

      <div className="w-full max-w-sm">
        <BotaoInstalar />
      </div>
    </main>
  );
}

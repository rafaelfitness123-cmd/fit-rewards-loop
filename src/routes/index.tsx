import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Dumbbell, Flame, ShieldCheck, Trophy } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { getAdmin, getClientes, getSessao, seed, setSessao } from "@/lib/db";
import { toast } from "sonner";

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
    ],
  }),
  component: Login,
});

function Login() {
  const navigate = useNavigate();
  const [cpf, setCpf] = useState("");
  const [senhaCliente, setSenhaCliente] = useState("");
  const [usuario, setUsuario] = useState("");
  const [senhaAdmin, setSenhaAdmin] = useState("");

  useEffect(() => {
    seed();
    const s = getSessao();
    if (s?.tipo === "cliente") navigate({ to: "/app" });
    if (s?.tipo === "admin") navigate({ to: "/admin" });
  }, [navigate]);

  const entrarCliente = (e: React.FormEvent) => {
    e.preventDefault();
    const limpo = cpf.replace(/\D/g, "");
    const cliente = getClientes().find(
      (c) => c.cpf.replace(/\D/g, "") === limpo && c.senha === senhaCliente,
    );
    if (!cliente) {
      toast.error("CPF ou senha inválidos.");
      return;
    }
    setSessao({ tipo: "cliente", clienteId: cliente.id });
    navigate({ to: "/app" });
  };

  const entrarAdmin = (e: React.FormEvent) => {
    e.preventDefault();
    const admin = getAdmin();
    if (usuario !== admin.usuario || senhaAdmin !== admin.senha) {
      toast.error("Usuário ou senha inválidos.");
      return;
    }
    setSessao({ tipo: "admin", usuario: admin.usuario });
    navigate({ to: "/admin" });
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
        <div className="mt-4 flex justify-center gap-4 text-xs text-muted-foreground">
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

      <div className="w-full max-w-sm surface p-5">
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
              <Button type="submit" className="w-full font-bold">
                Entrar
              </Button>
              <p className="text-center text-xs text-muted-foreground">
                Teste: CPF 12345678900 · senha 123
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
              <Button type="submit" className="w-full font-bold">
                Acessar painel
              </Button>
              <p className="text-center text-xs text-muted-foreground">
                Teste: admin · 123
              </p>
            </form>
          </TabsContent>
        </Tabs>
      </div>
    </main>
  );
}

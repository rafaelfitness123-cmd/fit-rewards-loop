import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Pencil, Trash2, UserPlus } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  getClientes,
  getPontos,
  setClientes,
  setPontos,
  uid,
  type Cliente,
} from "@/lib/db";
import { useStore } from "@/lib/session";
import { sequenciaAtual, treinosDe } from "@/lib/gamificacao";

export const Route = createFileRoute("/admin/clientes")({
  head: () => ({
    meta: [
      { title: "Clientes — Painel PulseFit" },
      {
        name: "description",
        content: "Cadastre e gerencie os alunos da academia.",
      },
      { property: "og:title", content: "Clientes — Painel PulseFit" },
      {
        property: "og:description",
        content: "Cadastro, edição e exclusão de alunos com pontos e treinos.",
      },
    ],
  }),
  component: ClientesAdmin,
});

const vazio = { nome: "", cpf: "", senha: "", avatar: "" };

function ClientesAdmin() {
  const [lista, refresh] = useStore(() =>
    getClientes().map((c) => ({
      ...c,
      pontos: getPontos()[c.id] ?? 0,
      treinos: treinosDe(c.id).length,
      streak: sequenciaAtual(c.id),
    })),
  );
  const [aberto, setAberto] = useState(false);
  const [editando, setEditando] = useState<Cliente | null>(null);
  const [form, setForm] = useState(vazio);

  const abrirNovo = () => {
    setEditando(null);
    setForm(vazio);
    setAberto(true);
  };

  const abrirEdicao = (c: Cliente) => {
    setEditando(c);
    setForm({ nome: c.nome, cpf: c.cpf, senha: c.senha, avatar: c.avatar ?? "" });
    setAberto(true);
  };

  const salvar = () => {
    const cpf = form.cpf.replace(/\D/g, "");
    if (!form.nome.trim() || !cpf || !form.senha) {
      toast.error("Preencha nome, CPF e senha.");
      return;
    }
    const clientes = getClientes();
    if (clientes.some((c) => c.cpf.replace(/\D/g, "") === cpf && c.id !== editando?.id)) {
      toast.error("Já existe um cliente com este CPF.");
      return;
    }
    if (editando) {
      setClientes(
        clientes.map((c) =>
          c.id === editando.id
            ? { ...c, nome: form.nome.trim(), cpf, senha: form.senha, avatar: form.avatar }
            : c,
        ),
      );
      toast.success("Cliente atualizado.");
    } else {
      const novo: Cliente = {
        id: uid(),
        nome: form.nome.trim(),
        cpf,
        senha: form.senha,
        avatar: form.avatar || undefined,
        criadoEm: new Date().toISOString(),
      };
      setClientes([...clientes, novo]);
      const pontos = getPontos();
      pontos[novo.id] = pontos[novo.id] ?? 0;
      setPontos(pontos);
      toast.success("Cliente cadastrado.");
    }
    setAberto(false);
    refresh();
  };

  const excluir = (id: string) => {
    setClientes(getClientes().filter((c) => c.id !== id));
    const pontos = getPontos();
    delete pontos[id];
    setPontos(pontos);
    refresh();
    toast.success("Cliente removido.");
  };

  return (
    <div className="space-y-6">
      <header className="flex items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-black">Clientes</h1>
          <p className="text-sm text-muted-foreground">{lista.length} cadastrados</p>
        </div>
        <Dialog open={aberto} onOpenChange={setAberto}>
          <DialogTrigger asChild>
            <Button className="font-bold" onClick={abrirNovo}>
              <UserPlus className="mr-2 size-4" /> Novo cliente
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{editando ? "Editar cliente" : "Novo cliente"}</DialogTitle>
            </DialogHeader>
            <div className="space-y-3">
              <div className="space-y-2">
                <Label>Nome</Label>
                <Input
                  value={form.nome}
                  onChange={(e) => setForm({ ...form, nome: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label>CPF</Label>
                <Input
                  inputMode="numeric"
                  value={form.cpf}
                  onChange={(e) => setForm({ ...form, cpf: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label>Senha</Label>
                <Input
                  value={form.senha}
                  onChange={(e) => setForm({ ...form, senha: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label>URL do avatar (opcional)</Label>
                <Input
                  value={form.avatar}
                  onChange={(e) => setForm({ ...form, avatar: e.target.value })}
                />
              </div>
            </div>
            <DialogFooter>
              <Button className="font-bold" onClick={salvar}>
                Salvar
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </header>

      <section className="space-y-2">
        {lista.map((c) => (
          <div key={c.id} className="surface flex items-center gap-3 p-4">
            <div className="flex-1">
              <p className="font-semibold">{c.nome}</p>
              <p className="text-xs text-muted-foreground">
                CPF {c.cpf} · {c.pontos} pts · {c.treinos} treinos · 🔥 {c.streak}
              </p>
            </div>
            <Button variant="ghost" size="icon" onClick={() => abrirEdicao(c)}>
              <Pencil className="size-4" />
            </Button>
            <Button variant="ghost" size="icon" onClick={() => excluir(c.id)}>
              <Trash2 className="size-4 text-destructive" />
            </Button>
          </div>
        ))}
      </section>
    </div>
  );
}

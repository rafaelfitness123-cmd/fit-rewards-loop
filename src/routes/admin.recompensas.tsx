import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Pencil, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { getRecompensas, setRecompensas, uid, type Recompensa } from "@/lib/db";
import { useStore } from "@/lib/session";

export const Route = createFileRoute("/admin/recompensas")({
  head: () => ({
    meta: [
      { title: "Recompensas — Painel PulseFit" },
      {
        name: "description",
        content: "Cadastre recompensas resgatáveis com pontos pelos alunos.",
      },
      { property: "og:title", content: "Recompensas — Painel PulseFit" },
      {
        property: "og:description",
        content: "Nome, descrição, custo em pontos e estoque totalmente editáveis.",
      },
    ],
  }),
  component: RecompensasAdmin,
});

type Form = Omit<Recompensa, "id">;
const vazio: Form = { nome: "", descricao: "", pontos: 500, quantidade: 10, ativa: true };

function RecompensasAdmin() {
  const [lista, refresh] = useStore(() => getRecompensas());
  const [aberto, setAberto] = useState(false);
  const [editando, setEditando] = useState<Recompensa | null>(null);
  const [form, setForm] = useState<Form>(vazio);

  const salvar = () => {
    if (!form.nome.trim()) {
      toast.error("Informe o nome da recompensa.");
      return;
    }
    const dados: Form = {
      ...form,
      nome: form.nome.trim(),
      descricao: form.descricao.trim(),
      pontos: Math.max(0, Number(form.pontos) || 0),
      quantidade: Math.max(0, Number(form.quantidade) || 0),
    };
    if (editando) {
      setRecompensas(
        getRecompensas().map((r) => (r.id === editando.id ? { ...dados, id: r.id } : r)),
      );
      toast.success("Recompensa atualizada.");
    } else {
      setRecompensas([{ ...dados, id: uid() }, ...getRecompensas()]);
      toast.success("Recompensa criada.");
    }
    setAberto(false);
    refresh();
  };

  return (
    <div className="space-y-6">
      <header className="flex items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-black">Recompensas</h1>
          <p className="text-sm text-muted-foreground">{lista.length} cadastradas</p>
        </div>
        <Button
          className="font-bold"
          onClick={() => {
            setEditando(null);
            setForm(vazio);
            setAberto(true);
          }}
        >
          <Plus className="mr-1 size-4" /> Criar recompensa
        </Button>
      </header>

      <section className="space-y-2">
        {lista.length === 0 && (
          <p className="surface p-4 text-sm text-muted-foreground">
            Nenhuma recompensa cadastrada.
          </p>
        )}
        {lista.map((r) => (
          <div key={r.id} className="surface flex items-center gap-3 p-4">
            <div className="flex-1">
              <p className="font-semibold">{r.nome}</p>
              <p className="text-xs text-muted-foreground">{r.descricao}</p>
              <p className="mt-1 text-[11px] text-muted-foreground">
                {r.pontos} pontos · estoque {r.quantidade}
              </p>
            </div>
            <Switch
              checked={r.ativa}
              onCheckedChange={() => {
                setRecompensas(
                  getRecompensas().map((x) =>
                    x.id === r.id ? { ...x, ativa: !x.ativa } : x,
                  ),
                );
                refresh();
              }}
            />
            <Button
              variant="ghost"
              size="icon"
              onClick={() => {
                setEditando(r);
                const { id: _id, ...resto } = r;
                setForm(resto);
                setAberto(true);
              }}
            >
              <Pencil className="size-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => {
                setRecompensas(getRecompensas().filter((x) => x.id !== r.id));
                refresh();
              }}
            >
              <Trash2 className="size-4 text-destructive" />
            </Button>
          </div>
        ))}
      </section>

      <Dialog open={aberto} onOpenChange={setAberto}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {editando ? "Editar recompensa" : "Nova recompensa"}
            </DialogTitle>
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
              <Label>Descrição</Label>
              <Textarea
                value={form.descricao}
                onChange={(e) => setForm({ ...form, descricao: e.target.value })}
              />
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="space-y-2">
                <Label>Pontos necessários</Label>
                <Input
                  type="number"
                  min={0}
                  value={form.pontos}
                  onChange={(e) => setForm({ ...form, pontos: Number(e.target.value) })}
                />
              </div>
              <div className="space-y-2">
                <Label>Quantidade disponível</Label>
                <Input
                  type="number"
                  min={0}
                  value={form.quantidade}
                  onChange={(e) =>
                    setForm({ ...form, quantidade: Number(e.target.value) })
                  }
                />
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Switch
                checked={form.ativa}
                onCheckedChange={(v) => setForm({ ...form, ativa: v })}
              />
              <span className="text-sm">Recompensa ativa</span>
            </div>
          </div>
          <DialogFooter>
            <Button className="font-bold" onClick={salvar}>
              Salvar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

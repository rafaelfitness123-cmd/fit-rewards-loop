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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  DIAS,
  getMissoes,
  setMissoes,
  uid,
  type Missao,
  type MissaoObjetivo,
  type MissaoTipo,
} from "@/lib/db";
import { useStore } from "@/lib/session";

export const Route = createFileRoute("/admin/missoes")({
  head: () => ({
    meta: [
      { title: "Gerenciar Missões — Painel PulseFit" },
      {
        name: "description",
        content: "Crie, edite, ative e exclua missões diárias, semanais e especiais.",
      },
      { property: "og:title", content: "Gerenciar Missões — Painel PulseFit" },
      {
        property: "og:description",
        content: "Missões totalmente configuráveis com recompensa em pontos.",
      },
    ],
  }),
  component: MissoesAdmin,
});

type Form = Omit<Missao, "id">;

const vazio: Form = {
  nome: "",
  descricao: "",
  tipo: "semanal",
  objetivo: "treinos",
  diaSemana: null,
  quantidade: 3,
  pontos: 100,
  inicio: null,
  fim: null,
  ativa: true,
};

function MissoesAdmin() {
  const [lista, refresh] = useStore(() => getMissoes());
  const [aberto, setAberto] = useState(false);
  const [editando, setEditando] = useState<Missao | null>(null);
  const [form, setForm] = useState<Form>(vazio);

  const abrirNovo = () => {
    setEditando(null);
    setForm(vazio);
    setAberto(true);
  };

  const abrirEdicao = (m: Missao) => {
    setEditando(m);
    const { id: _id, ...resto } = m;
    setForm(resto);
    setAberto(true);
  };

  const salvar = () => {
    if (!form.nome.trim()) {
      toast.error("Informe o nome da missão.");
      return;
    }
    const dados: Form = {
      ...form,
      nome: form.nome.trim(),
      descricao: form.descricao.trim(),
      quantidade: Math.max(1, Number(form.quantidade) || 1),
      pontos: Math.max(0, Number(form.pontos) || 0),
      diaSemana: form.objetivo === "dia_semana" ? (form.diaSemana ?? 6) : null,
    };
    if (editando) {
      setMissoes(getMissoes().map((m) => (m.id === editando.id ? { ...dados, id: m.id } : m)));
      toast.success("Missão atualizada.");
    } else {
      setMissoes([{ ...dados, id: uid() }, ...getMissoes()]);
      toast.success("Missão criada.");
    }
    setAberto(false);
    refresh();
  };

  const alternar = (id: string) => {
    setMissoes(getMissoes().map((m) => (m.id === id ? { ...m, ativa: !m.ativa } : m)));
    refresh();
  };

  const excluir = (id: string) => {
    setMissoes(getMissoes().filter((m) => m.id !== id));
    refresh();
  };

  return (
    <div className="space-y-6">
      <header className="flex items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-black">Gerenciar Missões</h1>
          <p className="text-sm text-muted-foreground">{lista.length} missões</p>
        </div>
        <Button className="font-bold" onClick={abrirNovo}>
          <Plus className="mr-1 size-4" /> Criar missão
        </Button>
      </header>

      <section className="space-y-2">
        {lista.length === 0 && (
          <p className="surface p-4 text-sm text-muted-foreground">
            Nenhuma missão cadastrada.
          </p>
        )}
        {lista.map((m) => (
          <div key={m.id} className="surface flex items-center gap-3 p-4">
            <div className="flex-1">
              <p className="font-semibold">{m.nome}</p>
              <p className="text-xs text-muted-foreground">{m.descricao}</p>
              <p className="mt-1 text-[11px] text-muted-foreground">
                {m.tipo} ·{" "}
                {m.objetivo === "dia_semana"
                  ? `treinar ${m.quantidade}x em ${DIAS[m.diaSemana ?? 6]}`
                  : m.objetivo === "distancia"
                    ? `percorrer ${(m.quantidade / 1000).toFixed(2)} km`
                    : `${m.quantidade} treinos`}{" "}
                · +{m.pontos} pts
                {m.inicio ? ` · de ${m.inicio}` : ""}
                {m.fim ? ` até ${m.fim}` : ""}
              </p>
            </div>
            <Switch checked={m.ativa} onCheckedChange={() => alternar(m.id)} />
            <Button variant="ghost" size="icon" onClick={() => abrirEdicao(m)}>
              <Pencil className="size-4" />
            </Button>
            <Button variant="ghost" size="icon" onClick={() => excluir(m.id)}>
              <Trash2 className="size-4 text-destructive" />
            </Button>
          </div>
        ))}
      </section>

      <Dialog open={aberto} onOpenChange={setAberto}>
        <DialogContent className="max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editando ? "Editar missão" : "Nova missão"}</DialogTitle>
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
                <Label>Tipo</Label>
                <Select
                  value={form.tipo}
                  onValueChange={(v) => setForm({ ...form, tipo: v as MissaoTipo })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="diaria">Diária</SelectItem>
                    <SelectItem value="semanal">Semanal</SelectItem>
                    <SelectItem value="mensal">Mensal</SelectItem>
                    <SelectItem value="especial">Especial</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Objetivo</Label>
                <Select
                  value={form.objetivo}
                  onValueChange={(v) =>
                    setForm({ ...form, objetivo: v as MissaoObjetivo })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="treinos">Quantidade de treinos</SelectItem>
                    <SelectItem value="dia_semana">Treinar em um dia específico</SelectItem>
                    <SelectItem value="distancia">Correr/caminhar distância (GPS)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            {form.objetivo === "dia_semana" && (
              <div className="space-y-2">
                <Label>Dia da semana</Label>
                <Select
                  value={String(form.diaSemana ?? 6)}
                  onValueChange={(v) => setForm({ ...form, diaSemana: Number(v) })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {DIAS.map((d, i) => (
                      <SelectItem key={d} value={String(i)}>
                        {d}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="space-y-2">
                <Label>
                  {form.objetivo === "distancia"
                    ? "Distância necessária (metros)"
                    : "Quantidade necessária"}
                </Label>
                <Input
                  type="number"
                  min={1}
                  value={form.quantidade}
                  onChange={(e) =>
                    setForm({ ...form, quantidade: Number(e.target.value) })
                  }
                />
              </div>
              <div className="space-y-2">
                <Label>Recompensa (pontos)</Label>
                <Input
                  type="number"
                  min={0}
                  value={form.pontos}
                  onChange={(e) => setForm({ ...form, pontos: Number(e.target.value) })}
                />
              </div>
              <div className="space-y-2">
                <Label>Início</Label>
                <Input
                  type="date"
                  value={form.inicio ?? ""}
                  onChange={(e) => setForm({ ...form, inicio: e.target.value || null })}
                />
              </div>
              <div className="space-y-2">
                <Label>Término</Label>
                <Input
                  type="date"
                  value={form.fim ?? ""}
                  onChange={(e) => setForm({ ...form, fim: e.target.value || null })}
                />
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Switch
                checked={form.ativa}
                onCheckedChange={(v) => setForm({ ...form, ativa: v })}
              />
              <span className="text-sm">Missão ativa</span>
            </div>
          </div>
          <DialogFooter>
            <Button className="font-bold" onClick={salvar}>
              Salvar missão
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

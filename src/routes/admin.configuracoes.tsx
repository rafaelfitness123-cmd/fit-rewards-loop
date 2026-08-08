import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import {
  getAvisos,
  getConfig,
  setAvisos,
  setConfig,
  uid,
  type Aviso,
  type ConfigGamificacao,
} from "@/lib/db";
import { useStore } from "@/lib/session";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/admin/configuracoes")({
  head: () => ({
    meta: [
      { title: "Configurações de Gamificação — Painel PulseFit" },
      {
        name: "description",
        content:
          "Configure pontos de check-in, check-out, bônus de sequência e avisos da academia.",
      },
      { property: "og:title", content: "Configurações — Painel PulseFit" },
      {
        property: "og:description",
        content: "Todos os valores de gamificação são editáveis pelo administrador.",
      },
    ],
  }),
  component: Configuracoes,
});

function Configuracoes() {
  const [salvo, refresh] = useStore(() => getConfig());
  const [form, setForm] = useState<ConfigGamificacao>(salvo);
  const [avisos, refreshAvisos] = useStore(() => getAvisos());
  const [novoAviso, setNovoAviso] = useState({ titulo: "", texto: "", destaque: false });
  const [novaSenha, setNovaSenha] = useState("");

  const salvar = () => {
    setConfig({
      pontosCheckin: Math.max(0, Number(form.pontosCheckin) || 0),
      usarCheckout: form.usarCheckout,
      pontosCheckout: Math.max(0, Number(form.pontosCheckout) || 0),
      minutosEntreTreinos: Math.max(0, Number(form.minutosEntreTreinos) || 0),
      minutosMinimosTreino: Math.max(0, Number(form.minutosMinimosTreino) || 0),
      bonusSequencia: form.bonusSequencia
        .map((b) => ({
          dias: Math.max(1, Number(b.dias) || 1),
          pontos: Math.max(0, Number(b.pontos) || 0),
        }))
        .sort((a, b) => a.dias - b.dias),
    });
    refresh();
    toast.success("Configurações salvas.");
  };

  const publicarAviso = () => {
    if (!novoAviso.titulo.trim()) {
      toast.error("Informe o título do aviso.");
      return;
    }
    const aviso: Aviso = {
      id: uid(),
      titulo: novoAviso.titulo.trim(),
      texto: novoAviso.texto.trim(),
      data: new Date().toISOString(),
      destaque: novoAviso.destaque,
    };
    setAvisos([aviso, ...getAvisos()]);
    setNovoAviso({ titulo: "", texto: "", destaque: false });
    refreshAvisos();
    toast.success("Aviso publicado.");
  };

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-2xl font-black">Configurações de Gamificação</h1>
        <p className="text-sm text-muted-foreground">
          Nenhum valor é fixo no código — tudo é editável aqui.
        </p>
      </header>

      <section className="surface space-y-4 p-5">
        <h2 className="text-sm font-bold">Check-in e check-out</h2>
        <div className="grid gap-4 sm:grid-cols-3">
          <div className="space-y-2">
            <Label>Pontos extras por check-in</Label>
            <Input
              type="number"
              min={0}
              value={form.pontosCheckin}
              onChange={(e) => setForm({ ...form, pontosCheckin: Number(e.target.value) })}
            />
          </div>
          <div className="space-y-2">
            <Label>Pontos por check-out</Label>
            <Input
              type="number"
              min={0}
              value={form.pontosCheckout}
              onChange={(e) => setForm({ ...form, pontosCheckout: Number(e.target.value) })}
            />
          </div>
          <div className="space-y-2">
            <Label>Intervalo mínimo entre treinos (min)</Label>
            <Input
              type="number"
              min={0}
              value={form.minutosEntreTreinos}
              onChange={(e) => setForm({ ...form, minutosEntreTreinos: Number(e.target.value) })}
            />
          </div>
          <div className="space-y-2">
            <Label>Tempo mínimo de treino (min)</Label>
            <Input
              type="number"
              min={0}
              value={form.minutosMinimosTreino}
              onChange={(e) => setForm({ ...form, minutosMinimosTreino: Number(e.target.value) })}
            />
            <p className="text-[11px] text-muted-foreground">
              O aluno só recebe os pontos do dia se ficar pelo menos esse tempo entre a entrada e a
              saída.
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <Switch
            checked={form.usarCheckout}
            onCheckedChange={(v) => setForm({ ...form, usarCheckout: v })}
          />
          <span className="text-sm">Conceder pontos no check-out</span>
        </div>
      </section>

      <section className="surface space-y-4 p-5">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-bold">Bônus de sequência</h2>
          <Button
            variant="secondary"
            size="sm"
            onClick={() =>
              setForm({
                ...form,
                bonusSequencia: [...form.bonusSequencia, { dias: 10, pontos: 100 }],
              })
            }
          >
            <Plus className="mr-1 size-4" /> Adicionar
          </Button>
        </div>
        {form.bonusSequencia.map((b, i) => (
          <div key={i} className="flex items-end gap-3">
            <div className="flex-1 space-y-2">
              <Label>Dias seguidos</Label>
              <Input
                type="number"
                min={1}
                value={b.dias}
                onChange={(e) => {
                  const copia = [...form.bonusSequencia];
                  copia[i] = { ...b, dias: Number(e.target.value) };
                  setForm({ ...form, bonusSequencia: copia });
                }}
              />
            </div>
            <div className="flex-1 space-y-2">
              <Label>Pontos</Label>
              <Input
                type="number"
                min={0}
                value={b.pontos}
                onChange={(e) => {
                  const copia = [...form.bonusSequencia];
                  copia[i] = { ...b, pontos: Number(e.target.value) };
                  setForm({ ...form, bonusSequencia: copia });
                }}
              />
            </div>
            <Button
              variant="ghost"
              size="icon"
              onClick={() =>
                setForm({
                  ...form,
                  bonusSequencia: form.bonusSequencia.filter((_, x) => x !== i),
                })
              }
            >
              <Trash2 className="size-4 text-destructive" />
            </Button>
          </div>
        ))}
      </section>

      <Button className="font-bold" onClick={salvar}>
        Salvar configurações
      </Button>

      <section className="surface space-y-4 p-5">
        <h2 className="text-sm font-bold">Avisos e novidades</h2>
        <div className="space-y-2">
          <Label>Título</Label>
          <Input
            value={novoAviso.titulo}
            onChange={(e) => setNovoAviso({ ...novoAviso, titulo: e.target.value })}
          />
        </div>
        <div className="space-y-2">
          <Label>Mensagem</Label>
          <Textarea
            value={novoAviso.texto}
            onChange={(e) => setNovoAviso({ ...novoAviso, texto: e.target.value })}
          />
        </div>
        <div className="flex items-center gap-3">
          <Switch
            checked={novoAviso.destaque}
            onCheckedChange={(v) => setNovoAviso({ ...novoAviso, destaque: v })}
          />
          <span className="text-sm">Destacar no app do aluno</span>
        </div>
        <Button variant="secondary" onClick={publicarAviso}>
          Publicar aviso
        </Button>

        <div className="space-y-2 pt-2">
          {avisos.map((a) => (
            <div
              key={a.id}
              className="flex items-center justify-between rounded-xl bg-muted/40 p-3"
            >
              <div>
                <p className="text-sm font-semibold">{a.titulo}</p>
                <p className="text-xs text-muted-foreground">{a.texto}</p>
              </div>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => {
                  setAvisos(getAvisos().filter((x) => x.id !== a.id));
                  refreshAvisos();
                }}
              >
                <Trash2 className="size-4 text-destructive" />
              </Button>
            </div>
          ))}
        </div>
      </section>

      <section className="surface space-y-4 p-5">
        <h2 className="text-sm font-bold">Senha do administrador</h2>
        <div className="space-y-2">
          <Label>Nova senha</Label>
          <Input type="password" value={novaSenha} onChange={(e) => setNovaSenha(e.target.value)} />
        </div>
        <Button
          variant="secondary"
          onClick={async () => {
            if (novaSenha.length < 6) {
              toast.error("A senha precisa ter ao menos 6 caracteres.");
              return;
            }
            const { error } = await supabase.auth.updateUser({ password: novaSenha });
            if (error) toast.error("Não foi possível alterar a senha.");
            else {
              setNovaSenha("");
              toast.success("Senha atualizada.");
            }
          }}
        >
          Salvar nova senha
        </Button>
      </section>
    </div>
  );
}

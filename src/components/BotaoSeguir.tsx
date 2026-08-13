import { useEffect, useState } from "react";
import { UserCheck, UserPlus } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { deixarDeSeguir, listarSeguindo, seguir } from "@/lib/seguidores";

/** Cache simples de "quem eu sigo" para não consultar a cada card do feed. */
let cache: { meuId: string; ids: Set<string> } | null = null;
let carregando: Promise<Set<string>> | null = null;
const ouvintes = new Set<() => void>();

async function garantir(meuId: string): Promise<Set<string>> {
  if (cache && cache.meuId === meuId) return cache.ids;
  if (!carregando) {
    carregando = listarSeguindo(meuId).then((ids) => {
      cache = { meuId, ids: new Set(ids) };
      carregando = null;
      ouvintes.forEach((f) => f());
      return cache.ids;
    });
  }
  return carregando;
}

function avisar() {
  ouvintes.forEach((f) => f());
}

export function useSigo(meuId: string, alunoId: string) {
  const [sigo, setSigo] = useState<boolean | null>(null);

  useEffect(() => {
    if (!meuId || !alunoId) return;
    let vivo = true;
    const ler = () => {
      if (vivo && cache && cache.meuId === meuId) setSigo(cache.ids.has(alunoId));
    };
    ouvintes.add(ler);
    void garantir(meuId).then(ler);
    return () => {
      vivo = false;
      ouvintes.delete(ler);
    };
  }, [meuId, alunoId]);

  return sigo;
}

export default function BotaoSeguir({
  meuId,
  alunoId,
  compacto = false,
  className,
}: {
  meuId: string;
  alunoId: string;
  compacto?: boolean;
  className?: string;
}) {
  const sigo = useSigo(meuId, alunoId);
  const [salvando, setSalvando] = useState(false);

  if (!meuId || !alunoId || meuId === alunoId || sigo === null) return null;

  const alternar = async () => {
    setSalvando(true);
    try {
      if (sigo) {
        await deixarDeSeguir(meuId, alunoId);
        cache?.ids.delete(alunoId);
        toast.success("Você deixou de seguir.");
      } else {
        await seguir(meuId, alunoId);
        cache?.ids.add(alunoId);
        toast.success("Agora você segue este aluno.");
      }
      avisar();
    } catch {
      toast.error("Não foi possível atualizar agora.");
    } finally {
      setSalvando(false);
    }
  };

  return (
    <Button
      type="button"
      size={compacto ? "sm" : "default"}
      variant={sigo ? "secondary" : "default"}
      disabled={salvando}
      onClick={() => void alternar()}
      {...(className ? { className: `font-bold ${className}` } : { className: "font-bold" })}
    >
      {sigo ? (
        <>
          <UserCheck className="mr-1.5 size-4" /> Seguindo
        </>
      ) : (
        <>
          <UserPlus className="mr-1.5 size-4" /> Seguir
        </>
      )}
    </Button>
  );
}

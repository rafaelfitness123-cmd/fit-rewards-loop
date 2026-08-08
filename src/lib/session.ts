import { useCallback, useEffect, useRef, useState, useSyncExternalStore } from "react";
import { supabase } from "@/integrations/supabase/client";
import {
  cache,
  carregarTudo,
  getClientes,
  getSessao,
  inscrever,
  notificar,
  type Cliente,
} from "./db";

let iniciado = false;

/** Garante que o cache foi carregado do banco uma única vez por sessão. */
export function iniciarDados() {
  if (iniciado) return;
  iniciado = true;
  void carregarTudo();
  supabase.auth.onAuthStateChange((evento) => {
    if (evento === "SIGNED_IN" || evento === "SIGNED_OUT" || evento === "USER_UPDATED") {
      void carregarTudo();
    }
  });
}

export async function recarregar() {
  await carregarTudo();
}

/** Re-executa `selector` sempre que o cache do app muda. */
export function useStore<T>(selector: () => T): [T, () => void] {
  const selectorRef = useRef(selector);
  selectorRef.current = selector;
  const [value, setValue] = useState<T>(() => selector());
  const refresh = useCallback(() => setValue(selectorRef.current()), []);

  useEffect(() => {
    iniciarDados();
    setValue(selectorRef.current());
    return inscrever(() => setValue(selectorRef.current()));
  }, []);

  return [value, refresh];
}

export function useCachePronto() {
  return useSyncExternalStore(
    inscrever,
    () => cache.pronto,
    () => false,
  );
}

export function useSessao() {
  const [sessao] = useStore(() => getSessao());
  return sessao;
}

export function useClienteAtual(): Cliente | null {
  const [cliente] = useStore(() => {
    const s = getSessao();
    if (!s || s.tipo !== "cliente") return null;
    return getClientes().find((c) => c.id === s.clienteId) ?? null;
  });
  return cliente;
}

export async function logout() {
  await supabase.auth.signOut();
  cache.sessao = null;
  cache.pronto = true;
  notificar();
}

import { useCallback, useEffect, useState } from "react";
import {
  finishHydration,
  getClientes,
  getSessao,
  seed,
  setSessao,
  type Cliente,
} from "./db";

/** Re-executa `selector` sempre que o localStorage do app muda. */
export function useStore<T>(selector: () => T): [T, () => void] {
  const [value, setValue] = useState<T>(() => selector());
  const refresh = useCallback(() => setValue(selector()), [selector]);

  useEffect(() => {
    finishHydration();
    seed();
    setValue(selector());
    const handler = () => setValue(selector());
    window.addEventListener("academia:update", handler);
    window.addEventListener("storage", handler);
    return () => {
      window.removeEventListener("academia:update", handler);
      window.removeEventListener("storage", handler);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);


  return [value, refresh];
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

export function logout() {
  setSessao(null);
}

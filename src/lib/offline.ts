/** Modo offline: fila de lançamentos e cópia local dos dados do painel. */
import type { Tipo } from "./entry-schema";

export type ItemFila = {
  id: string;
  criadoEm: number;
  payload: { tipo: Tipo; valores: Record<string, string>; row?: string };
  tentativas?: number;
  ultimoErro?: string;
};

const CHAVE_FILA = "nocorre:fila-offline";
const CHAVE_PAINEL = "nocorre:painel-cache";
const CHAVE_SESSAO = "nocorre:sessao-cache";
const EVENTO = "nocorre:fila-mudou";

const temWindow = () => typeof window !== "undefined";

function ler<T>(chave: string, padrao: T): T {
  if (!temWindow()) return padrao;
  try {
    const s = window.localStorage.getItem(chave);
    return s ? (JSON.parse(s) as T) : padrao;
  } catch {
    return padrao;
  }
}

function gravar(chave: string, valor: unknown) {
  if (!temWindow()) return;
  try {
    if (valor === null) window.localStorage.removeItem(chave);
    else window.localStorage.setItem(chave, JSON.stringify(valor));
  } catch {
    /* armazenamento cheio ou bloqueado */
  }
}

/** Erro causado por falta de conexão (não por validação do servidor). */
export function ehErroDeRede(e: unknown): boolean {
  if (temWindow() && navigator.onLine === false) return true;
  const msg = String((e as Error)?.message ?? e ?? "").toLowerCase();
  return (
    e instanceof TypeError ||
    msg.includes("failed to fetch") ||
    msg.includes("network") ||
    msg.includes("load failed")
  );
}

export function lerFila(): ItemFila[] {
  return ler<ItemFila[]>(CHAVE_FILA, []);
}

function salvarFila(fila: ItemFila[]) {
  gravar(CHAVE_FILA, fila);
  if (temWindow()) window.dispatchEvent(new Event(EVENTO));
}

export function enfileirar(payload: ItemFila["payload"]) {
  const fila = lerFila();
  fila.push({ id: `${Date.now()}-${fila.length}`, criadoEm: Date.now(), payload });
  salvarFila(fila);
}

export function aoMudarFila(cb: () => void): () => void {
  if (!temWindow()) return () => {};
  window.addEventListener(EVENTO, cb);
  window.addEventListener("storage", cb);
  return () => {
    window.removeEventListener(EVENTO, cb);
    window.removeEventListener("storage", cb);
  };
}

/**
 * Tenta salvar no servidor; sem internet, guarda na fila e devolve offline=true.
 */
export async function salvarOuEnfileirar(
  salvar: (a: { data: ItemFila["payload"] }) => Promise<unknown>,
  payload: ItemFila["payload"],
): Promise<{ offline: boolean }> {
  if (temWindow() && navigator.onLine === false) {
    enfileirar(payload);
    return { offline: true };
  }
  try {
    await salvar({ data: payload });
    return { offline: false };
  } catch (e) {
    if (ehErroDeRede(e)) {
      enfileirar(payload);
      return { offline: true };
    }
    throw e;
  }
}

let sincronizando = false;

/** Após este número de recusas do servidor, o item para de ser reenviado sozinho. */
export const MAX_TENTATIVAS = 5;

export function itemTravado(item: ItemFila): boolean {
  return (item.tentativas ?? 0) >= MAX_TENTATIVAS;
}

/** Remove um item da fila (ação do usuário para lançamentos travados). */
export function descartarItem(id: string) {
  salvarFila(lerFila().filter((i) => i.id !== id));
}

/**
 * Envia em ordem; só remove itens confirmados. Um item recusado pelo servidor
 * continua guardado (com contador de tentativas) e não impede os seguintes.
 */
export async function sincronizarFila(
  salvar: (a: { data: ItemFila["payload"] }) => Promise<unknown>,
): Promise<{ enviados: number; falhas: number }> {
  if (sincronizando) return { enviados: 0, falhas: 0 };
  sincronizando = true;
  let enviados = 0;
  let falhas = 0;
  try {
    for (const item of lerFila()) {
      if (itemTravado(item)) continue;
      try {
        await salvar({ data: item.payload });
        enviados++;
        salvarFila(lerFila().filter((i) => i.id !== item.id));
      } catch (e) {
        if (ehErroDeRede(e)) break;
        falhas++;
        salvarFila(
          lerFila().map((i) =>
            i.id === item.id
              ? { ...i, tentativas: (i.tentativas ?? 0) + 1, ultimoErro: String((e as Error)?.message ?? e) }
              : i,
          ),
        );
      }
    }
  } finally {
    sincronizando = false;
  }
  return { enviados, falhas };
}

/* Cópia local dos dados para abrir as telas sem internet */
export function guardarPainel(dados: unknown) {
  gravar(CHAVE_PAINEL, dados);
}
export function lerPainelLocal<T>(): T | null {
  return ler<T | null>(CHAVE_PAINEL, null);
}
export function guardarSessao(sessao: unknown) {
  gravar(CHAVE_SESSAO, sessao);
  if (sessao === null) gravar(CHAVE_PAINEL, null);
}
export function lerSessaoLocal<T>(): T | null {
  return ler<T | null>(CHAVE_SESSAO, null);
}

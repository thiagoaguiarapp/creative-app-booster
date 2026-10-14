import { queryOptions } from "@tanstack/react-query";

import { getPainelData } from "./painel.functions";
import { ehErroDeRede, guardarPainel, lerPainelLocal } from "./offline";

export const painelQueryOptions = () =>
  queryOptions({
    queryKey: ["painel"],
    queryFn: async () => {
      try {
        const dados = await getPainelData();
        guardarPainel(dados);
        return dados;
      } catch (e) {
        // Sem internet: usa a última cópia salva no aparelho.
        const local = ehErroDeRede(e) ? lerPainelLocal<Awaited<ReturnType<typeof getPainelData>>>() : null;
        if (local) return local;
        throw e;
      }
    },
    staleTime: 60_000,
    networkMode: "always",
  });

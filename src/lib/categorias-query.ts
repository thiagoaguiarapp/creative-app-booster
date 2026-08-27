import { queryOptions } from "@tanstack/react-query";

import { categoriasPadraoFn } from "@/lib/admin.functions";

export function categoriasQueryOptions() {
  return queryOptions({
    queryKey: ["categorias-padrao"],
    queryFn: () => categoriasPadraoFn(),
    staleTime: 5 * 60 * 1000,
  });
}

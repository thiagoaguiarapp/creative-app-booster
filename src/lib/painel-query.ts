import { queryOptions } from "@tanstack/react-query";

import { getPainelData } from "./painel.functions";

export const painelQueryOptions = () =>
  queryOptions({
    queryKey: ["painel"],
    queryFn: () => getPainelData(),
    staleTime: 60_000,
  });

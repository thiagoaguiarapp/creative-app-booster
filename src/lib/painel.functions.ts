import { createServerFn } from "@tanstack/react-start";

import type { PainelData } from "./sheets-types";

export const getPainelData = createServerFn({ method: "GET" }).handler(
  async (): Promise<PainelData> => {
    const { loadPainelData } = await import("./painel.server");
    return loadPainelData();
  },
);

import { createServerFn } from "@tanstack/react-start";

export const definirPremiumFn = createServerFn({ method: "POST" })
  .inputValidator((input: { ativo: boolean }) => input)
  .handler(async ({ data }): Promise<{ isPremium: boolean }> => {
    const { definirPremium } = await import("./auth.server");
    const isPremium = await definirPremium(data.ativo === true);
    return { isPremium };
  });

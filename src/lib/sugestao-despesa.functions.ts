import { createServerFn } from "@tanstack/react-start";
import { pedidoSugestaoSchema } from "./sugestao-despesa";

export const sugerirDespesaFn = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) => pedidoSugestaoSchema.parse(input))
  .handler(async ({ data }) => {
    const { exigirUsuario } = await import("./auth.server");
    await exigirUsuario();
    const { sugerirDespesa } = await import("./sugestao-despesa.server");
    return sugerirDespesa(data);
  });

import { createFileRoute, redirect } from "@tanstack/react-router";

// Atalho antigo. A página do No Corre agora é a raiz deste projeto,
// servida em https://nocorre.rotacontrolapp.com.br.
export const Route = createFileRoute("/nocorre")({
  beforeLoad: () => {
    throw redirect({ to: "/" });
  },
  component: () => null,
});

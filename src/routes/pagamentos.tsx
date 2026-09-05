import { createFileRoute, redirect } from "@tanstack/react-router";

/** A tela de pagamentos virou a aba "Pagamento" dentro de /banco. */
export const Route = createFileRoute("/pagamentos")({
  beforeLoad: () => {
    throw redirect({ to: "/banco", search: { aba: "pagamento" }, replace: true });
  },
  component: () => null,
});

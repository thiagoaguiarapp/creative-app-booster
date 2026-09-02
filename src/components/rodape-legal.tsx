import { Link } from "@tanstack/react-router";

export function RodapeLegal() {
  return (
    <footer className="mt-8 border-t border-border px-4 py-6 text-center text-xs text-muted-foreground">
      <p className="mb-2">
        © {new Date().getFullYear()} Rota Control · Controle financeiro para entregadores
      </p>
      <nav className="flex flex-wrap items-center justify-center gap-x-4 gap-y-1">
        <Link to="/termos" className="underline-offset-4 hover:text-foreground hover:underline">
          Termos de Uso
        </Link>
        <Link to="/privacidade" className="underline-offset-4 hover:text-foreground hover:underline">
          Política de Privacidade
        </Link>
      </nav>
    </footer>
  );
}

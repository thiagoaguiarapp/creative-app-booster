import { Link } from "@tanstack/react-router";

export function LandingFooter() {
  return (
    <footer className="border-t border-border/60">
      <div className="mx-auto flex w-full max-w-5xl flex-col gap-6 px-4 py-8">
        <div className="flex flex-col items-center justify-between gap-4 sm:flex-row">
          <div className="flex items-center gap-2">
            <img src="/icon-192-v2.png" alt="Rota Control" className="size-6 rounded-md" />
            <span className="font-display text-sm font-semibold uppercase tracking-[0.14em]">
              Rota Control
            </span>
          </div>
          <nav className="flex flex-wrap items-center justify-center gap-x-5 gap-y-2 text-sm text-muted-foreground">
            <Link to="/sobre" className="hover:text-foreground">Sobre nós</Link>
            <Link to="/tour" className="hover:text-foreground">Tour pelo app</Link>
            <Link to="/blog" className="hover:text-foreground">Blog</Link>
            <Link to="/calculadora" className="hover:text-foreground">Calculadora de custo por km</Link>
            <Link to="/contato" className="hover:text-foreground">Contato</Link>
          </nav>
        </div>
        <div className="flex flex-col items-center justify-between gap-2 text-xs text-muted-foreground sm:flex-row">
          <span>© {new Date().getFullYear()} Rota Control. Todos os direitos reservados.</span>
          <div className="flex items-center gap-4">
            <Link to="/termos" className="hover:text-foreground">Termos de uso</Link>
            <Link to="/privacidade" className="hover:text-foreground">Privacidade</Link>
          </div>
        </div>
      </div>
    </footer>
  );
}

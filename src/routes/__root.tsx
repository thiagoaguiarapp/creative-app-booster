import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  Outlet,
  Link,
  createRootRouteWithContext,
  redirect,
  useRouter,
  HeadContent,
  Scripts,
} from "@tanstack/react-router";
import { useEffect, type ReactNode } from "react";

import appCss from "../styles.css?url";
import { reportLovableError } from "../lib/lovable-error-reporting";
import { AppSidebar } from "@/components/app-sidebar";
import { sessaoFn } from "@/lib/auth.functions";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { Toaster } from "@/components/ui/sonner";
import { RodapeLegal } from "@/components/rodape-legal";
import { AdBannerMobile } from "@/components/ad-banner-mobile";
import { AdSenseInit } from "@/components/ad-sense-init";



function NotFoundComponent() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="max-w-md text-center">
        <h1 className="text-7xl font-bold text-foreground">404</h1>
        <h2 className="mt-4 text-xl font-semibold text-foreground">Page not found</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          The page you're looking for doesn't exist or has been moved.
        </p>
        <div className="mt-6">
          <Link
            to="/"
            className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
          >
            Go home
          </Link>
        </div>
      </div>
    </div>
  );
}

function ErrorComponent({ error, reset }: { error: Error; reset: () => void }) {
  console.error(error);
  const router = useRouter();
  useEffect(() => {
    reportLovableError(error, { boundary: "tanstack_root_error_component" });
  }, [error]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="max-w-md text-center">
        <h1 className="text-xl font-semibold tracking-tight text-foreground">
          This page didn't load
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Something went wrong on our end. You can try refreshing or head back home.
        </p>
        <div className="mt-6 flex flex-wrap justify-center gap-2">
          <button
            onClick={() => {
              router.invalidate();
              reset();
            }}
            className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
          >
            Try again
          </button>
          <a
            href="/"
            className="inline-flex items-center justify-center rounded-md border border-input bg-background px-4 py-2 text-sm font-medium text-foreground transition-colors hover:bg-accent"
          >
            Go home
          </a>
        </div>
      </div>
    </div>
  );
}

type SessaoUsuario = Awaited<ReturnType<typeof sessaoFn>>;

// Guarda a última sessão conhecida para sobreviver a falhas de rede pontuais
// (HMR, oscilação de conexão) sem derrubar o app em tela branca.
let ultimaSessao: SessaoUsuario | undefined;

async function carregarSessao(): Promise<{ usuario: SessaoUsuario; falhou: boolean }> {
  for (let tentativa = 0; tentativa < 2; tentativa++) {
    try {
      const usuario = await sessaoFn();
      ultimaSessao = usuario;
      return { usuario, falhou: false };
    } catch {
      if (tentativa === 0) await new Promise((r) => setTimeout(r, 400));
    }
  }
  return { usuario: (ultimaSessao ?? null) as SessaoUsuario, falhou: true };
}

export const Route = createRootRouteWithContext<{ queryClient: QueryClient }>()({
  beforeLoad: async ({ location }) => {
    if (location.pathname.startsWith("/lovable/")) return {};
    // Rotas públicas: login, recuperação de senha e páginas legais.
    const publica =
      location.pathname === "/auth" ||
      location.pathname === "/redefinir-senha" ||
      location.pathname === "/termos" ||
      location.pathname === "/privacidade";
    const { usuario, falhou } = await carregarSessao();
    // Falha de rede: não desloga nem redireciona, apenas mantém a tela atual.
    if (falhou) return { usuario };
    if (!usuario && !publica) {
      throw redirect({ to: "/auth" });
    }
    if (usuario && location.pathname === "/auth") {
      throw redirect({ to: usuario.nome ? "/" : "/perfil" });
    }
    if (usuario && !usuario.nome && location.pathname !== "/perfil" && !publica) {
      throw redirect({ to: "/perfil" });
    }
    return { usuario };
  },
  head: () => ({

    meta: [
      { charSet: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1, viewport-fit=cover" },
      { name: "theme-color", content: "#0d1526" },
      { name: "apple-mobile-web-app-capable", content: "yes" },
      { name: "apple-mobile-web-app-title", content: "Rota Control" },
      { name: "apple-mobile-web-app-status-bar-style", content: "black-translucent" },
      { title: "Rota Control — Gestão do entregador" },
      {
        name: "description",
        content:
          "Controle ganhos, gastos, abastecimento, manutenção e repasses das suas entregas em um só lugar.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
      { property: "og:title", content: "Rota Control — Gestão do entregador" },
      { name: "twitter:title", content: "Rota Control — Gestão do entregador" },
      { property: "og:description", content: "Controle ganhos, gastos, abastecimento, manutenção e repasses das suas entregas em um só lugar." },
      { name: "twitter:description", content: "Controle ganhos, gastos, abastecimento, manutenção e repasses das suas entregas em um só lugar." },
    ],
    links: [
      { rel: "stylesheet", href: appCss },
      { rel: "preconnect", href: "https://fonts.googleapis.com" },
      { rel: "preconnect", href: "https://fonts.gstatic.com", crossOrigin: "anonymous" },
      {
        rel: "stylesheet",
        href: "https://fonts.googleapis.com/css2?family=Barlow+Condensed:wght@500;600;700&family=Inter+Tight:wght@400;500;600&display=swap",
      },
      { rel: "icon", href: "/favicon-v2.png", type: "image/png", sizes: "64x64" },
      { rel: "icon", href: "/icon-192-v2.png", type: "image/png", sizes: "192x192" },
      { rel: "icon", href: "/icon-512-v2.png", type: "image/png", sizes: "512x512" },
      { rel: "apple-touch-icon", href: "/apple-touch-icon-v2.png", sizes: "180x180" },
      { rel: "apple-touch-startup-image", href: "/splash-750x1334-v2.png", media: "(device-width: 375px) and (device-height: 667px) and (-webkit-device-pixel-ratio: 2)" },
      { rel: "apple-touch-startup-image", href: "/splash-828x1792-v2.png", media: "(device-width: 414px) and (device-height: 896px) and (-webkit-device-pixel-ratio: 2)" },
      { rel: "apple-touch-startup-image", href: "/splash-1125x2436-v2.png", media: "(device-width: 375px) and (device-height: 812px) and (-webkit-device-pixel-ratio: 3)" },
      { rel: "apple-touch-startup-image", href: "/splash-1170x2532-v2.png", media: "(device-width: 390px) and (device-height: 844px) and (-webkit-device-pixel-ratio: 3)" },
      { rel: "apple-touch-startup-image", href: "/splash-1242x2688-v2.png", media: "(device-width: 414px) and (device-height: 896px) and (-webkit-device-pixel-ratio: 3)" },
      { rel: "apple-touch-startup-image", href: "/splash-1290x2796-v2.png", media: "(device-width: 430px) and (device-height: 932px) and (-webkit-device-pixel-ratio: 3)" },
      { rel: "apple-touch-startup-image", href: "/splash-1536x2048-v2.png", media: "(device-width: 768px) and (device-height: 1024px) and (-webkit-device-pixel-ratio: 2)" },
      { rel: "apple-touch-startup-image", href: "/splash-1668x2388-v2.png", media: "(device-width: 834px) and (device-height: 1194px) and (-webkit-device-pixel-ratio: 2)" },
      { rel: "apple-touch-startup-image", href: "/splash-2048x2732-v2.png", media: "(device-width: 1024px) and (device-height: 1366px) and (-webkit-device-pixel-ratio: 2)" },
      { rel: "manifest", href: "/manifest.webmanifest?v=2" },
    ],
  }),
  shellComponent: RootShell,
  component: RootComponent,
  notFoundComponent: NotFoundComponent,
  errorComponent: ErrorComponent,
});

function RootShell({ children }: { children: ReactNode }) {
  return (
    <html lang="pt-BR">
      <head>
        <HeadContent />
      </head>
      <body>
        {children}
        <Scripts />
      </body>
    </html>
  );
}

function RootComponent() {
  const { queryClient, usuario } = Route.useRouteContext();

  if (!usuario || !usuario.nome) {
    return (
      <QueryClientProvider client={queryClient}>
        <div className="flex min-h-screen flex-col">
          <div className="flex-1">
            <Outlet />
          </div>
          <RodapeLegal />
        </div>
        <AdSenseInit />
        <Toaster richColors position="top-center" />
      </QueryClientProvider>
    );
  }

  return (
    <QueryClientProvider client={queryClient}>
      <SidebarProvider>
        <div className="flex min-h-screen w-full">
          <AppSidebar email={usuario.email} isAdmin={usuario.isAdmin === true} />
          <div className="flex flex-1 flex-col">
            <header className="sticky top-0 z-10 flex h-14 items-center gap-3 border-b border-border bg-background/80 px-4 backdrop-blur">
              <SidebarTrigger />
              <span className="text-xs uppercase tracking-[0.18em] text-muted-foreground">
                Rota Control
              </span>
            </header>
            <main className="flex-1 p-4 pb-24 md:p-8">
              {/* Required: nested routes render here. */}
              <Outlet />
            </main>
            <div
              className="pb-20 md:pb-0"
              style={{ paddingBottom: "calc(5rem + var(--altura-banner-ads, 0px))" }}
            >
              <RodapeLegal />
            </div>
          </div>
        </div>
      </SidebarProvider>
      <AdBannerMobile />
      <Toaster richColors position="top-center" />
    </QueryClientProvider>


  );
}


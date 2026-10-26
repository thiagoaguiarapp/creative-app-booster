import type { CapacitorConfig } from "@capacitor/cli";

const config: CapacitorConfig = {
  appId: "br.com.rotacontrolapp.app",
  appName: "No Corre",
  webDir: ".output/public",
  server: {
    // Domínio oficial do No Corre (subdomínio próprio da Rota Control).
    // Nunca usar link de preview do Lovable nem o domínio antigo em Vercel:
    // o app instalado precisa abrir sempre a versão publicada deste projeto.
    url: "https://nocorre.rotacontrolapp.com.br",
    cleartext: true,
  },
  plugins: {
    AdMob: {
      // Em produção, troque pelos IDs reais do painel do AdMob.
      initializeForTesting: true,
    },
  },
};

export default config;

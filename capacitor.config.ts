import type { CapacitorConfig } from "@capacitor/cli";

const config: CapacitorConfig = {
  appId: "br.com.rotacontrolapp.app",
  appName: "Rota Control",
  webDir: ".output/public",
  server: {
    // Domínio oficial de produção. Nunca usar o link de preview do Lovable,
    // pois ele exige login na plataforma e bloqueia o app instalado.
    url: "https://www.rotacontrolapp.com.br",
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

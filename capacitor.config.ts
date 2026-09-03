import type { CapacitorConfig } from "@capacitor/cli";

const config: CapacitorConfig = {
  appId: "br.com.rotacontrolapp.app",
  appName: "Rota Control",
  webDir: ".output/public",
  server: {
    // Permite testar o app no celular apontando para o preview,
    // sem precisar recompilar a cada alteração.
    url: "https://id-preview--050c271a-9a2e-417d-a594-e8336c2f72c9.lovable.app",
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

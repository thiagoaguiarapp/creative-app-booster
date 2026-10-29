import { existsSync, readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const RES = "android/app/src/main/res";

/**
 * Um nome de desenho errado faz o Android voltar ao símbolo genérico
 * (exclamação) sem nenhum erro visível, então a ligação entre o código
 * e os arquivos em res/ precisa estar coberta por teste.
 */
describe("ícones das notificações do No Corre", () => {
  it("define o logo como ícone de status padrão do app", () => {
    const config = readFileSync("capacitor.config.ts", "utf8");
    expect(config).toContain('smallIcon: "ic_stat_nocorre"');
    expect(config).toContain('iconColor: "#FB8106"');
    expect(existsSync(`${RES}/drawable-mdpi/ic_stat_nocorre.png`)).toBe(true);
    expect(existsSync(`${RES}/drawable-xxhdpi/ic_stat_nocorre.png`)).toBe(true);
  });

  it("anexa o logo colorido às notificações de manutenção", () => {
    const componente = readFileSync("src/components/aviso-manutencao.tsx", "utf8");
    expect(componente).toContain('smallIcon: "ic_stat_nocorre"');
    expect(componente).toContain('largeIcon: "ic_large_nocorre"');
    expect(existsSync(`${RES}/drawable-xxhdpi/ic_large_nocorre.png`)).toBe(true);
  });
});

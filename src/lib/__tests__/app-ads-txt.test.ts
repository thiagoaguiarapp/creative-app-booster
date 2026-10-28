import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const CONTEUDO = readFileSync("public/app-ads.txt", "utf8");

describe("app-ads.txt do No Corre", () => {
  it("declara a conta AdMob como DIRECT com a assinatura do Google", () => {
    expect(CONTEUDO.trim()).toBe(
      "google.com, pub-2715745778380480, DIRECT, f08c47fec0942fa0",
    );
  });

  it("usa o mesmo editor de anúncios do ads.txt do site", () => {
    const adsTxt = readFileSync("public/ads.txt", "utf8");
    const publisherDoApp = CONTEUDO.match(/pub-\d+/)?.[0];
    const publisherDoSite = adsTxt.match(/pub-\d+/)?.[0];
    expect(publisherDoApp).toBe(publisherDoSite);
  });
});

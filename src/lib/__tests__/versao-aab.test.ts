import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

describe("versão do próximo AAB do No Corre", () => {
  it("usa código 14 e versão 1.0.13 para o novo envio à Google Play", () => {
    const gradle = readFileSync("android/app/build.gradle", "utf8");
    expect(gradle.match(/versionCode\s+(\d+)/)?.[1]).toBe("14");
    expect(gradle.match(/versionName\s+"([^"]+)"/)?.[1]).toBe("1.0.13");
  });
});
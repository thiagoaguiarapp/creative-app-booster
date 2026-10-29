import { describe, expect, it } from "vitest";

// O htmlparser2 10+ (que o npm instala quando `@react-email/render` sobe de versão)
// importa `entities/decode`, mas o `entities` do projeto (4.5.0) só expõe
// `entities/lib/decode.js`. O apelido em vite.config.ts resolve esse caminho; se ele
// for removido, o build falha com "Could not load node_modules/entities/decode".
import * as decode from "entities/decode";

describe("resolução de entities/decode no build", () => {
  it("entrega as peças que o htmlparser2 usa para decodificar entidades", () => {
    expect(typeof decode.fromCodePoint).toBe("function");
    expect(typeof decode.EntityDecoder).toBe("function");
    expect(decode.DecodingMode).toBeTruthy();
    expect(decode.htmlDecodeTree).toBeInstanceOf(Uint16Array);
    expect(decode.xmlDecodeTree).toBeInstanceOf(Uint16Array);
  });
});

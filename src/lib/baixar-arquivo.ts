import { Capacitor } from "@capacitor/core";

// Entrega de arquivos gerados no app (CSV, PDF).
// Na web: blob + <a download>. No Android (Capacitor), o WebView ignora
// downloads de blob, então gravamos no cache do app e abrimos a folha de
// compartilhamento — de lá o usuário salva em Downloads, Drive, WhatsApp etc.
export async function baixarArquivo(blob: Blob, nome: string): Promise<void> {
  if (Capacitor.isNativePlatform()) {
    const [{ Filesystem, Directory }, { Share }] = await Promise.all([
      import("@capacitor/filesystem"),
      import("@capacitor/share"),
    ]);
    const base64 = await blobParaBase64(blob);
    const { uri } = await Filesystem.writeFile({
      path: nome,
      data: base64,
      directory: Directory.Cache,
      recursive: true,
    });
    await Share.share({ title: nome, url: uri });
    return;
  }
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = nome;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 30_000);
}

function blobParaBase64(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result).split(",")[1] ?? "");
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(blob);
  });
}

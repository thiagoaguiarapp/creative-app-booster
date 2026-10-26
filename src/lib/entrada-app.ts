// A sessão decide a entrada mesmo no servidor, onde Capacitor não está disponível.
export function destinoEntradaApp(
  pathname: string,
  usuario: { nome: string } | null | undefined,
): "/inicio" | "/perfil" | null {
  if (!usuario || !["/", "/nocorre", "/auth"].includes(pathname)) return null;
  return usuario.nome ? "/inicio" : "/perfil";
}
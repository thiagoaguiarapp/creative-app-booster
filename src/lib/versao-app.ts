// Controle da versão nativa publicada na Google Play.
// Ao subir um novo .aab, atualize estes dois valores para que os
// aparelhos com versão antiga recebam o aviso de atualização.

/** versionCode publicado atualmente na Play Store (android/app/build.gradle). */
export const VERSAO_NATIVA_MAIS_RECENTE = 3;

/** versionName exibido para o usuário. */
export const VERSAO_NATIVA_MAIS_RECENTE_NOME = "1.0.2";

/**
 * Versão mínima aceita. Aparelhos abaixo disso veem um aviso obrigatório
 * (sem a opção "Lembrar depois"). Mantenha em 0 para avisos opcionais.
 */
export const VERSAO_NATIVA_MINIMA = 0;

export const LINK_PLAY_STORE =
  "https://play.google.com/store/apps/details?id=br.com.rotacontrolapp.app";

/** Chave usada para adiar o aviso por 24h. */
export const CHAVE_ADIAR_AVISO = "rc:aviso-atualizacao-adiado";

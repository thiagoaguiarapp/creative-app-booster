// Controle da versão nativa publicada na Google Play.
// Ao subir um novo .aab, atualize estes dois valores para que os
// aparelhos com versão antiga recebam o aviso de atualização.

/** versionCode publicado atualmente na Play Store (android/app/build.gradle). */
export const VERSAO_NATIVA_MAIS_RECENTE = 8;

/** versionName exibido para o usuário. */
export const VERSAO_NATIVA_MAIS_RECENTE_NOME = "1.0.7";

/**
 * Versão mínima aceita. Aparelhos abaixo disso veem um aviso obrigatório
 * (sem a opção "Lembrar depois"). Mantenha em 0 para avisos opcionais.
 */
export const VERSAO_NATIVA_MINIMA = 0;

/** Identificador do app (mesmo valor de appId em capacitor.config.ts). */
export const PACOTE_APP = "br.com.rotacontrolapp.app";

/** Página do app na loja, para abrir no navegador. */
export const LINK_PLAY_STORE = `https://play.google.com/store/apps/details?id=${PACOTE_APP}`;

/**
 * Endereço aberto dentro do app: leva direto ao aplicativo da Play Store,
 * sem passar pelo navegador.
 */
export const LINK_PLAY_STORE_NATIVA = `market://details?id=${PACOTE_APP}`;

/** Chave usada para adiar o aviso por 24h. */
export const CHAVE_ADIAR_AVISO = "rc:aviso-atualizacao-adiado";

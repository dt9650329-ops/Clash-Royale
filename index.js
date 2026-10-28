// Consulta el perfil de un jugador de Clash Royale por su tag.
// Se llama desde el front con firebase.functions().httpsCallable("consultarJugador").
// Secreto: CR_API_KEY (firebase functions:secrets:set CR_API_KEY)

const { onCall, HttpsError } = require("firebase-functions/v2/https");
const { defineSecret } = require("firebase-functions/params");

const CR_API_KEY = defineSecret("CR_API_KEY");
const CR_BASE = "https://proxy.royaleapi.dev/v1";

exports.consultarJugador = onCall({ secrets: [CR_API_KEY] }, async (request) => {
  if (!request.auth) {
    throw new HttpsError("unauthenticated", "Inicia sesión para continuar");
  }

  const tag = String((request.data || {}).tag || "")
    .trim()
    .toUpperCase()
    .replace(/^#/, "");
  if (!/^[0289PYLQGRJCUV]{3,15}$/.test(tag)) {
    throw new HttpsError("invalid-argument", "Ese tag no es válido. Revisa que lo copiaste completo");
  }

  const r = await fetch(`${CR_BASE}/players/%23${tag}`, {
    headers: { Authorization: `Bearer ${CR_API_KEY.value()}` },
  });
  if (r.status === 404) {
    throw new HttpsError("not-found", "No encontramos ese tag en Clash Royale");
  }
  if (!r.ok) {
    throw new HttpsError("unavailable", "Clash Royale no respondió. Intenta de nuevo en un momento");
  }

  const p = await r.json();
  return {
    tag: p.tag,
    nombre: p.name,
    nivel: p.expLevel,
    copas: p.trophies,
    mejoresCopas: p.bestTrophies,
    victorias: p.wins,
    derrotas: p.losses,
    clan: p.clan ? p.clan.name : null,
    arena: p.arena ? p.arena.name : null,
  };
});

// Page de dictée · enregistre le micro, envoie l'audio à l'API, affiche le texte
// L'audio reste seulement dans la mémoire du navigateur · il n'est jamais stocké sur le serveur

const boutonEnregistrer = document.getElementById("bouton-enregistrer");
const boutonArreter = document.getElementById("bouton-arreter");
const boutonEffacer = document.getElementById("bouton-effacer");
const etat = document.getElementById("etat-dictee");
const lecteur = document.getElementById("lecteur-audio");
const zoneTexte = document.getElementById("texte-transcrit");

let enregistreur = null;   // le MediaRecorder en cours d'utilisation
let morceaux = [];         // les petits bouts d'audio reçus pendant l'enregistrement
let adresseAudio = null;   // adresse temporaire de l'audio, pour le lecteur

// Affiche un message dans le badge · type = "ok" (vert), "err" (rouge), "info" (bleu)
function afficherEtat(message, type) {
  etat.className = "badge badge--" + type;
  etat.textContent = message;
}

// 1 · démarrer l'enregistrement
async function demarrer() {
  effacerAudio();                                                   // on repart d'une page propre
  try {
    const flux = await navigator.mediaDevices.getUserMedia({ audio: true });   // demande le micro
    enregistreur = new MediaRecorder(flux);
    morceaux = [];

    enregistreur.addEventListener("dataavailable", (evenement) => {
      morceaux.push(evenement.data);                                // on range chaque bout d'audio
    });

    enregistreur.addEventListener("stop", () => {
      flux.getTracks().forEach((piste) => piste.stop());            // éteint le micro (le voyant disparaît)
      const audio = new Blob(morceaux, { type: enregistreur.mimeType });   // recolle les bouts
      morceaux = [];
      envoyer(audio);
    });

    enregistreur.start();
    boutonEnregistrer.disabled = true;
    boutonArreter.disabled = false;
    afficherEtat("Enregistrement en cours… 🔴", "err");
  } catch (erreur) {
    afficherEtat("Micro refusé ou introuvable ❌", "err");
    console.error("Micro ·", erreur);
  }
}

// 2 · arrêter l'enregistrement · l'événement "stop" ci-dessus prend le relais
function arreter() {
  if (enregistreur && enregistreur.state === "recording") {
    enregistreur.stop();
  }
  boutonArreter.disabled = true;
}

// 3 · envoyer l'audio à l'API et afficher le texte
async function envoyer(audio) {
  adresseAudio = URL.createObjectURL(audio);                        // adresse locale, pour réécouter
  lecteur.src = adresseAudio;
  lecteur.hidden = false;
  boutonEffacer.disabled = false;
  afficherEtat("Transcription en cours… ⏳", "info");

  try {
    const reponse = await fetch("/api/transcriptions", {
      method: "POST",
      headers: { "Content-Type": audio.type },                      // par exemple audio/webm;codecs=opus
      body: audio,
    });
    if (!reponse.ok) throw new Error("HTTP " + reponse.status);
    const donnees = await reponse.json();
    zoneTexte.value = donnees.texte;                                // le médecin peut corriger
    afficherEtat("Transcription terminée ✅", "ok");
  } catch (erreur) {
    afficherEtat("Échec de la transcription ❌", "err");
    console.error("Transcription ·", erreur);
  } finally {
    boutonEnregistrer.disabled = false;                             // dans tous les cas, on peut redicter
  }
}

// 4 · effacer l'audio de la mémoire du navigateur
// plus tard (tranche 5), le bouton « Enregistrer le compte-rendu » appellera aussi cette fonction
function effacerAudio() {
  if (adresseAudio) {
    URL.revokeObjectURL(adresseAudio);                              // libère la mémoire
    adresseAudio = null;
  }
  lecteur.removeAttribute("src");
  lecteur.hidden = true;
  boutonEffacer.disabled = true;
}

boutonEnregistrer.addEventListener("click", demarrer);
boutonArreter.addEventListener("click", arreter);
boutonEffacer.addEventListener("click", () => {
  effacerAudio();
  afficherEtat("Audio effacé 🗑️", "info");
});

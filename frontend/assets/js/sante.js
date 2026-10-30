// Vérifie que l'API répond et affiche le résultat dans le badge de la page d'accueil

async function verifierApi() {
  const badge = document.getElementById("etat-api");        // le badge dans index.html
  const texte = document.getElementById("etat-api-texte");  // le texte à l'intérieur du badge
  if (!badge || !texte) return;                             // pas de badge sur cette page → on ne fait rien

  try {
    const reponse = await fetch("/api/sante");              // nginx relaie vers FastAPI
    if (!reponse.ok) throw new Error("HTTP " + reponse.status);
    const donnees = await reponse.json();                   // lit {"statut": "ok"}
    if (donnees.statut !== "ok") throw new Error("statut inattendu");

    badge.className = "badge badge--ok";                    // vert
    texte.textContent = "API connectée ✅";
  } catch (erreur) {
    badge.className = "badge badge--err";                   // rouge
    texte.textContent = "API injoignable ❌";
    console.error("Vérification de l'API ·", erreur);      // détail visible dans F12 → Console
  }
}

verifierApi();
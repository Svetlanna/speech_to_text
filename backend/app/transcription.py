import sys
from functools import lru_cache

from faster_whisper import WhisperModel


TAILLE_MODELE = "medium"
LANGUE = "fr"

# vocabulaire médical pour aider Whisper à bien écrire les termes difficiles
CONTEXTE_MEDICAL = (
    "Compte-rendu médical. Patient, antécédents, auscultation, tension artérielle, "
    "fréquence cardiaque, posologie, mg, paracétamol, amoxicilline, dyspnée, "
    "HTA, diabète de type 2, ECG, IRM, scanner."
)


@lru_cache(maxsize=1)  # garde le modèle en mémoire après le premier chargement
def charger_modele(taille: str = TAILLE_MODELE) -> WhisperModel:
    # int8 = calculs compressés, plus rapides et moins gourmands sur CPU
    return WhisperModel(taille, device="cpu", compute_type="int8")


def transcrire(audio) -> str:
    modele = charger_modele()

    segments, _infos = modele.transcribe(
        audio,
        language=LANGUE,                  # évite que Whisper devine la langue
        beam_size=5,                      # explore 5 hypothèses, plus précis
        vad_filter=True,                  # ignore les silences
        initial_prompt=CONTEXTE_MEDICAL,  # oriente vers le vocabulaire médical
    )

    # segments est un générateur, la transcription se fait pendant cette boucle
    morceaux = [segment.text.strip() for segment in segments]
    return " ".join(morceaux)


# Permet de tester depuis le terminal sans l'interface
if __name__ == "__main__":
    if len(sys.argv) != 2:
        print("Utilisation · python transcription.py chemin_du_fichier_audio")
        sys.exit(1)

    texte = transcrire(sys.argv[1])
    print("\n--- Transcription ---\n")
    print(texte)
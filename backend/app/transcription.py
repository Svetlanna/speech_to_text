import sys
from functools import lru_cache

from faster_whisper import WhisperModel

TAILLE_MODELE = "medium"
LANGUE = "fr"

CONTEXTE_MEDICAL = (
    # Consultation et antécédents
    "Compte rendu médical, consultation, motif de consultation, "
    "patient, patiente, antécédents médicaux et chirurgicaux, "
    "antécédents familiaux, allergie, traitement habituel, "
    "hospitalisation, suivi médical, examen clinique, "

    # Symptômes
    "douleur thoracique, douleur abdominale, céphalée, migraine, "
    "fièvre, frissons, fatigue, asthénie, vertiges, malaise, "
    "nausées, vomissements, diarrhée, constipation, "
    "toux sèche, expectoration, dyspnée, essoufflement, "
    "palpitations, œdème, éruption cutanée, prurit, "

    # Examen et mesures
    "auscultation cardiaque et pulmonaire, palpation abdominale, "
    "tension artérielle, pression artérielle, fréquence cardiaque, "
    "fréquence respiratoire, saturation en oxygène, température, "
    "poids, taille, indice de masse corporelle, "
    "systolique, diastolique, pouls, glycémie capillaire, "

    # Pathologies
    "hypertension artérielle, HTA, diabète de type 1, "
    "diabète de type 2, dyslipidémie, hypercholestérolémie, "
    "asthme, bronchite, pneumonie, insuffisance respiratoire, "
    "bronchopneumopathie chronique obstructive, BPCO, "
    "insuffisance cardiaque, fibrillation atriale, "
    "insuffisance rénale, infection urinaire, "
    "reflux gastro-œsophagien, anémie, hypothyroïdie, "
    "arthrose, lombalgie, sciatique, "

    # Examens complémentaires
    "bilan sanguin, numération formule sanguine, NFS, "
    "hémoglobine, leucocytes, plaquettes, protéine C réactive, CRP, "
    "créatinine, débit de filtration glomérulaire, DFG, "
    "ionogramme sanguin, sodium, potassium, "
    "glycémie à jeun, hémoglobine glyquée, HbA1c, "
    "transaminases, ASAT, ALAT, TSH, ferritine, "
    "électrocardiogramme, ECG, échographie, radiographie, "
    "imagerie par résonance magnétique, IRM, scanner, "
    "examen cytobactériologique des urines, ECBU, "

    # Médicaments
    "paracétamol, amoxicilline, acide clavulanique, "
    "ibuprofène, metformine, insuline, "
    "amlodipine, ramipril, bisoprolol, furosémide, "
    "atorvastatine, oméprazole, salbutamol, "
    "prednisone, lévothyroxine, "

    # Prescription et unités
    "prescription, ordonnance, posologie, durée du traitement, "
    "comprimé, gélule, sachet, sirop, injection, "
    "voie orale, voie intraveineuse, voie sous-cutanée, "
    "milligramme, mg, microgramme, millilitre, mL, "
    "gramme, g, unité internationale, UI, "
    "une prise par jour, matin et soir, si besoin, "

    # Conclusion
    "diagnostic, hypothèse diagnostique, prise en charge, "
    "surveillance, réévaluation, rendez-vous de contrôle, "
    "avis spécialisé, orientation, conduite à tenir."
)


@lru_cache(maxsize=1)
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


def main() -> None:
    main()
    if len(sys.argv) != 2:
        print("Utilisation · python -m app.transcription chemin_du_fichier_audio")
        sys.exit(1)

    texte = transcrire(sys.argv[1])
    print("\n--- Transcription ---\n")
    print(texte)
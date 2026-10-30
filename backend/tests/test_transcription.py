import sys
from types import SimpleNamespace

import pytest

from app import transcription


class FauxModele:

    def __init__(self, phrases):
        self.phrases = phrases
        self.audio_recu = None
        self.reglages_recus = {}

    def transcribe(self, audio, **reglages):
        self.audio_recu = audio
        self.reglages_recus = reglages
        segments = (SimpleNamespace(text=phrase) for phrase in self.phrases)
        return segments, None       # (segments, infos) comme le vrai


@pytest.fixture
def faux_modele(monkeypatch):
    modele = FauxModele([" Bonjour Jean Test. ", " Tension artérielle normale. "])
    monkeypatch.setattr(transcription, "charger_modele", lambda: modele)
    return modele


def test_recolle_les_segments(faux_modele):
    texte = transcription.transcrire("faux_audio.wav")

    assert texte == "Bonjour Jean Test. Tension artérielle normale."


def test_audio_sans_parole_donne_texte_vide(faux_modele):
    faux_modele.phrases = []  # Whisper n'a rien entendu

    texte = transcription.transcrire("silence.wav")

    assert texte == ""


def test_envoie_les_bons_reglages(faux_modele):
    transcription.transcrire("faux_audio.wav")

    assert faux_modele.audio_recu == "faux_audio.wav"
    assert faux_modele.reglages_recus["language"] == "fr"
    assert faux_modele.reglages_recus["vad_filter"] is True
    assert faux_modele.reglages_recus["beam_size"] == 5
    assert faux_modele.reglages_recus["initial_prompt"] == transcription.CONTEXTE_MEDICAL


def test_main_sans_argument_affiche_le_mode_emploi(faux_modele, monkeypatch, capsys):
    monkeypatch.setattr(sys, "argv", ["transcription"])  # rien après le nom

    with pytest.raises(SystemExit) as arret:
        transcription.main()

    assert arret.value.code == 1
    assert "Utilisation" in capsys.readouterr().out


def test_main_affiche_la_transcription(faux_modele, monkeypatch, capsys):
    monkeypatch.setattr(sys, "argv", ["transcription", "faux_audio.wav"])

    transcription.main()

    affichage = capsys.readouterr().out
    assert "--- Transcription ---" in affichage
    assert "Bonjour Jean Test. Tension artérielle normale." in affichage
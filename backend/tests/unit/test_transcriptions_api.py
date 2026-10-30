from io import BytesIO

import pytest
from fastapi.testclient import TestClient

from app import main
from app.main import app

client = TestClient(app)


@pytest.fixture
def faux_whisper(monkeypatch):
    appels = []

    def faux_transcrire(audio):
        appels.append(audio)
        return "Jean Test consulte pour une toux."

    monkeypatch.setattr(main.transcription, "transcrire", faux_transcrire)
    return appels


def test_renvoie_le_texte_transcrit(faux_whisper):
    reponse = client.post(
        "/transcriptions",
        content=b"faux audio",
        headers={"Content-Type": "audio/webm"},
    )

    assert reponse.status_code == 200
    assert reponse.json() == {"texte": "Jean Test consulte pour une toux."}


def test_audio_passe_en_memoire_et_pas_par_un_fichier(faux_whisper):
    client.post("/transcriptions", content=b"faux audio", headers={"Content-Type": "audio/webm"})

    audio_recu = faux_whisper[0]
    assert isinstance(audio_recu, BytesIO)          # un objet en mémoire, pas un chemin de fichier
    assert audio_recu.getvalue() == b"faux audio"   # exactement ce qui a été envoyé


def test_refuse_ce_qui_n_est_pas_de_l_audio(faux_whisper):
    reponse = client.post("/transcriptions", content=b"texte", headers={"Content-Type": "text/plain"})

    assert reponse.status_code == 415
    assert faux_whisper == []                       # Whisper n'a pas été appelé


def test_refuse_un_audio_vide(faux_whisper):
    reponse = client.post("/transcriptions", content=b"", headers={"Content-Type": "audio/webm"})

    assert reponse.status_code == 400
    assert faux_whisper == []


def test_refuse_un_audio_trop_gros(faux_whisper, monkeypatch):
    monkeypatch.setattr(main, "TAILLE_MAX_AUDIO", 5)  # limite minuscule pour le test

    reponse = client.post("/transcriptions", content=b"123456", headers={"Content-Type": "audio/webm"})

    assert reponse.status_code == 413
    assert faux_whisper == []
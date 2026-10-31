"""Vérifie que le vrai décodeur audio de faster-whisper lit un webm EN MÉMOIRE, comme celui du navigateur"""

from io import BytesIO

import av
import numpy as np
from faster_whisper.audio import decode_audio


def fabriquer_webm_d_une_seconde() -> bytes:
    # fabrique un petit son (un « la » de 440 Hz) au format webm/opus, sans aucun fichier
    tampon = BytesIO()
    conteneur = av.open(tampon, mode="w", format="webm")
    flux = conteneur.add_stream("libopus", rate=48000)
    flux.layout = "mono"

    temps = np.linspace(0, 1, 48000, dtype=np.float32)
    son = (0.2 * np.sin(2 * np.pi * 440 * temps)).reshape(1, -1)
    trame = av.AudioFrame.from_ndarray(son, format="flt", layout="mono")
    trame.sample_rate = 48000

    for paquet in flux.encode(trame):
        conteneur.mux(paquet)
    for paquet in flux.encode(None):  # vide ce qui reste dans l'encodeur
        conteneur.mux(paquet)
    conteneur.close()
    return tampon.getvalue()


def test_decode_un_webm_en_memoire():
    audio = decode_audio(BytesIO(fabriquer_webm_d_une_seconde()), sampling_rate=16000)

    # 1 seconde à 16 000 échantillons par seconde, à quelques échantillons près
    assert abs(len(audio) - 16000) < 400
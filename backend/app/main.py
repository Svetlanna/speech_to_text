from io import BytesIO

from fastapi import FastAPI, HTTPException, Request
from starlette.concurrency import run_in_threadpool

from app import transcription

app = FastAPI(title="Comptes-rendus médicaux dictés", version="0.2.0")

TAILLE_MAX_AUDIO = 25 * 1024 * 1024  # 25 Mo, largement assez pour une dictée de plusieurs minutes


@app.get("/sante")
def sante() -> dict[str, str]:

    return {"statut": "ok"}


@app.post("/transcriptions")
async def creer_transcription(requete: Request) -> dict[str, str]:




    type_contenu = requete.headers.get("content-type", "")
    if not type_contenu.startswith("audio/"):
        raise HTTPException(status_code=415, detail="Envoyer un fichier audio")

    # 2 · on lit l'audio EN MÉMOIRE · il n'est jamais écrit sur le disque
    contenu = await requete.body()
    if not contenu:
        raise HTTPException(status_code=400, detail="Audio vide")
    if len(contenu) > TAILLE_MAX_AUDIO:
        raise HTTPException(status_code=413, detail="Audio trop long")

    # 3 · Whisper travaille dans un fil à part, pour que l'API reste disponible pendant ce temps
    texte = await run_in_threadpool(transcription.transcrire, BytesIO(contenu))

    # 4 · on renvoie seulement le texte · l'audio disparaît à la fin de la fonction
    return {"texte": texte}
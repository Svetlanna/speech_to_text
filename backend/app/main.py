
from fastapi import FastAPI

app = FastAPI(title="Comptes-rendus médicaux dictés", version="0.1.0")


@app.get("/sante")
def sante() -> dict[str, str]:

    return {"statut": "ok"}
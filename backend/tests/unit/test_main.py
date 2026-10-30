"""Tests unitaires de l'API · sans lancer de vrai serveur"""

from fastapi.testclient import TestClient

from app.main import app

client = TestClient(app)  # un faux navigateur qui parle directement à l'API


def test_sante_repond_ok():
    reponse = client.get("/sante")

    assert reponse.status_code == 200
    assert reponse.json() == {"statut": "ok"}


def test_route_inconnue_donne_404():
    reponse = client.get("/nexiste_pas")

    assert reponse.status_code == 404
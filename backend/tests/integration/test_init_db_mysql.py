
import pymysql
import pytest

from app import init_db
from app.database import connecter

BASE_TEST = "compte_rendu_test"


def compter_lignes(table: str) -> int:
    with connecter(BASE_TEST) as connexion, connexion.cursor() as curseur:
        curseur.execute(f"SELECT COUNT(*) FROM {table}")  # table vient de notre code, pas de l'utilisateur
        return curseur.fetchone()[0]


@pytest.fixture
def base_vide():

    with connecter() as connexion, connexion.cursor() as curseur:
        curseur.execute(f"DROP DATABASE IF EXISTS `{BASE_TEST}`")
    yield BASE_TEST  # le test s'exécute ici


def test_cree_la_base_et_les_5_tables(base_vide):
    init_db.initialiser(base_vide)

    assert init_db.lister_tables(base_vide) == init_db.TABLES_ATTENDUES
    assert compter_lignes("role") == 3


def test_relancer_ne_cree_pas_de_doublon(base_vide, capsys):
    init_db.initialiser(base_vide)
    init_db.initialiser(base_vide)  # 2e fois

    assert compter_lignes("role") == 3
    assert "rien à créer" in capsys.readouterr().out


def test_recree_seulement_la_table_manquante(base_vide):
    init_db.initialiser(base_vide)
    with connecter(base_vide) as connexion, connexion.cursor() as curseur:
        curseur.execute("DROP TABLE journal_acces")

    init_db.initialiser(base_vide)

    assert "journal_acces" in init_db.lister_tables(base_vide)
    assert compter_lignes("role") == 3


def test_la_cle_etrangere_refuse_un_role_inexistant(base_vide):
    init_db.initialiser(base_vide)

    with (
        connecter(base_vide) as connexion,
        connexion.cursor() as curseur,
        pytest.raises(pymysql.err.IntegrityError, match="fk_utilisateur_role"),
    ):
        curseur.execute(
            "INSERT INTO utilisateur (identifiant, mot_de_passe_hache, nom, prenom, id_role) "
            "VALUES ('essai.test', 'x', 'Essai', 'Test', 99)"
        )
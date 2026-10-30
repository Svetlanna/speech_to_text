"""Tests unitaires de app/init_db.py · SANS MySQL (tout est simulé)"""

import pytest

from app import init_db


def test_decouper_sql_enleve_commentaires_et_coupe_aux_points_virgules():
    texte = (
        "-- un commentaire seul\n"
        "CREATE TABLE a (id INT); -- commentaire en fin de ligne\n"
        "\n"
        "INSERT INTO a VALUES (1);\n"
    )

    ordres = init_db.decouper_sql(texte)

    assert ordres == ["CREATE TABLE a (id INT)", "INSERT INTO a VALUES (1)"]


def test_decouper_sql_sur_le_vrai_schema():
    texte = init_db.FICHIER_SCHEMA.read_text(encoding="utf-8")

    ordres = init_db.decouper_sql(texte)

    assert len(ordres) == 6  # 5 CREATE TABLE + 1 INSERT des rôles
    assert ordres[0].startswith("CREATE TABLE IF NOT EXISTS role")
    assert ordres[-1].startswith("INSERT IGNORE INTO role")



@pytest.mark.parametrize("nom", ["compte_rendu", "compte_rendu_test", "Base2"])
def test_verifier_nom_base_accepte_les_noms_simples(nom):
    init_db.verifier_nom_base(nom)  # ne doit rien lever


@pytest.mark.parametrize("nom", ["x; DROP DATABASE y", "base-test", "", "a b"])
def test_verifier_nom_base_refuse_les_noms_dangereux(nom):
    with pytest.raises(ValueError):
        init_db.verifier_nom_base(nom)



@pytest.fixture
def faux_mysql(monkeypatch):
    """Simule MySQL · on choisit ce que lister_tables répond, on compte les appels"""
    etat = {"reponses_tables": [], "nb_executions": 0}

    def faux_lister_tables(nom_base):
        return etat["reponses_tables"].pop(0)  # rend la réponse suivante

    def faux_executer_schema(nom_base):
        etat["nb_executions"] += 1

    monkeypatch.setattr(init_db, "creer_base_si_absente", lambda nom_base: None)
    monkeypatch.setattr(init_db, "lister_tables", faux_lister_tables)
    monkeypatch.setattr(init_db, "executer_schema", faux_executer_schema)
    return etat


def test_initialiser_ne_fait_rien_si_tout_existe(faux_mysql, capsys):
    faux_mysql["reponses_tables"] = [set(init_db.TABLES_ATTENDUES)]

    init_db.initialiser("compte_rendu_test")

    assert faux_mysql["nb_executions"] == 0
    assert "rien à créer" in capsys.readouterr().out


def test_initialiser_execute_le_schema_si_une_table_manque(faux_mysql, capsys):
    toutes = set(init_db.TABLES_ATTENDUES)
    faux_mysql["reponses_tables"] = [toutes - {"journal_acces"}, toutes]  # avant, après

    init_db.initialiser("compte_rendu_test")

    assert faux_mysql["nb_executions"] == 1
    sortie = capsys.readouterr().out
    assert "journal_acces" in sortie
    assert "5 tables sont prêtes" in sortie


def test_initialiser_arrete_avec_erreur_si_le_schema_echoue(faux_mysql):
    faux_mysql["reponses_tables"] = [set(), set()]  # toujours rien, même après

    with pytest.raises(SystemExit) as arret:
        init_db.initialiser("compte_rendu_test")

    assert arret.value.code == 1
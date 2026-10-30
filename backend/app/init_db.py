
import re
import sys
from pathlib import Path

from app import config
from app.database import connecter

TABLES_ATTENDUES = {"role", "utilisateur", "patient", "compte_rendu", "journal_acces"}

FICHIER_SCHEMA = Path(__file__).resolve().parent.parent / "sql" / "schema.sql"


def verifier_nom_base(nom_base: str) -> None:
    if not re.fullmatch(r"[A-Za-z0-9_]+", nom_base):
        raise ValueError(f"Nom de base refusé · {nom_base!r}")


def creer_base_si_absente(nom_base: str) -> None:
    verifier_nom_base(nom_base)
    with connecter() as connexion, connexion.cursor() as curseur:
        curseur.execute(
            f"CREATE DATABASE IF NOT EXISTS `{nom_base}` "
            "CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci"
        )


def lister_tables(nom_base: str) -> set[str]:
    with connecter(nom_base) as connexion, connexion.cursor() as curseur:
        curseur.execute(
            "SELECT table_name FROM information_schema.tables WHERE table_schema = %s",
            (nom_base,),
        )
        return {ligne[0].lower() for ligne in curseur.fetchall()}


def decouper_sql(texte: str) -> list[str]:
    lignes = [ligne.split("--", 1)[0] for ligne in texte.splitlines()]
    ordres = "\n".join(lignes).split(";")
    return [ordre.strip() for ordre in ordres if ordre.strip()]


def executer_schema(nom_base: str) -> None:
    texte = FICHIER_SCHEMA.read_text(encoding="utf-8")
    with connecter(nom_base) as connexion, connexion.cursor() as curseur:
        for ordre in decouper_sql(texte):
            curseur.execute(ordre)


def initialiser(nom_base: str) -> None:
    print(f"Base · {nom_base}")

    creer_base_si_absente(nom_base)

    manquantes = TABLES_ATTENDUES - lister_tables(nom_base)   # différence de 2 ensembles
    if not manquantes:
        print(" Les 5 tables existent déjà · rien à créer")
        return

    print(f"Tables manquantes · {', '.join(sorted(manquantes))}")
    executer_schema(nom_base)

    encore_manquantes = TABLES_ATTENDUES - lister_tables(nom_base)
    if encore_manquantes:
        print(f" Toujours manquantes · {', '.join(sorted(encore_manquantes))}")
        sys.exit(1)
    print(" Schéma créé · les 5 tables sont prêtes")


def main() -> None:
    nom_base = sys.argv[1] if len(sys.argv) > 1 else config.DB_NOM
    initialiser(nom_base)


if __name__ == "__main__":
    main()
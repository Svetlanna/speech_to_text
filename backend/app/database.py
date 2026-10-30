import pymysql

from app import config


def connecter(nom_base: str | None = None) -> pymysql.connections.Connection:
    return pymysql.connect(
        host=config.DB_HOTE,
        port=config.DB_PORT,
        user=config.DB_UTILISATEUR,
        password=config.DB_MOT_DE_PASSE,
        database=nom_base,
        charset="utf8mb4",
        autocommit=True,
    )

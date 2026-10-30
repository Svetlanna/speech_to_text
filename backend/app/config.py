
import os

from dotenv import load_dotenv

load_dotenv()

DB_HOTE = os.getenv("DB_HOTE", "localhost")
DB_PORT = int(os.getenv("DB_PORT", "3333")) 
DB_UTILISATEUR = os.getenv("DB_UTILISATEUR", "root")
DB_MOT_DE_PASSE = os.getenv("DB_MOT_DE_PASSE", "")
DB_NOM = os.getenv("DB_NOM", "compte_rendu")
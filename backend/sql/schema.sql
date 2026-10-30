
CREATE TABLE IF NOT EXISTS role (
    id_role INT         NOT NULL AUTO_INCREMENT,
    libelle VARCHAR(30) NOT NULL,
    CONSTRAINT pk_role PRIMARY KEY (id_role),
    CONSTRAINT uq_role_libelle UNIQUE (libelle)
) ENGINE = InnoDB;

CREATE TABLE IF NOT EXISTS utilisateur (
    id_utilisateur     INT          NOT NULL AUTO_INCREMENT,
    identifiant        VARCHAR(50)  NOT NULL,
    mot_de_passe_hache VARCHAR(255) NOT NULL,
    nom                VARCHAR(100) NOT NULL,
    prenom             VARCHAR(100) NOT NULL,
    actif              BOOLEAN      NOT NULL DEFAULT TRUE,
    date_creation      DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
    id_role            INT          NOT NULL,
    CONSTRAINT pk_utilisateur PRIMARY KEY (id_utilisateur),
    CONSTRAINT uq_utilisateur_identifiant UNIQUE (identifiant),
    CONSTRAINT fk_utilisateur_role FOREIGN KEY (id_role) REFERENCES role (id_role)
) ENGINE = InnoDB;


CREATE TABLE IF NOT EXISTS patient (
    id_patient     INT                  NOT NULL AUTO_INCREMENT,
    numero_dossier VARCHAR(20)          NOT NULL,
    nom            VARCHAR(100)         NOT NULL,
    prenom         VARCHAR(100)         NOT NULL,
    date_naissance DATE                 NOT NULL,
    sexe           ENUM ('F', 'M', 'I') NOT NULL,
    CONSTRAINT pk_patient PRIMARY KEY (id_patient),
    CONSTRAINT uq_patient_dossier UNIQUE (numero_dossier)
) ENGINE = InnoDB;


CREATE TABLE IF NOT EXISTS compte_rendu (
    id_compte_rendu   INT                          NOT NULL AUTO_INCREMENT,
    date_consultation DATETIME                     NOT NULL,
    motif             TEXT                         NULL,
    antecedents       TEXT                         NULL,
    examen            TEXT                         NULL,
    conclusion        TEXT                         NULL,
    traitement        TEXT                         NULL,
    texte_transcrit   TEXT                         NULL,
    statut            ENUM ('brouillon', 'valide') NOT NULL DEFAULT 'brouillon',
    date_creation     DATETIME                     NOT NULL DEFAULT CURRENT_TIMESTAMP,
    date_modification DATETIME                     NOT NULL DEFAULT CURRENT_TIMESTAMP
                                                   ON UPDATE CURRENT_TIMESTAMP,
    id_utilisateur    INT                          NOT NULL,
    id_patient        INT                          NOT NULL,
    CONSTRAINT pk_compte_rendu PRIMARY KEY (id_compte_rendu),
    CONSTRAINT fk_cr_utilisateur FOREIGN KEY (id_utilisateur) REFERENCES utilisateur (id_utilisateur),
    CONSTRAINT fk_cr_patient     FOREIGN KEY (id_patient)     REFERENCES patient (id_patient)
) ENGINE = InnoDB;


CREATE TABLE IF NOT EXISTS journal_acces (
    id_journal      BIGINT      NOT NULL AUTO_INCREMENT,
    action          VARCHAR(50) NOT NULL,
    date_action     DATETIME    NOT NULL DEFAULT CURRENT_TIMESTAMP,
    id_utilisateur  INT         NOT NULL,
    id_compte_rendu INT         NULL,
    CONSTRAINT pk_journal PRIMARY KEY (id_journal),
    CONSTRAINT fk_journal_utilisateur  FOREIGN KEY (id_utilisateur)  REFERENCES utilisateur (id_utilisateur),
    CONSTRAINT fk_journal_compte_rendu FOREIGN KEY (id_compte_rendu) REFERENCES compte_rendu (id_compte_rendu)
) ENGINE = InnoDB;


INSERT IGNORE INTO role (id_role, libelle) VALUES
    (1, 'administrateur'),
    (2, 'medecin'),
    (3, 'secretaire');



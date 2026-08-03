-- CreateEnum
CREATE TYPE "StatutContrat" AS ENUM ('BROUILLON', 'EN_COURS', 'TERMINE', 'ANNULE');

-- CreateEnum
CREATE TYPE "StatutJalon" AS ENUM ('EN_ATTENTE_FINANCEMENT', 'FINANCE', 'EN_REVISION', 'VALIDE', 'PAYE');

-- CreateTable
CREATE TABLE "Utilisateur" (
    "id" SERIAL NOT NULL,
    "email" TEXT NOT NULL,
    "motDePasse" TEXT NOT NULL,
    "nom" TEXT NOT NULL,
    "role" TEXT NOT NULL,

    CONSTRAINT "Utilisateur_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Freelance" (
    "id" INTEGER NOT NULL,
    "titreProfessionnel" TEXT,
    "competences" TEXT,
    "cvUrl" TEXT,
    "portfolioUrl" TEXT,
    "noteMoyenne" DOUBLE PRECISION NOT NULL DEFAULT 0.0,
    "estValide" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "Freelance_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Entreprise" (
    "id" INTEGER NOT NULL,
    "nomEntreprise" TEXT NOT NULL,
    "description" TEXT,
    "matriculeFiscal" TEXT,
    "registreCommerce" TEXT,
    "adresseSiege" TEXT,
    "telephonePro" TEXT,
    "siteWeb" TEXT,
    "estVerifie" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "Entreprise_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Mission" (
    "id" SERIAL NOT NULL,
    "titre" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "budget" DOUBLE PRECISION NOT NULL,
    "competences" TEXT,
    "statut" TEXT NOT NULL DEFAULT 'OUVERT',
    "dateCreation" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "stripePaymentIntentId" TEXT,
    "entrepriseId" INTEGER NOT NULL,

    CONSTRAINT "Mission_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Candidature" (
    "id" SERIAL NOT NULL,
    "statut" TEXT NOT NULL DEFAULT 'EN_ATTENTE',
    "datePostulation" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "missionId" INTEGER NOT NULL,
    "freelanceId" INTEGER NOT NULL,

    CONSTRAINT "Candidature_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Avis" (
    "id" SERIAL NOT NULL,
    "note" DOUBLE PRECISION NOT NULL,
    "commentaire" TEXT NOT NULL,
    "dateCreation" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "freelanceId" INTEGER NOT NULL,
    "entrepriseId" INTEGER NOT NULL,

    CONSTRAINT "Avis_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Message" (
    "id" SERIAL NOT NULL,
    "expediteurId" INTEGER NOT NULL,
    "recepteurId" INTEGER NOT NULL,
    "contenu" TEXT NOT NULL,
    "dateEnvoi" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Message_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Contrat" (
    "id" SERIAL NOT NULL,
    "titre" TEXT NOT NULL,
    "description" TEXT,
    "montantTotal" DOUBLE PRECISION NOT NULL,
    "statut" "StatutContrat" NOT NULL DEFAULT 'EN_COURS',
    "freelanceId" INTEGER NOT NULL,
    "entrepriseId" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Contrat_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Jalon" (
    "id" SERIAL NOT NULL,
    "titre" TEXT NOT NULL,
    "description" TEXT,
    "montant" DOUBLE PRECISION NOT NULL,
    "pourcentage" DOUBLE PRECISION,
    "statut" "StatutJalon" NOT NULL DEFAULT 'EN_ATTENTE_FINANCEMENT',
    "livrableUrl" TEXT,
    "stripePaymentIntentId" TEXT,
    "contratId" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Jalon_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Utilisateur_email_key" ON "Utilisateur"("email");

-- CreateIndex
CREATE UNIQUE INDEX "Entreprise_matriculeFiscal_key" ON "Entreprise"("matriculeFiscal");

-- CreateIndex
CREATE UNIQUE INDEX "Candidature_missionId_freelanceId_key" ON "Candidature"("missionId", "freelanceId");

-- CreateIndex
CREATE INDEX "Avis_freelanceId_idx" ON "Avis"("freelanceId");

-- CreateIndex
CREATE INDEX "Avis_entrepriseId_idx" ON "Avis"("entrepriseId");

-- AddForeignKey
ALTER TABLE "Freelance" ADD CONSTRAINT "Freelance_id_fkey" FOREIGN KEY ("id") REFERENCES "Utilisateur"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Entreprise" ADD CONSTRAINT "Entreprise_id_fkey" FOREIGN KEY ("id") REFERENCES "Utilisateur"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Mission" ADD CONSTRAINT "Mission_entrepriseId_fkey" FOREIGN KEY ("entrepriseId") REFERENCES "Entreprise"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Candidature" ADD CONSTRAINT "Candidature_missionId_fkey" FOREIGN KEY ("missionId") REFERENCES "Mission"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Candidature" ADD CONSTRAINT "Candidature_freelanceId_fkey" FOREIGN KEY ("freelanceId") REFERENCES "Freelance"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Avis" ADD CONSTRAINT "Avis_freelanceId_fkey" FOREIGN KEY ("freelanceId") REFERENCES "Freelance"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Avis" ADD CONSTRAINT "Avis_entrepriseId_fkey" FOREIGN KEY ("entrepriseId") REFERENCES "Entreprise"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Message" ADD CONSTRAINT "FK_Message_Expediteur" FOREIGN KEY ("expediteurId") REFERENCES "Utilisateur"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Message" ADD CONSTRAINT "FK_Message_Recepteur" FOREIGN KEY ("recepteurId") REFERENCES "Utilisateur"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Contrat" ADD CONSTRAINT "Contrat_freelanceId_fkey" FOREIGN KEY ("freelanceId") REFERENCES "Freelance"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Contrat" ADD CONSTRAINT "Contrat_entrepriseId_fkey" FOREIGN KEY ("entrepriseId") REFERENCES "Entreprise"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Jalon" ADD CONSTRAINT "Jalon_contratId_fkey" FOREIGN KEY ("contratId") REFERENCES "Contrat"("id") ON DELETE CASCADE ON UPDATE CASCADE;

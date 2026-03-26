# TokenWTS Vault - TODO

## Authentification
- [x] Page de connexion ultra-esthétique avec animations
- [x] Code d'accès "DEDEJTEDOX123#" avec effet de déverrouillage animé
- [x] Animation de particules / fond animé sur la page de login
- [x] Effet de transition spectaculaire après connexion réussie
- [x] Protection de toutes les routes derrière le code d'accès

## Gestionnaire de fichiers
- [x] Explorateur de fichiers style Windows (arborescence)
- [x] Sidebar gauche avec fichiers récemment utilisés
- [x] Bouton "Voir tous les fichiers" (vue globale)
- [x] Bouton "+" pour déposer un fichier dans n'importe quel dossier
- [x] Création de dossier
- [x] Suppression de fichier/dossier
- [x] Renommage de fichier/dossier
- [x] Affichage des informations d'un fichier (taille, date, type)
- [x] Upload de fichiers vers S3
- [x] Prévisualisation des fichiers (images, vidéos, PDF)
- [x] Téléchargement de fichiers

## Base de données
- [x] Table `vault_items` (fichiers et dossiers)
- [x] Migration SQL appliquée
- [x] Routes tRPC : list, create, rename, delete, move, getInfo
- [x] Route tRPC : upload (base64 → S3)

## Design & Animations
- [x] Thème sombre ultra-esthétique (violet/bleu/noir)
- [x] Animations framer-motion sur tous les éléments
- [x] Effet de glassmorphism sur les panneaux
- [x] Particules animées en arrière-plan
- [x] Animations de hover sur les fichiers
- [x] Transitions de page fluides
- [x] Polices premium (Google Fonts)

## Tests
- [x] Tests vitest pour les routes tRPC fichiers
- [x] Test d'authentification par code

## Configuration
- [x] vercel.json pour déploiement Vercel
- [x] Variables d'environnement documentées

# PronoNexa - Application de Pronostics de Football

Application web simple pour les pronostics de matchs de football de l'école.

## Stack Technique

- **Next.js 14** (App Router)
- **MongoDB** avec **Mongoose**
- **TypeScript**
- **Tailwind CSS**

## Installation

1. Installer les dépendances :
```bash
npm install
```

2. Créer un fichier `.env.local` à la racine du projet :
```
MONGODB_URI=mongodb://localhost:27017/prono-nexa
# ou votre URI MongoDB
```

3. Lancer le serveur de développement :
```bash
npm run dev
```

## Fonctionnalités

- Création d'utilisateur simple (username uniquement)
- Création de matchs (mode admin)
- Pronostics sur les matchs (score exact, meilleur buteur, résultat)
- Calcul automatique des points
- Classement des utilisateurs

## Structure du Projet

- `/app` - Pages et routes API Next.js
- `/lib/models` - Modèles Mongoose
- `/lib/utils` - Utilitaires (connexion DB, calcul des points)
- `/components` - Composants React réutilisables

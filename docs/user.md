# Documentation Utilisateur — Forme

> **Version :** 0.1.0 — **Date :** 12 juin 2026

---

## Table des matières

- [Qu'est-ce que Forme ?](#quest-ce-que-forme-)
- [Démarrage rapide](#démarrage-rapide)
- [Dashboard](#dashboard)
- [Séances (Workouts)](#séances-workouts)
- [Stats](#stats)
- [Coach IA](#coach-ia)
- [Réglages](#réglages)
- [Conseils d'utilisation](#conseils-dutilisation)

---

## Qu'est-ce que Forme ?

**Forme** est un coach sportif IA connecté à **Strava** et propulsé par **Mistral AI**. Il permet aux coureurs et sportifs de :

- **Importer automatiquement** leurs séances Strava (course, vélo, natation, etc.)
- **Visualiser** leurs données détaillées (distance, FC, allure, puissance, splits)
- **Analyser** leurs performances avec des graphiques mensuels
- **Dialoguer** avec un coach IA qui connaît leur historique d'entraînement

Le coach parle français, donne des conseils concrets et actionnables, et adapte ses recommandations à votre profil et vos objectifs.

---

## Démarrage rapide

### 1. Créer un compte

1. Rendez-vous sur [forme.app](https://forme.vercel.app)
2. Cliquez sur **Créer un compte**
3. Entrez votre **email** et un **mot de passe**
4. Vous êtes redirigé vers le tableau de bord

### 2. Connecter Strava

1. Depuis le tableau de bord, cliquez sur **Se connecter avec Strava**
2. Autorisez l'application Forme sur Strava
3. La synchronisation démarre automatiquement

Vos **30 dernières activités Strava** sont importées immédiatement. Vous pouvez ensuite lancer une sync manuelle à tout moment.

---

## Dashboard

Le tableau de bord est votre vue d'ensemble :

- **Message de bienvenue** avec votre nom
- **Carte de connexion Strava** (si non connecté)
- **Dernières séances** : les 5 dernières activités, cliquables pour voir le détail
- **Bouton Sync Strava** : déclenche une mise à jour manuelle
- **Lien vers le Coach IA** : accès rapide au chat

---

## Séances (Workouts)

### Liste des séances

Accessible depuis l'onglet **Séances** dans la navigation. Affiche les 50 dernières activités avec :

- Icône du sport (course, vélo, natation, etc.)
- Nom de l'activité
- Distance, durée, FC moyenne
- Calories dépensées

### Détail d'une séance

Cliquez sur une séance pour voir ses métriques complètes :

| Métrique | Description |
|---|---|
| Distance | En kilomètres |
| Durée | Temps de mouvement |
| FC moyenne | Fréquence cardiaque (bpm) |
| FC max | Fréquence cardiaque maximale |
| Allure | Pour les activités de course (min/km) |
| Vitesse moyenne | Pour vélo et autres (km/h) |
| Dénivelé | D+ total en mètres |
| Cadence | En pas par minute (spm) |
| Puissance | Moyenne et max (watts) |
| Calories | Dépense énergétique (kcal) |

**Temps intermédiaires (splits)** : un tableau détaille chaque kilomètre (temps, allure, FC, dénivelé) quand la donnée est disponible depuis Strava.

---

## Stats

Accessible depuis l'onglet **Stats**. Vue globale de toutes vos données :

### Cartes de synthèse

- **Total kilomètres** parcourus
- **Temps total** d'activité
- **FC moyenne** sur l'ensemble des séances
- **Calories** brûlées

### Graphique mensuel

Un histogramme de la **distance par mois** (Recharts) pour visualiser votre évolution dans le temps.

---

## Coach IA

Accessible depuis l'onglet **Coach**. Interface de chat avec votre coach sportif IA.

### Comment ça marche

1. Le coach connaît vos **10 dernières séances** (importées depuis Strava)
2. Il a accès à votre **contexte** que vous avez paramétré (objectifs, contraintes, etc.)
3. Vous pouvez lui poser des questions en français
4. Il répond en **Markdown** (gras, listes, tableaux) pour des réponses structurées

### Exemples de questions

- "Analyse ma dernière semaine d'entraînement"
- "Que penser de ma séance d'hier ?"
- "Conseils pour progresser en course"
- "Je vise un semi-marathon dans 3 mois, quel plan me conseilles-tu ?"
- "Pourquoi ma FC était élevée sur ma dernière sortie ?"

### Streaming

Les réponses arrivent en temps réel (streaming SSE) : le texte s'affiche progressivement, comme une conversation. Vous pouvez voir s'écrire la réponse du coach sans attendre la fin.

### Historique

Le coach garde l'historique de votre conversation. En rechargeant la page, vous retrouvez vos échanges précédents dans la session la plus récente.

---

## Réglages

Accessible depuis l'onglet **Réglages**.

### Profil

- **Email** : votre adresse de connexion
- **Nom d'affichage** : nom utilisé pour le message de bienvenue

### Connexions

- **Strava** : voir le statut de connexion (connecté/déconnecté)
- Possibilité de connecter Strava si ce n'est pas encore fait

### Contexte Coach IA

Éditeur de texte libre qui permet de fournir un **contexte persistant** au coach IA. Ce contexte est injecté dans chaque conversation.

Ce champ est idéal pour :

- Vos objectifs d'entraînement (ex: "je prépare un marathon en 3h30")
- Vos contraintes (ex: "je ne peux courir que le matin")
- Notes sur vos séances passées (ex: "j'ai été malade la semaine dernière")
- Résumé de conversations avec d'autres assistants (Gemini, ChatGPT)
- Vos allures de référence, vos zones FC, etc.

Ne pas hésiter à le mettre à jour régulièrement pour que le coach reste adapté à votre situation actuelle.

---

## Conseils d'utilisation

### Bien paramétrer le contexte coach

La qualité des réponses du coach IA dépend beaucoup de la qualité du contexte que vous lui fournissez. Voici un modèle de ce que vous pouvez écrire :

```
=== Objectifs ===
- Semi-marathon en septembre 2026, objectif : < 1h45
- Maintenir 3 séances/semaine

=== Profil ===
- Coureur depuis 2 ans
- FC max : 188 bpm
- Zones FC : Z2 140-155, Z3 155-170, Z4 170-180

=== Allures de référence ===
- Endurance fondamentale (Z2) : 5:45/km
- Seuil (Z4) : 4:50/km
- VMA : 4:10/km

=== Contraintes ===
- Disponible pour courir : mardi/jeudi/dimanche
- Genou droit sensible, éviter le bitume si possible
- Matériel : montre Garmin Forerunner 255
```

### Synchronisation

- La sync est **automatique** lors de la connexion Strava
- Utilisez le bouton **Sync Strava** sur le dashboard pour rafraîchir après une séance
- Les 30 dernières activités sont importées à chaque sync
- Les splits par kilomètre sont récupérés et mis à jour

### Notes

- Le coach IA utilise le modèle Mistral Small — il est conçu pour être utile et précis, mais en cas de doute sur une décision d'entraînement importante, consultez un vrai coach sportif ou un médecin du sport.
- Forme ne remplace pas un avis médical. Consultez un professionnel de santé avant de commencer un nouveau programme sportif.

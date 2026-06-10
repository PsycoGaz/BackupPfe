# Cahier des Charges - Application RH Gestion des Demandes de Formation

## 1. Contexte et Objectifs

### 1.1 Contexte
Application web RH permettant la gestion complète des demandes de formation dans l'entreprise, avec un workflow de validation multi-niveaux et un assistant IA.

### 1.2 Objectifs
- Permettre aux employés de créer des demandes de formation
- Permettre aux managers de gérer les demandes de leur équipe
- Permettre aux RH de valider les demandes et gérer le catalogue
- Automatiser le workflow de validation avec Camunda BPMN
- Offrir un assistant IA (Gemini) pour faciliter la création de demandes

## 2. Périmètre Fonctionnel

### 2.1 Rôles et Permissions

| Rôle | Permissions |
|------|-------------|
| EMPLOYEE | Créer demande, voir ses demandes, utiliser le chat |
| MANAGER | Créer demande perso/équipe, valider/refuser demandes équipe |
| RH | Voir toutes les demandes, valider/refuser après manager, gérer catalogue |
| ADMIN | Gérer utilisateurs et rôles |

### 2.2 Fonctionnalités par rôle

#### Employé
- Se connecter
- Consulter son tableau de bord
- Créer une demande de formation (catalogue ou nouvelle)
- Suivre l'état de ses demandes
- Utiliser le chat IA

#### Manager
- Toutes les fonctionnalités employé
- Créer une demande groupée pour son équipe
- Voir les demandes de son équipe
- Valider/refuser avec commentaire

#### RH
- Voir toutes les demandes
- Valider/refuser après validation manager
- Gérer le catalogue de formations (CRUD)
- Consulter l'historique des décisions

#### Admin
- Gérer les utilisateurs (CRUD)
- Gérer les rôles

### 2.3 États d'une demande
```
BROUILLON → EN_ATTENTE_MANAGER → APPROUVEE / REFUSEE_MANAGER
EN_ATTENTE_MANAGER → EN_ATTENTE_RH → APPROUVEE / REFUSEE_RH
ANNULEE (à tout moment par le créateur si pas encore approuvée)
```

### 2.4 Types de demandes
- **CATALOGUE** : formation existante dans le catalogue
- **NOUVELLE** : formation libre saisie par l'utilisateur

### 2.5 Portée des demandes
- **INDIVIDUAL** : pour soi-même
- **TEAM** : pour plusieurs membres d'une équipe (créée par manager)

## 3. Stack Technique

| Composant | Technologie |
|-----------|-------------|
| Backend | NestJS (Node.js + TypeScript) |
| Frontend | React + TypeScript |
| Base de données | PostgreSQL |
| ORM | TypeORM |
| Authentification | JWT + bcrypt |
| Workflow | Camunda Platform 7 (REST API) |
| IA | Google Gemini API |
| Validation | class-validator (backend), Zod (frontend) |
| CSS | Tailwind CSS |
| HTTP Client | Axios |
| Formulaires | React Hook Form |
| Routing | React Router v6 |

## 4. Architecture Globale

```
┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│   React     │────▶│   NestJS    │────▶│ PostgreSQL  │
│  Frontend   │     │   Backend   │     │             │
└─────────────┘     └──────┬──────┘     └─────────────┘
                           │
                    ┌──────┼──────┐
                    │      │      │
               ┌────▼──┐ ┌▼────┐ ┌▼────────┐
               │Camunda│ │Gemini│ │ bcrypt  │
               │  REST │ │ API  │ │  JWT    │
               └───────┘ └─────┘ └─────────┘
```

## 5. Workflows BPMN

### Workflow 1 : Demande individuelle employé
1. Start → Création demande → Validation Manager → [Approuvé?]
   - Non → REFUSEE_MANAGER → End
   - Oui → Validation RH → [Approuvé?]
     - Non → REFUSEE_RH → End
     - Oui → APPROUVEE → End

### Workflow 2 : Demande manager (perso ou équipe)
1. Start → Création demande → Validation RH → [Approuvé?]
   - Non → REFUSEE_RH → End
   - Oui → APPROUVEE → End

## 6. Chat IA (Gemini)

### Intentions détectées
- `CREATE_TRAINING_REQUEST` : créer une demande
- `RECOMMEND_FORMATIONS` : recommander des formations
- `GENERATE_JUSTIFICATION` : générer une justification

### Flux chat
1. Utilisateur envoie un message
2. Gemini analyse l'intention et extrait les données
3. Retour d'un JSON structuré
4. Confirmation utilisateur avant action

## 7. Sécurité
- Hash bcrypt des mots de passe
- JWT avec expiration (24h)
- Guards NestJS pour auth et rôles
- Validation des entrées (class-validator)
- Protection CORS
- Rate limiting sur les endpoints sensibles

## 8. Hors périmètre MVP
- Power BI / Grafana
- Analytics avancés
- Skill gap analysis
- Scoring IA / prédiction
- Gamification
- Docker (pour le moment)
- Notifications email/push

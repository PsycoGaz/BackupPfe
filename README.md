# HR Training App - Gestion des Demandes de Formation

## Stack technique
- **Backend** : NestJS + TypeORM + PostgreSQL
- **Frontend** : React + TypeScript + Tailwind CSS
- **Workflow** : Camunda BPMN Platform 7
- **IA** : Google Gemini API
- **Auth** : JWT + bcrypt

## Structure du projet

```
hr-training-app/
├── backend/          # NestJS API
├── frontend/         # React SPA
├── database/         # Scripts SQL
├── bpmn/             # Fichiers BPMN Camunda
├── docs/             # Documentation
└── .github/          # CI/CD
```

## Prérequis
- Node.js 20+
- PostgreSQL 15+
- Camunda Platform 7 (optionnel pour dev)
- Clé API Google Gemini

## Installation

### Base de données
```bash
# Créer la base
createdb hr_training

# Exécuter le script d'initialisation
psql -d hr_training -f database/init.sql
```

### Backend
```bash
cd backend
cp .env.example .env
# Éditer .env avec vos configurations
npm install
npm run start:dev
```

### Frontend
```bash
cd frontend
npm install
npm run dev
```

## Comptes de test
| Email | Mot de passe | Rôle |
|-------|-------------|------|
| admin@company.com | password123 | ADMIN |
| rh@company.com | password123 | RH |
| manager@company.com | password123 | MANAGER |
| employee1@company.com | password123 | EMPLOYEE |
| employee2@company.com | password123 | EMPLOYEE |

## API Endpoints

### Auth
- `POST /api/auth/login`
- `POST /api/auth/register`

### Users
- `GET /api/users` (RH/ADMIN)
- `GET /api/users/me`
- `GET /api/users/team` (MANAGER)

### Formations
- `GET /api/formations`
- `POST /api/formations` (RH)
- `PATCH /api/formations/:id` (RH)
- `DELETE /api/formations/:id` (RH)

### Training Requests
- `GET /api/training-requests`
- `GET /api/training-requests/:id`
- `POST /api/training-requests`
- `POST /api/training-requests/team` (MANAGER)
- `PATCH /api/training-requests/:id/cancel`

### Decisions
- `GET /api/manager/tasks` (MANAGER)
- `POST /api/manager/tasks/:id/approve` (MANAGER)
- `POST /api/manager/tasks/:id/reject` (MANAGER)
- `GET /api/rh/tasks` (RH)
- `POST /api/rh/tasks/:id/approve` (RH)
- `POST /api/rh/tasks/:id/reject` (RH)

### Chat IA
- `POST /api/chat/message`
- `POST /api/chat/recommend-formations`
- `POST /api/chat/generate-justification`
- `GET /api/chat/history`

## Conventions Git
- `main` : production
- `dev` : développement
- `feature/xxx` : nouvelles fonctionnalités
- `fix/xxx` : corrections

### Format des commits
```
type(scope): description

feat(auth): add JWT authentication
fix(requests): fix status transition bug
docs(readme): update API documentation
```

## Déploiement
- **Backend** : VPS / serveur Node.js (PM2)
- **Frontend** : Vercel / Netlify
- **BDD** : PostgreSQL managé ou local
- **Camunda** : serveur dédié

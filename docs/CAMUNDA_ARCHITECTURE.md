# Architecture Camunda BPMN

## Vue d'ensemble

Camunda Platform 7 est utilisé en mode **external REST API**. Le moteur Camunda tourne en standalone et NestJS communique avec lui via l'API REST.

## Installation Camunda

Télécharger Camunda Platform 7 Run :
```bash
# Télécharger depuis https://camunda.com/download/platform-7/
# Extraire et lancer :
./start.sh  # Linux/Mac
start.bat    # Windows
```

Camunda sera accessible sur `http://localhost:8080`

## Endpoints REST Camunda utilisés

| Action | Méthode | URL |
|--------|---------|-----|
| Déployer un process | POST | `/engine-rest/deployment/create` |
| Démarrer un process | POST | `/engine-rest/process-definition/key/{key}/start` |
| Lister les tâches | GET | `/engine-rest/task` |
| Compléter une tâche | POST | `/engine-rest/task/{taskId}/complete` |
| Variables d'un process | GET | `/engine-rest/process-instance/{id}/variables` |

## Variables BPMN

| Variable | Type | Description |
|----------|------|-------------|
| requestId | String | ID de la demande dans PostgreSQL |
| createdBy | String | ID de l'utilisateur créateur |
| managerId | String | ID du manager assigné |
| approved | Boolean | Résultat de la décision |
| decisionComment | String | Commentaire de la décision |

## Flux de synchronisation NestJS ↔ Camunda

1. **Création demande** : NestJS crée en BDD → démarre process Camunda → stocke processInstanceId
2. **Récupération tâches** : NestJS interroge Camunda pour les tâches assignées à un user
3. **Complétion tâche** : NestJS envoie la décision → met à jour le statut en BDD
4. **Cohérence** : Le statut PostgreSQL est la source de vérité, Camunda gère le flux

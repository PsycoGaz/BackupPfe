-- ============================================
-- Application RH - Formation Management
-- Script de création de la base de données
-- PostgreSQL
-- ============================================

-- Suppression des tables existantes (ordre inverse des dépendances)
DROP TABLE IF EXISTS chat_messages CASCADE;
DROP TABLE IF EXISTS request_decisions CASCADE;
DROP TABLE IF EXISTS training_request_participants CASCADE;
DROP TABLE IF EXISTS training_requests CASCADE;
DROP TABLE IF EXISTS formations CASCADE;
DROP TABLE IF EXISTS users CASCADE;

-- Suppression des types enum existants
DROP TYPE IF EXISTS user_role CASCADE;
DROP TYPE IF EXISTS request_type CASCADE;
DROP TYPE IF EXISTS request_scope CASCADE;
DROP TYPE IF EXISTS request_status CASCADE;
DROP TYPE IF EXISTS participant_status CASCADE;
DROP TYPE IF EXISTS decision_role CASCADE;
DROP TYPE IF EXISTS decision_type CASCADE;
DROP TYPE IF EXISTS chat_intent CASCADE;

-- ============================================
-- ENUMS
-- ============================================

CREATE TYPE user_role AS ENUM ('EMPLOYEE', 'MANAGER', 'RH', 'ADMIN');

CREATE TYPE request_type AS ENUM ('CATALOGUE', 'NOUVELLE');

CREATE TYPE request_scope AS ENUM ('INDIVIDUAL', 'TEAM');

CREATE TYPE request_status AS ENUM (
  'BROUILLON',
  'EN_ATTENTE_MANAGER',
  'REFUSEE_MANAGER',
  'EN_ATTENTE_RH',
  'REFUSEE_RH',
  'APPROUVEE',
  'ANNULEE'
);

CREATE TYPE participant_status AS ENUM ('PENDING', 'CONFIRMED', 'CANCELLED');

CREATE TYPE decision_role AS ENUM ('MANAGER', 'RH');

CREATE TYPE decision_type AS ENUM ('APPROVED', 'REJECTED');

CREATE TYPE chat_intent AS ENUM (
  'CREATE_TRAINING_REQUEST',
  'RECOMMEND_FORMATIONS',
  'GENERATE_JUSTIFICATION',
  'GENERAL'
);

-- ============================================
-- TABLE: users
-- ============================================

CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  first_name VARCHAR(100) NOT NULL,
  last_name VARCHAR(100) NOT NULL,
  email VARCHAR(255) NOT NULL UNIQUE,
  password_hash VARCHAR(255) NOT NULL,
  role user_role NOT NULL DEFAULT 'EMPLOYEE',
  manager_id UUID REFERENCES users(id) ON DELETE SET NULL,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- Index sur email pour login rapide
CREATE INDEX idx_users_email ON users(email);
-- Index sur manager_id pour requêtes d'équipe
CREATE INDEX idx_users_manager_id ON users(manager_id);
-- Index sur le rôle
CREATE INDEX idx_users_role ON users(role);

-- ============================================
-- TABLE: formations (catalogue)
-- ============================================

CREATE TABLE formations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  domain VARCHAR(100) NOT NULL,
  description TEXT,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- Index sur le domaine pour filtrage
CREATE INDEX idx_formations_domain ON formations(domain);
-- Index sur is_active pour ne montrer que les formations actives
CREATE INDEX idx_formations_active ON formations(is_active);

-- ============================================
-- TABLE: training_requests
-- ============================================

CREATE TABLE training_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  request_type request_type NOT NULL,
  request_scope request_scope NOT NULL DEFAULT 'INDIVIDUAL',
  created_by UUID NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
  formation_id UUID REFERENCES formations(id) ON DELETE SET NULL,
  custom_formation_name VARCHAR(255),
  domain VARCHAR(100),
  desired_start_date DATE NOT NULL,
  desired_end_date DATE,
  justification TEXT,
  status request_status NOT NULL DEFAULT 'BROUILLON',
  camunda_process_instance_id VARCHAR(255),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),

  -- Contrainte : si CATALOGUE, formation_id doit être renseigné
  -- si NOUVELLE, custom_formation_name doit être renseigné
  CONSTRAINT chk_request_type_fields CHECK (
    (request_type = 'CATALOGUE' AND formation_id IS NOT NULL) OR
    (request_type = 'NOUVELLE' AND custom_formation_name IS NOT NULL)
  ),

  -- Contrainte : date fin >= date début si renseignée
  CONSTRAINT chk_dates CHECK (
    desired_end_date IS NULL OR desired_end_date >= desired_start_date
  )
);

-- Index sur created_by pour voir ses propres demandes
CREATE INDEX idx_training_requests_created_by ON training_requests(created_by);
-- Index sur le statut pour filtrage
CREATE INDEX idx_training_requests_status ON training_requests(status);
-- Index sur formation_id
CREATE INDEX idx_training_requests_formation_id ON training_requests(formation_id);
-- Index sur camunda_process_instance_id
CREATE INDEX idx_training_requests_camunda ON training_requests(camunda_process_instance_id);

-- ============================================
-- TABLE: training_request_participants
-- ============================================

CREATE TABLE training_request_participants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  training_request_id UUID NOT NULL REFERENCES training_requests(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
  participant_status participant_status NOT NULL DEFAULT 'PENDING',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),

  -- Un utilisateur ne peut pas être participant deux fois sur la même demande
  CONSTRAINT uq_participant_request UNIQUE (training_request_id, user_id)
);

-- Index sur training_request_id
CREATE INDEX idx_participants_request_id ON training_request_participants(training_request_id);
-- Index sur user_id pour voir les demandes où on est participant
CREATE INDEX idx_participants_user_id ON training_request_participants(user_id);

-- ============================================
-- TABLE: request_decisions
-- ============================================

CREATE TABLE request_decisions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  training_request_id UUID NOT NULL REFERENCES training_requests(id) ON DELETE CASCADE,
  decided_by UUID NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
  decision_role decision_role NOT NULL,
  decision decision_type NOT NULL,
  comment TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- Index sur training_request_id
CREATE INDEX idx_decisions_request_id ON request_decisions(training_request_id);
-- Index sur decided_by
CREATE INDEX idx_decisions_decided_by ON request_decisions(decided_by);

-- ============================================
-- TABLE: chat_messages
-- ============================================

CREATE TABLE chat_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  message TEXT NOT NULL,
  response TEXT NOT NULL,
  intent chat_intent,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- Index sur user_id pour historique
CREATE INDEX idx_chat_messages_user_id ON chat_messages(user_id);

-- ============================================
-- TRIGGER: updated_at automatique
-- ============================================

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_users_updated_at
  BEFORE UPDATE ON users
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER trigger_formations_updated_at
  BEFORE UPDATE ON formations
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER trigger_training_requests_updated_at
  BEFORE UPDATE ON training_requests
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- DONNÉES DE TEST (seed)
-- ============================================

-- Mot de passe : "password123" hashé avec bcrypt
-- $2b$10$EixZaYVK1fsbw1ZfbX3OXePaWxn96p36WQoeG6Lruj3vjPGga31lW

INSERT INTO users (id, first_name, last_name, email, password_hash, role, manager_id) VALUES
  ('a0000000-0000-0000-0000-000000000001', 'Admin', 'System', 'admin@company.com', '$2b$10$SQzzuE.kEvywGgifBxWTjek7VTeTNRpKKadBpZ8Z7njftGufUsGqi', 'ADMIN', NULL),
  ('a0000000-0000-0000-0000-000000000002', 'Marie', 'Dupont', 'rh@company.com', '$2b$10$SQzzuE.kEvywGgifBxWTjek7VTeTNRpKKadBpZ8Z7njftGufUsGqi', 'RH', NULL),
  ('a0000000-0000-0000-0000-000000000003', 'Jean', 'Martin', 'manager@company.com', '$2b$10$SQzzuE.kEvywGgifBxWTjek7VTeTNRpKKadBpZ8Z7njftGufUsGqi', 'MANAGER', NULL),
  ('a0000000-0000-0000-0000-000000000004', 'Pierre', 'Bernard', 'employee1@company.com', '$2b$10$SQzzuE.kEvywGgifBxWTjek7VTeTNRpKKadBpZ8Z7njftGufUsGqi', 'EMPLOYEE', 'a0000000-0000-0000-0000-000000000003'),
  ('a0000000-0000-0000-0000-000000000005', 'Sophie', 'Petit', 'employee2@company.com', '$2b$10$SQzzuE.kEvywGgifBxWTjek7VTeTNRpKKadBpZ8Z7njftGufUsGqi', 'EMPLOYEE', 'a0000000-0000-0000-0000-000000000003');

INSERT INTO formations (id, name, domain, description) VALUES
  ('b0000000-0000-0000-0000-000000000001', 'React Avancé', 'Développement Web', 'Formation avancée React avec hooks, context et patterns'),
  ('b0000000-0000-0000-0000-000000000002', 'NestJS Fondamentaux', 'Développement Backend', 'Introduction à NestJS et architecture modulaire'),
  ('b0000000-0000-0000-0000-000000000003', 'PostgreSQL Administration', 'Base de données', 'Administration et optimisation PostgreSQL'),
  ('b0000000-0000-0000-0000-000000000004', 'Gestion de Projet Agile', 'Management', 'Méthodologies Scrum et Kanban'),
  ('b0000000-0000-0000-0000-000000000005', 'DevOps CI/CD', 'DevOps', 'Pipeline CI/CD avec GitHub Actions');

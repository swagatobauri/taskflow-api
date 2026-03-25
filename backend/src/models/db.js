const { Pool } = require('pg');
const { DATABASE_URL } = require('../config');

const pool = new Pool({
  connectionString: DATABASE_URL,
  // For local dev without SSL; set ssl: { rejectUnauthorized: false } for hosted DBs
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
});

module.exports = pool;

/*
 * Run this SQL once against your PostgreSQL database to create the required tables.
 *
 * CREATE EXTENSION IF NOT EXISTS "pgcrypto";
 *
 * CREATE TABLE IF NOT EXISTS users (
 *   id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
 *   name         VARCHAR(100) NOT NULL,
 *   email        VARCHAR(150) UNIQUE NOT NULL,
 *   password_hash TEXT NOT NULL,
 *   role         VARCHAR(20) NOT NULL DEFAULT 'user',
 *   created_at   TIMESTAMP NOT NULL DEFAULT NOW()
 * );
 *
 * CREATE TABLE IF NOT EXISTS tasks (
 *   id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
 *   user_id     UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
 *   title       VARCHAR(200) NOT NULL,
 *   description TEXT,
 *   status      VARCHAR(20) NOT NULL DEFAULT 'todo'
 *                 CHECK (status IN ('todo', 'in-progress', 'done')),
 *   created_at  TIMESTAMP NOT NULL DEFAULT NOW(),
 *   updated_at  TIMESTAMP NOT NULL DEFAULT NOW()
 * );
 */

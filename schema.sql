-- GitHub Profile Analyzer — Database Schema
-- Run once: mysql -u root -p < schema.sql

CREATE DATABASE IF NOT EXISTS github_analyzer
  CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

USE github_analyzer;

CREATE TABLE IF NOT EXISTS github_profiles (
  id                INT UNSIGNED     AUTO_INCREMENT PRIMARY KEY,

  -- GitHub identity
  github_id         BIGINT UNSIGNED  NOT NULL,
  username          VARCHAR(39)      NOT NULL,
  name              VARCHAR(255)     DEFAULT NULL,
  bio               TEXT             DEFAULT NULL,
  avatar_url        VARCHAR(512)     DEFAULT NULL,
  html_url          VARCHAR(512)     DEFAULT NULL,

  -- Social stats (direct from GitHub API)
  followers         INT UNSIGNED     NOT NULL DEFAULT 0,
  following         INT UNSIGNED     NOT NULL DEFAULT 0,
  public_repos      INT UNSIGNED     NOT NULL DEFAULT 0,

  -- Derived / computed fields
  account_age_days  INT UNSIGNED     NOT NULL DEFAULT 0,
  total_stars       INT UNSIGNED     NOT NULL DEFAULT 0,
  total_forks       INT UNSIGNED     NOT NULL DEFAULT 0,
  most_starred_repo VARCHAR(255)     DEFAULT NULL,
  primary_language  VARCHAR(100)     DEFAULT NULL,

  -- Housekeeping
  analyzed_at       DATETIME         NOT NULL,
  created_at        DATETIME         NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at        DATETIME         NOT NULL DEFAULT CURRENT_TIMESTAMP
                                     ON UPDATE CURRENT_TIMESTAMP,

  UNIQUE KEY uq_username  (username),
  UNIQUE KEY uq_github_id (github_id),
  INDEX idx_followers     (followers DESC),
  INDEX idx_analyzed_at   (analyzed_at DESC)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

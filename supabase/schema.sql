-- ============================================================
-- Hausaufgaben-App · Vollständiges Schema
-- ============================================================
-- Reihenfolge: Schulen → Gruppen → Mitglieder → Einträge →
--              Bestätigungen → Kommentare → Events → Klassenkasse

-- ─── Erweiterungen ───────────────────────────────────────────
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ─── Schulen (von jedeschule.codefor.de) ─────────────────────
CREATE TABLE IF NOT EXISTS schools (
  id            TEXT        PRIMARY KEY,
  name          TEXT        NOT NULL,
  address       TEXT,
  zip           TEXT,
  city          TEXT,
  state         TEXT,
  school_type   TEXT,
  website       TEXT,
  phone         TEXT,
  source        TEXT        NOT NULL DEFAULT 'jedeschule',
  confirmed     BOOLEAN     NOT NULL DEFAULT false,
  confirm_count INT         NOT NULL DEFAULT 0,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS schools_state_idx       ON schools(state);
CREATE INDEX IF NOT EXISTS schools_school_type_idx ON schools(school_type);
CREATE INDEX IF NOT EXISTS schools_zip_idx         ON schools(zip);
CREATE INDEX IF NOT EXISTS schools_name_idx        ON schools USING gin(to_tsvector('german', name));

-- ─── Gruppen (= eine Schulklasse) ────────────────────────────
-- Jede Gruppe ist eine Klasse einer Schule.
-- Wird automatisch angelegt wenn der erste Elternteil beitritt.
CREATE TABLE IF NOT EXISTS groups (
  id            UUID        PRIMARY KEY DEFAULT uuid_generate_v4(),
  school_id     TEXT        NOT NULL REFERENCES schools(id),

  -- z.B. "4", "7"
  grade         INT         NOT NULL,
  -- z.B. "a", "b", "c" – optional
  section       TEXT,

  -- Kurssystem – wird vom ersten Mitglied eingerichtet
  -- null = noch nicht eingerichtet
  -- 'none' = kein Kurssystem
  -- 'ABC' = A/B/C-Kurse
  -- 'EG'  = E/G-Kurse
  course_system TEXT,
  -- Welche Fächer haben Kurse? z.B. ['mathe','englisch']
  course_subjects TEXT[],

  -- Schuljahr z.B. "2025/26"
  school_year   TEXT        NOT NULL DEFAULT '2025/26',

  member_count  INT         NOT NULL DEFAULT 0,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT now(),

  -- Pro Schule, Klasse und Schuljahr nur eine Gruppe
  UNIQUE(school_id, grade, section, school_year)
);

CREATE INDEX IF NOT EXISTS groups_school_idx ON groups(school_id);

-- ─── Mitglieder ───────────────────────────────────────────────
-- Verbindet Nutzer (aus neon_auth) mit Gruppen.
CREATE TABLE IF NOT EXISTS members (
  id            UUID        PRIMARY KEY DEFAULT uuid_generate_v4(),
  -- User-ID aus Neon Auth
  user_id       TEXT        NOT NULL,
  group_id      UUID        NOT NULL REFERENCES groups(id) ON DELETE CASCADE,

  -- Anzeigename z.B. "Mama Lena"
  display_name  TEXT        NOT NULL,

  -- Kinder dieses Elternteils in dieser Gruppe
  -- [{name: "Emma", emoji: "🦋", course_mathe: "A", course_englisch: "B"}]
  children      JSONB       NOT NULL DEFAULT '[]',

  -- Status: 'pending' = wartet auf Bestätigung, 'active' = aktiv
  status        TEXT        NOT NULL DEFAULT 'pending',
  confirmed_by  TEXT[],     -- user_ids die diesen Nutzer bestätigt haben
  confirm_count INT         NOT NULL DEFAULT 0,

  -- Streak
  streak_days   INT         NOT NULL DEFAULT 0,
  streak_last   DATE,

  -- Rollen
  is_admin      BOOLEAN     NOT NULL DEFAULT false,
  -- Elternbeirat-Rolle
  role          TEXT,       -- 'speaker' | 'deputy' | 'treasurer' | null

  joined_at     TIMESTAMPTZ NOT NULL DEFAULT now(),
  last_seen     TIMESTAMPTZ NOT NULL DEFAULT now(),

  UNIQUE(user_id, group_id)
);

CREATE INDEX IF NOT EXISTS members_user_idx  ON members(user_id);
CREATE INDEX IF NOT EXISTS members_group_idx ON members(group_id);

-- ─── Hausaufgaben-Einträge ────────────────────────────────────
CREATE TABLE IF NOT EXISTS entries (
  id            UUID        PRIMARY KEY DEFAULT uuid_generate_v4(),
  group_id      UUID        NOT NULL REFERENCES groups(id) ON DELETE CASCADE,
  author_id     TEXT        NOT NULL,   -- user_id
  author_name   TEXT        NOT NULL,

  -- Fach-ID z.B. 'mathe', 'englisch'
  subject       TEXT        NOT NULL,
  -- Kurs z.B. 'A', 'B', 'C', 'E', 'G' – null wenn kein Kurssystem
  course        TEXT,
  -- Für welches Kind? (name aus members.children)
  -- null = gilt für alle Kinder der Klasse
  for_child     TEXT,

  text          TEXT        NOT NULL,
  due_date      DATE,
  priority      TEXT        NOT NULL DEFAULT 'normal',
  -- 'normal' | 'wichtig' | 'klassenarbeit'

  confirm_count INT         NOT NULL DEFAULT 0,
  comment_count INT         NOT NULL DEFAULT 0,

  created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS entries_group_idx   ON entries(group_id);
CREATE INDEX IF NOT EXISTS entries_author_idx  ON entries(author_id);
CREATE INDEX IF NOT EXISTS entries_created_idx ON entries(created_at DESC);

-- ─── Bestätigungen ────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS confirmations (
  id         UUID        PRIMARY KEY DEFAULT uuid_generate_v4(),
  entry_id   UUID        NOT NULL REFERENCES entries(id) ON DELETE CASCADE,
  user_id    TEXT        NOT NULL,
  user_name  TEXT        NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(entry_id, user_id)
);

CREATE INDEX IF NOT EXISTS confirmations_entry_idx ON confirmations(entry_id);

-- ─── Kommentare ───────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS comments (
  id          UUID        PRIMARY KEY DEFAULT uuid_generate_v4(),
  entry_id    UUID        NOT NULL REFERENCES entries(id) ON DELETE CASCADE,
  author_id   TEXT        NOT NULL,
  author_name TEXT        NOT NULL,
  text        TEXT        NOT NULL,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS comments_entry_idx ON comments(entry_id);

-- ─── Events & Termine ─────────────────────────────────────────
CREATE TABLE IF NOT EXISTS events (
  id            UUID        PRIMARY KEY DEFAULT uuid_generate_v4(),
  group_id      UUID        NOT NULL REFERENCES groups(id) ON DELETE CASCADE,
  author_id     TEXT        NOT NULL,
  author_name   TEXT        NOT NULL,

  title         TEXT        NOT NULL,
  description   TEXT,
  event_date    TIMESTAMPTZ NOT NULL,
  -- 'elternabend' | 'ausflug' | 'klassenarbeit' | 'sonstiges'
  type          TEXT        NOT NULL DEFAULT 'sonstiges',

  created_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS events_group_idx ON events(group_id);
CREATE INDEX IF NOT EXISTS events_date_idx  ON events(event_date);

-- ─── Klassenkasse ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS fund_collections (
  id            UUID        PRIMARY KEY DEFAULT uuid_generate_v4(),
  group_id      UUID        NOT NULL REFERENCES groups(id) ON DELETE CASCADE,
  author_id     TEXT        NOT NULL,
  author_name   TEXT        NOT NULL,

  title         TEXT        NOT NULL,   -- z.B. "Theaterbesuch"
  description   TEXT,
  target_amount NUMERIC(10,2),          -- Zielbetrag optional
  amount_per_family NUMERIC(10,2),      -- Betrag pro Familie optional

  status        TEXT        NOT NULL DEFAULT 'open',
  -- 'open' | 'closed'

  created_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Wer hat zugesagt/bezahlt
CREATE TABLE IF NOT EXISTS fund_pledges (
  id              UUID        PRIMARY KEY DEFAULT uuid_generate_v4(),
  collection_id   UUID        NOT NULL REFERENCES fund_collections(id) ON DELETE CASCADE,
  user_id         TEXT        NOT NULL,
  user_name       TEXT        NOT NULL,
  amount          NUMERIC(10,2),
  status          TEXT        NOT NULL DEFAULT 'pledged',
  -- 'pledged' = zugesagt | 'paid' = bezahlt (vom Kassierer bestätigt)
  note            TEXT,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(collection_id, user_id)
);

CREATE INDEX IF NOT EXISTS fund_pledges_collection_idx ON fund_pledges(collection_id);

-- ─── Ansprechpartner / Elternbeiräte ─────────────────────────
-- Gespeichert in members.role – kein extra Table nötig
-- Abfrage: SELECT * FROM members WHERE role IS NOT NULL

-- ─── Trigger: updated_at automatisch setzen ──────────────────
CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS TRIGGER AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER schools_updated_at
  BEFORE UPDATE ON schools FOR EACH ROW EXECUTE FUNCTION set_updated_at();
CREATE TRIGGER groups_updated_at
  BEFORE UPDATE ON groups FOR EACH ROW EXECUTE FUNCTION set_updated_at();
CREATE TRIGGER entries_updated_at
  BEFORE UPDATE ON entries FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- ─── Trigger: confirm_count automatisch aktualisieren ────────
CREATE OR REPLACE FUNCTION update_confirm_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE entries SET confirm_count = confirm_count + 1 WHERE id = NEW.entry_id;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE entries SET confirm_count = confirm_count - 1 WHERE id = OLD.entry_id;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER confirmations_count_trigger
  AFTER INSERT OR DELETE ON confirmations
  FOR EACH ROW EXECUTE FUNCTION update_confirm_count();

-- ─── Trigger: comment_count automatisch aktualisieren ────────
CREATE OR REPLACE FUNCTION update_comment_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE entries SET comment_count = comment_count + 1 WHERE id = NEW.entry_id;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE entries SET comment_count = comment_count - 1 WHERE id = OLD.entry_id;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER comments_count_trigger
  AFTER INSERT OR DELETE ON comments
  FOR EACH ROW EXECUTE FUNCTION update_comment_count();

-- ─── Trigger: member_count automatisch aktualisieren ─────────
CREATE OR REPLACE FUNCTION update_member_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE groups SET member_count = member_count + 1 WHERE id = NEW.group_id;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE groups SET member_count = member_count - 1 WHERE id = OLD.group_id;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER members_count_trigger
  AFTER INSERT OR DELETE ON members
  FOR EACH ROW EXECUTE FUNCTION update_member_count();

-- ─── Users (eigenes Auth) ─────────────────────────────────────
CREATE TABLE IF NOT EXISTS users (
  id            UUID        PRIMARY KEY DEFAULT uuid_generate_v4(),
  email         TEXT        NOT NULL UNIQUE,
  name          TEXT        NOT NULL,
  password_hash TEXT        NOT NULL,
  password_salt TEXT        NOT NULL,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS users_email_idx ON users(email);

-- ============================================================
-- SGRWDH DATABASE SCHEMA
-- ============================================================

-- 作者表
CREATE TABLE authors (
  id TEXT PRIMARY KEY,                -- 'A1', 'A2' ...
  author_name TEXT NOT NULL,
  life TEXT,                          -- 英文传记摘要, ≤100词
  ciris_url TEXT,
  tm_id TEXT,
  tm_uri TEXT,
  creator TEXT DEFAULT 'Agent',
  language TEXT,                      -- 'Greek' | 'Latin' | 'Other'
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 作品表
CREATE TABLE works (
  id TEXT PRIMARY KEY,                -- 'W1', 'W2' ...
  work_title TEXT NOT NULL,
  synopsis TEXT,
  quoting_information TEXT,
  ciris_url TEXT,
  tm_id TEXT,
  tm_uri TEXT,
  creator TEXT DEFAULT 'Agent',
  author_id TEXT REFERENCES authors(id) ON DELETE SET NULL,
  genre TEXT,                         -- 'Historiography', 'Poetry', 'Philosophy' ...
  is_fragmentary BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 作品子部分表
CREATE TABLE parts_of_works (
  id TEXT PRIMARY KEY,                -- 'P1', 'P2' ...
  work_title TEXT NOT NULL,
  synopsis TEXT,
  quoting_information TEXT,
  ciris_url TEXT,
  tm_id TEXT,
  tm_uri TEXT,
  creator TEXT DEFAULT 'Agent',
  work_id TEXT REFERENCES works(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 时间表 (一个实体可有多行)
CREATE TABLE periods (
  id SERIAL PRIMARY KEY,
  corresponding_id TEXT NOT NULL,     -- 'A1', 'W1', 'P1' 等
  period_type TEXT NOT NULL CHECK (period_type IN (
    'Author Lifespan',
    'Work Composition Period',
    'Work Coverage Period'
  )),
  start_year_earliest INTEGER,        -- BCE 用负数, 如 -500
  start_year_latest INTEGER,
  end_year_earliest INTEGER,
  end_year_latest INTEGER
);

-- 文献来源表 (一个实体可有多行)
CREATE TABLE sources (
  id SERIAL PRIMARY KEY,
  corresponding_id TEXT NOT NULL,
  source_type TEXT NOT NULL CHECK (source_type IN (
    'Bibliography', 'Edition', 'Commentary',
    'Original Text + Translation', 'Translation'
  )),
  source_information TEXT,            -- Chicago 格式
  free_internet_resource_url TEXT
);

-- 索引
CREATE INDEX idx_periods_corr ON periods(corresponding_id);
CREATE INDEX idx_sources_corr ON sources(corresponding_id);
CREATE INDEX idx_works_author ON works(author_id);
CREATE INDEX idx_parts_work ON parts_of_works(work_id);

-- 启用 Row Level Security (公开只读)
ALTER TABLE authors ENABLE ROW LEVEL SECURITY;
ALTER TABLE works ENABLE ROW LEVEL SECURITY;
ALTER TABLE parts_of_works ENABLE ROW LEVEL SECURITY;
ALTER TABLE periods ENABLE ROW LEVEL SECURITY;
ALTER TABLE sources ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public read" ON authors FOR SELECT USING (true);
CREATE POLICY "Public read" ON works FOR SELECT USING (true);
CREATE POLICY "Public read" ON parts_of_works FOR SELECT USING (true);
CREATE POLICY "Public read" ON periods FOR SELECT USING (true);
CREATE POLICY "Public read" ON sources FOR SELECT USING (true);

-- 全文搜索
ALTER TABLE authors ADD COLUMN fts tsvector
  GENERATED ALWAYS AS (to_tsvector('english', coalesce(author_name,'') || ' ' || coalesce(life,''))) STORED;
CREATE INDEX idx_authors_fts ON authors USING gin(fts);

ALTER TABLE works ADD COLUMN fts tsvector
  GENERATED ALWAYS AS (to_tsvector('english', coalesce(work_title,'') || ' ' || coalesce(synopsis,''))) STORED;
CREATE INDEX idx_works_fts ON works USING gin(fts);

-- 统计视图
CREATE VIEW stats AS
SELECT
  (SELECT count(*) FROM authors) AS total_authors,
  (SELECT count(*) FROM works) AS total_works,
  (SELECT count(*) FROM parts_of_works) AS total_parts,
  (SELECT count(*) FROM sources) AS total_sources,
  (SELECT count(*) FROM periods) AS total_periods;

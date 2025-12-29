-- ============================================
-- GYM APP SCHEMA + SEED
-- Run this in Supabase SQL Editor
-- ============================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================
-- TABLES
-- ============================================

-- Exercises: Reference table of all exercises
CREATE TABLE IF NOT EXISTS exercises (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  category TEXT NOT NULL CHECK (category IN ('upper', 'lower', 'core')),
  equipment TEXT NOT NULL CHECK (equipment IN ('machine', 'barbell', 'dumbbell', 'cable', 'bodyweight')),
  demo_url TEXT,
  form_cues TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Workout Templates: Day 1 Upper, Day 2 Lower
CREATE TABLE IF NOT EXISTS workout_templates (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  cycle_order INT NOT NULL,
  description TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Workout Template Items: Exercises within each template
CREATE TABLE IF NOT EXISTS workout_template_items (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  template_id UUID NOT NULL REFERENCES workout_templates(id) ON DELETE CASCADE,
  exercise_id UUID NOT NULL REFERENCES exercises(id) ON DELETE CASCADE,
  sort_order INT NOT NULL,
  sets INT NOT NULL,
  rep_min INT NOT NULL,
  rep_max INT NOT NULL,
  rest_seconds INT NOT NULL DEFAULT 90,
  start_weight_lbs INT,
  increment_lbs INT NOT NULL DEFAULT 5,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Workout Sessions: Each time user trains
CREATE TABLE IF NOT EXISTS workout_sessions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  template_id UUID NOT NULL REFERENCES workout_templates(id),
  started_at TIMESTAMPTZ DEFAULT now(),
  ended_at TIMESTAMPTZ,
  bodyweight_lbs NUMERIC(5,1),
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Workout Sets: Logged sets within a session
CREATE TABLE IF NOT EXISTS workout_sets (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  session_id UUID NOT NULL REFERENCES workout_sessions(id) ON DELETE CASCADE,
  exercise_id UUID NOT NULL REFERENCES exercises(id),
  set_number INT NOT NULL,
  weight_lbs NUMERIC(6,1) NOT NULL,
  reps INT NOT NULL,
  rir INT CHECK (rir >= 0 AND rir <= 5),
  is_warmup BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(session_id, exercise_id, set_number)
);

-- Bodyweight Logs
CREATE TABLE IF NOT EXISTS bodyweight_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  logged_at DATE NOT NULL DEFAULT CURRENT_DATE,
  weight_lbs NUMERIC(5,1) NOT NULL,
  waist_in NUMERIC(4,1),
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(user_id, logged_at)
);

-- Diet Logs
CREATE TABLE IF NOT EXISTS diet_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  logged_at DATE NOT NULL DEFAULT CURRENT_DATE,
  protein_g INT NOT NULL,
  calories INT,
  steps INT,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(user_id, logged_at)
);

-- ============================================
-- INDEXES
-- ============================================

CREATE INDEX IF NOT EXISTS idx_workout_sessions_user ON workout_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_workout_sessions_template ON workout_sessions(template_id);
CREATE INDEX IF NOT EXISTS idx_workout_sets_session ON workout_sets(session_id);
CREATE INDEX IF NOT EXISTS idx_bodyweight_logs_user ON bodyweight_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_diet_logs_user ON diet_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_template_items_template ON workout_template_items(template_id);

-- ============================================
-- ROW LEVEL SECURITY
-- ============================================

ALTER TABLE exercises ENABLE ROW LEVEL SECURITY;
ALTER TABLE workout_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE workout_template_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE workout_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE workout_sets ENABLE ROW LEVEL SECURITY;
ALTER TABLE bodyweight_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE diet_logs ENABLE ROW LEVEL SECURITY;

-- Reference tables: Readable by all authenticated users
CREATE POLICY "Exercises readable by authenticated" ON exercises
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "Templates readable by authenticated" ON workout_templates
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "Template items readable by authenticated" ON workout_template_items
  FOR SELECT TO authenticated USING (true);

-- User data: Only accessible by owner
CREATE POLICY "Sessions owned by user" ON workout_sessions
  FOR ALL TO authenticated USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

CREATE POLICY "Sets accessible via session owner" ON workout_sets
  FOR ALL TO authenticated
  USING (
    session_id IN (SELECT id FROM workout_sessions WHERE user_id = auth.uid())
  )
  WITH CHECK (
    session_id IN (SELECT id FROM workout_sessions WHERE user_id = auth.uid())
  );

CREATE POLICY "Bodyweight logs owned by user" ON bodyweight_logs
  FOR ALL TO authenticated USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

CREATE POLICY "Diet logs owned by user" ON diet_logs
  FOR ALL TO authenticated USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

-- ============================================
-- SEED DATA: EXERCISES
-- ============================================

INSERT INTO exercises (name, category, equipment, demo_url, form_cues) VALUES
-- Upper Body
('Machine Chest Press', 'upper', 'machine', '/demos/chest-press.mp4',
  'Chest up, shoulders back. Control the weight down slowly. Press through the handles, not your wrists. Stop 1-2 reps shy of failure.'),

('Lat Pulldown', 'upper', 'cable', '/demos/lat-pulldown.mp4',
  'Chest up, pull elbows to ribs. No swinging. Squeeze lats at the bottom. Control the negative.'),

('Seated Row', 'upper', 'machine', '/demos/seated-row.mp4',
  'Pull to lower chest. Squeeze shoulder blades together. Keep core tight. Don''t lean back excessively.'),

('Shoulder Press', 'upper', 'machine', '/demos/shoulder-press.mp4',
  'Core tight, back flat against pad. Press up and slightly in. Don''t lock out elbows. Go slow on shoulders.'),

('Triceps Pushdown', 'upper', 'cable', '/demos/triceps-pushdown.mp4',
  'Elbows pinned to sides. Full extension at bottom. Control the return. If elbows flare, drop weight.'),

('Dumbbell Curls', 'upper', 'dumbbell', '/demos/dumbbell-curls.mp4',
  'Keep upper arms stationary. Full range of motion. Control, no momentum. Alternate arms or together.'),

-- Lower Body
('Leg Press', 'lower', 'machine', '/demos/leg-press.mp4',
  'Feet slightly higher on platform for knee safety. Knees track over toes. Don''t lock out knees at top. Control the negative.'),

('Romanian Deadlift', 'lower', 'barbell', '/demos/rdl.mp4',
  'Hinge at hips, soft knees. Bar stays close to legs. Feel stretch in hamstrings. Stop when back rounds.'),

('Seated Ham Curl', 'lower', 'machine', '/demos/ham-curl.mp4',
  'Slow negatives (3 seconds down). Full squeeze at contraction. Don''t use momentum.'),

('Calf Raise', 'lower', 'machine', '/demos/calf-raise.mp4',
  'Full stretch at bottom. Pause at top squeeze. Controlled tempo. Feel the burn.'),

-- Core
('Cable Crunch', 'core', 'cable', '/demos/cable-crunch.mp4',
  'Hips stay still. Crunch ribcage toward pelvis. Squeeze abs hard. Don''t pull with arms.'),

('Plank', 'core', 'bodyweight', '/demos/plank.mp4',
  'Straight line from head to heels. Core braced, glutes tight. Elevate hands if needed. Breathe steadily.');

-- ============================================
-- SEED DATA: TEMPLATES
-- ============================================

INSERT INTO workout_templates (name, cycle_order, description) VALUES
('Day 1 — Upper Body', 1, 'Push + Pull. Heavy, controlled sets. Leave 1-2 reps in reserve.'),
('Day 2 — Lower + Core', 2, 'Legs and core. Joint-friendly focus. Progressive overload.');

-- ============================================
-- SEED DATA: TEMPLATE ITEMS
-- ============================================

-- Day 1 Upper Body Items
INSERT INTO workout_template_items (template_id, exercise_id, sort_order, sets, rep_min, rep_max, rest_seconds, start_weight_lbs, increment_lbs, notes)
SELECT
  t.id,
  e.id,
  1,
  4,
  6,
  10,
  120,
  220,
  10,
  'Main lift. Focus on controlled reps, full range.'
FROM workout_templates t, exercises e
WHERE t.cycle_order = 1 AND e.name = 'Machine Chest Press';

INSERT INTO workout_template_items (template_id, exercise_id, sort_order, sets, rep_min, rep_max, rest_seconds, start_weight_lbs, increment_lbs, notes)
SELECT
  t.id,
  e.id,
  2,
  4,
  8,
  12,
  90,
  270,
  10,
  'Pull elbows to ribs. No swinging.'
FROM workout_templates t, exercises e
WHERE t.cycle_order = 1 AND e.name = 'Lat Pulldown';

INSERT INTO workout_template_items (template_id, exercise_id, sort_order, sets, rep_min, rep_max, rest_seconds, start_weight_lbs, increment_lbs, notes)
SELECT
  t.id,
  e.id,
  3,
  3,
  10,
  12,
  90,
  200,
  10,
  'Squeeze shoulder blades together.'
FROM workout_templates t, exercises e
WHERE t.cycle_order = 1 AND e.name = 'Seated Row';

INSERT INTO workout_template_items (template_id, exercise_id, sort_order, sets, rep_min, rep_max, rest_seconds, start_weight_lbs, increment_lbs, notes)
SELECT
  t.id,
  e.id,
  4,
  3,
  8,
  12,
  90,
  140,
  5,
  'Go slower here—shoulders get beat up fast.'
FROM workout_templates t, exercises e
WHERE t.cycle_order = 1 AND e.name = 'Shoulder Press';

INSERT INTO workout_template_items (template_id, exercise_id, sort_order, sets, rep_min, rep_max, rest_seconds, start_weight_lbs, increment_lbs, notes)
SELECT
  t.id,
  e.id,
  5,
  3,
  12,
  15,
  60,
  90,
  5,
  'Elbows pinned. Full extension.'
FROM workout_templates t, exercises e
WHERE t.cycle_order = 1 AND e.name = 'Triceps Pushdown';

INSERT INTO workout_template_items (template_id, exercise_id, sort_order, sets, rep_min, rep_max, rest_seconds, start_weight_lbs, increment_lbs, notes)
SELECT
  t.id,
  e.id,
  6,
  3,
  12,
  15,
  60,
  35,
  5,
  'Control, no momentum. Arms grow from control.'
FROM workout_templates t, exercises e
WHERE t.cycle_order = 1 AND e.name = 'Dumbbell Curls';

-- Day 2 Lower + Core Items
INSERT INTO workout_template_items (template_id, exercise_id, sort_order, sets, rep_min, rep_max, rest_seconds, start_weight_lbs, increment_lbs, notes)
SELECT
  t.id,
  e.id,
  1,
  4,
  8,
  12,
  120,
  950,
  20,
  'Main lift. Feet high on platform for knee safety.'
FROM workout_templates t, exercises e
WHERE t.cycle_order = 2 AND e.name = 'Leg Press';

INSERT INTO workout_template_items (template_id, exercise_id, sort_order, sets, rep_min, rep_max, rest_seconds, start_weight_lbs, increment_lbs, notes)
SELECT
  t.id,
  e.id,
  2,
  3,
  8,
  10,
  120,
  185,
  10,
  'Hamstring stretch, not lower-back pull.'
FROM workout_templates t, exercises e
WHERE t.cycle_order = 2 AND e.name = 'Romanian Deadlift';

INSERT INTO workout_template_items (template_id, exercise_id, sort_order, sets, rep_min, rep_max, rest_seconds, start_weight_lbs, increment_lbs, notes)
SELECT
  t.id,
  e.id,
  3,
  3,
  12,
  15,
  75,
  90,
  10,
  'Slow negatives (3 seconds down).'
FROM workout_templates t, exercises e
WHERE t.cycle_order = 2 AND e.name = 'Seated Ham Curl';

INSERT INTO workout_template_items (template_id, exercise_id, sort_order, sets, rep_min, rep_max, rest_seconds, start_weight_lbs, increment_lbs, notes)
SELECT
  t.id,
  e.id,
  4,
  3,
  12,
  15,
  60,
  135,
  10,
  'Pause at the top. Full stretch at bottom.'
FROM workout_templates t, exercises e
WHERE t.cycle_order = 2 AND e.name = 'Calf Raise';

INSERT INTO workout_template_items (template_id, exercise_id, sort_order, sets, rep_min, rep_max, rest_seconds, start_weight_lbs, increment_lbs, notes)
SELECT
  t.id,
  e.id,
  5,
  3,
  12,
  15,
  60,
  80,
  5,
  'Crunch ribcage toward pelvis.'
FROM workout_templates t, exercises e
WHERE t.cycle_order = 2 AND e.name = 'Cable Crunch';

INSERT INTO workout_template_items (template_id, exercise_id, sort_order, sets, rep_min, rep_max, rest_seconds, start_weight_lbs, increment_lbs, notes)
SELECT
  t.id,
  e.id,
  6,
  3,
  20,
  40,
  60,
  NULL,
  0,
  'Seconds, not reps. Elevate hands if needed.'
FROM workout_templates t, exercises e
WHERE t.cycle_order = 2 AND e.name = 'Plank';

-- ============================================
-- HELPER FUNCTION: Get next workout day
-- ============================================

CREATE OR REPLACE FUNCTION get_next_workout_day(p_user_id UUID)
RETURNS INT AS $$
DECLARE
  last_cycle_order INT;
BEGIN
  SELECT wt.cycle_order INTO last_cycle_order
  FROM workout_sessions ws
  JOIN workout_templates wt ON ws.template_id = wt.id
  WHERE ws.user_id = p_user_id
  ORDER BY ws.started_at DESC
  LIMIT 1;

  IF last_cycle_order IS NULL THEN
    RETURN 1;
  ELSIF last_cycle_order = 1 THEN
    RETURN 2;
  ELSE
    RETURN 1;
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

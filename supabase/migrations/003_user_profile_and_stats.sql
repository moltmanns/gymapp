-- ============================================
-- USER PROFILE + STATS ENHANCEMENTS
-- Migration 003
-- ============================================

-- ============================================
-- USER PROFILE TABLE
-- Single row per user for profile/goals
-- ============================================

CREATE TABLE IF NOT EXISTS user_profile (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  starting_weight_lbs INT NOT NULL,
  starting_date DATE NOT NULL DEFAULT CURRENT_DATE,
  goal_weight_lbs INT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Index
CREATE INDEX IF NOT EXISTS idx_user_profile_user ON user_profile(user_id);

-- Row Level Security
ALTER TABLE user_profile ENABLE ROW LEVEL SECURITY;

CREATE POLICY "User profile owned by user" ON user_profile
  FOR ALL TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- Trigger for updated_at
CREATE OR REPLACE FUNCTION update_user_profile_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER user_profile_updated_at_trigger
  BEFORE UPDATE ON user_profile
  FOR EACH ROW
  EXECUTE FUNCTION update_user_profile_updated_at();

-- ============================================
-- WORKOUT_DAY COLUMN ON WORKOUT_SESSIONS
-- Store the local date of each workout for easier aggregation
-- ============================================

ALTER TABLE workout_sessions
ADD COLUMN IF NOT EXISTS workout_day DATE;

-- Index for date-based queries
CREATE INDEX IF NOT EXISTS idx_workout_sessions_workout_day ON workout_sessions(workout_day);

-- Trigger to auto-populate workout_day on insert/update
CREATE OR REPLACE FUNCTION set_workout_day()
RETURNS TRIGGER AS $$
BEGIN
  -- Convert started_at to America/Chicago timezone and extract date
  NEW.workout_day := (NEW.started_at AT TIME ZONE 'America/Chicago')::DATE;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER workout_sessions_set_workout_day_trigger
  BEFORE INSERT OR UPDATE OF started_at ON workout_sessions
  FOR EACH ROW
  EXECUTE FUNCTION set_workout_day();

-- Backfill existing workout_sessions with workout_day
UPDATE workout_sessions
SET workout_day = (started_at AT TIME ZONE 'America/Chicago')::DATE
WHERE workout_day IS NULL;

-- ============================================
-- STATS AGGREGATION FUNCTIONS
-- Helper functions for computing stats
-- ============================================

-- Get user stats for a date range
CREATE OR REPLACE FUNCTION get_user_stats(
  p_user_id UUID,
  p_start_date DATE DEFAULT NULL,
  p_end_date DATE DEFAULT NULL
)
RETURNS TABLE (
  workout_days BIGINT,
  total_workouts BIGINT,
  total_sets BIGINT,
  diet_days BIGINT,
  total_protein BIGINT,
  total_calories BIGINT,
  days_with_calories BIGINT
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    -- Workout days (distinct dates)
    (SELECT COUNT(DISTINCT ws.workout_day)
     FROM workout_sessions ws
     WHERE ws.user_id = p_user_id
       AND (p_start_date IS NULL OR ws.workout_day >= p_start_date)
       AND (p_end_date IS NULL OR ws.workout_day <= p_end_date)
    ) AS workout_days,

    -- Total workouts
    (SELECT COUNT(*)
     FROM workout_sessions ws
     WHERE ws.user_id = p_user_id
       AND (p_start_date IS NULL OR ws.workout_day >= p_start_date)
       AND (p_end_date IS NULL OR ws.workout_day <= p_end_date)
    ) AS total_workouts,

    -- Total sets
    (SELECT COUNT(*)
     FROM workout_sets wsets
     JOIN workout_sessions ws ON wsets.session_id = ws.id
     WHERE ws.user_id = p_user_id
       AND (p_start_date IS NULL OR ws.workout_day >= p_start_date)
       AND (p_end_date IS NULL OR ws.workout_day <= p_end_date)
    ) AS total_sets,

    -- Diet days (distinct dates)
    (SELECT COUNT(DISTINCT dl.logged_at)
     FROM diet_logs dl
     WHERE dl.user_id = p_user_id
       AND (p_start_date IS NULL OR dl.logged_at >= p_start_date)
       AND (p_end_date IS NULL OR dl.logged_at <= p_end_date)
    ) AS diet_days,

    -- Total protein
    (SELECT COALESCE(SUM(dl.protein_g), 0)
     FROM diet_logs dl
     WHERE dl.user_id = p_user_id
       AND (p_start_date IS NULL OR dl.logged_at >= p_start_date)
       AND (p_end_date IS NULL OR dl.logged_at <= p_end_date)
    ) AS total_protein,

    -- Total calories
    (SELECT COALESCE(SUM(dl.calories), 0)
     FROM diet_logs dl
     WHERE dl.user_id = p_user_id
       AND dl.calories IS NOT NULL
       AND (p_start_date IS NULL OR dl.logged_at >= p_start_date)
       AND (p_end_date IS NULL OR dl.logged_at <= p_end_date)
    ) AS total_calories,

    -- Days with calories logged
    (SELECT COUNT(DISTINCT dl.logged_at)
     FROM diet_logs dl
     WHERE dl.user_id = p_user_id
       AND dl.calories IS NOT NULL
       AND (p_start_date IS NULL OR dl.logged_at >= p_start_date)
       AND (p_end_date IS NULL OR dl.logged_at <= p_end_date)
    ) AS days_with_calories;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Get weight at a specific date (or closest before)
CREATE OR REPLACE FUNCTION get_weight_at_date(
  p_user_id UUID,
  p_date DATE
)
RETURNS NUMERIC AS $$
DECLARE
  v_weight NUMERIC;
BEGIN
  SELECT bl.weight_lbs INTO v_weight
  FROM bodyweight_logs bl
  WHERE bl.user_id = p_user_id
    AND bl.logged_at <= p_date
  ORDER BY bl.logged_at DESC
  LIMIT 1;

  RETURN v_weight;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Get monthly breakdown for last N months
CREATE OR REPLACE FUNCTION get_monthly_breakdown(
  p_user_id UUID,
  p_months INT DEFAULT 12,
  p_timezone TEXT DEFAULT 'America/Chicago'
)
RETURNS TABLE (
  month_start DATE,
  month_label TEXT,
  workout_days BIGINT,
  diet_days BIGINT,
  total_protein BIGINT,
  total_calories BIGINT,
  days_with_protein BIGINT,
  days_with_calories BIGINT,
  start_weight NUMERIC,
  end_weight NUMERIC
) AS $$
DECLARE
  v_today DATE;
  v_month_start DATE;
  v_month_end DATE;
  i INT;
BEGIN
  v_today := (NOW() AT TIME ZONE p_timezone)::DATE;

  FOR i IN 0..(p_months - 1) LOOP
    -- Calculate month boundaries
    v_month_start := DATE_TRUNC('month', v_today - (i || ' months')::INTERVAL)::DATE;
    v_month_end := (DATE_TRUNC('month', v_month_start) + INTERVAL '1 month' - INTERVAL '1 day')::DATE;

    -- If current month, end at today
    IF v_month_end > v_today THEN
      v_month_end := v_today;
    END IF;

    RETURN QUERY
    SELECT
      v_month_start,
      TO_CHAR(v_month_start, 'Mon YYYY'),

      -- Workout days
      (SELECT COUNT(DISTINCT ws.workout_day)
       FROM workout_sessions ws
       WHERE ws.user_id = p_user_id
         AND ws.workout_day >= v_month_start
         AND ws.workout_day <= v_month_end
      ),

      -- Diet days
      (SELECT COUNT(DISTINCT dl.logged_at)
       FROM diet_logs dl
       WHERE dl.user_id = p_user_id
         AND dl.logged_at >= v_month_start
         AND dl.logged_at <= v_month_end
      ),

      -- Total protein
      (SELECT COALESCE(SUM(dl.protein_g), 0)
       FROM diet_logs dl
       WHERE dl.user_id = p_user_id
         AND dl.logged_at >= v_month_start
         AND dl.logged_at <= v_month_end
      ),

      -- Total calories
      (SELECT COALESCE(SUM(dl.calories), 0)
       FROM diet_logs dl
       WHERE dl.user_id = p_user_id
         AND dl.calories IS NOT NULL
         AND dl.logged_at >= v_month_start
         AND dl.logged_at <= v_month_end
      ),

      -- Days with protein
      (SELECT COUNT(DISTINCT dl.logged_at)
       FROM diet_logs dl
       WHERE dl.user_id = p_user_id
         AND dl.protein_g > 0
         AND dl.logged_at >= v_month_start
         AND dl.logged_at <= v_month_end
      ),

      -- Days with calories
      (SELECT COUNT(DISTINCT dl.logged_at)
       FROM diet_logs dl
       WHERE dl.user_id = p_user_id
         AND dl.calories IS NOT NULL
         AND dl.logged_at >= v_month_start
         AND dl.logged_at <= v_month_end
      ),

      -- Start weight (first weight in month or last before)
      (SELECT bl.weight_lbs
       FROM bodyweight_logs bl
       WHERE bl.user_id = p_user_id
         AND bl.logged_at <= v_month_start
       ORDER BY bl.logged_at DESC
       LIMIT 1
      ),

      -- End weight (last weight in month)
      (SELECT bl.weight_lbs
       FROM bodyweight_logs bl
       WHERE bl.user_id = p_user_id
         AND bl.logged_at <= v_month_end
       ORDER BY bl.logged_at DESC
       LIMIT 1
      );
  END LOOP;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

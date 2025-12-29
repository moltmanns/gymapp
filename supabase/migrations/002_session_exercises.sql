-- ============================================
-- WORKOUT SESSION EXERCISES TABLE
-- Tracks per-exercise completion within a session
-- ============================================

-- Create the table
CREATE TABLE IF NOT EXISTS workout_session_exercises (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  session_id UUID NOT NULL REFERENCES workout_sessions(id) ON DELETE CASCADE,
  exercise_id UUID NOT NULL REFERENCES exercises(id) ON DELETE CASCADE,
  template_item_id UUID NOT NULL REFERENCES workout_template_items(id) ON DELETE CASCADE,
  is_completed BOOLEAN DEFAULT false,
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(session_id, exercise_id)
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_session_exercises_session ON workout_session_exercises(session_id);
CREATE INDEX IF NOT EXISTS idx_session_exercises_user ON workout_session_exercises(user_id);

-- Row Level Security
ALTER TABLE workout_session_exercises ENABLE ROW LEVEL SECURITY;

-- User can only access their own session exercises
CREATE POLICY "Session exercises owned by user" ON workout_session_exercises
  FOR ALL TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- ============================================
-- HELPER FUNCTION: Initialize session exercises
-- Call this after creating a workout_session to populate the checklist
-- ============================================

CREATE OR REPLACE FUNCTION initialize_session_exercises(
  p_session_id UUID,
  p_user_id UUID,
  p_template_id UUID
)
RETURNS VOID AS $$
BEGIN
  INSERT INTO workout_session_exercises (user_id, session_id, exercise_id, template_item_id, is_completed)
  SELECT
    p_user_id,
    p_session_id,
    wti.exercise_id,
    wti.id,
    false
  FROM workout_template_items wti
  WHERE wti.template_id = p_template_id
  ORDER BY wti.sort_order;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- HELPER FUNCTION: Get workout cadence info
-- Returns info about recent workout days for 2-on/1-off logic
-- ============================================

CREATE OR REPLACE FUNCTION get_workout_cadence(p_user_id UUID, p_timezone TEXT DEFAULT 'America/Chicago')
RETURNS TABLE (
  worked_out_today BOOLEAN,
  worked_out_yesterday BOOLEAN,
  worked_out_day_before BOOLEAN,
  last_template_cycle_order INT,
  today_session_id UUID
) AS $$
DECLARE
  v_today DATE;
  v_yesterday DATE;
  v_day_before DATE;
BEGIN
  -- Get dates in user's timezone
  v_today := (NOW() AT TIME ZONE p_timezone)::DATE;
  v_yesterday := v_today - INTERVAL '1 day';
  v_day_before := v_today - INTERVAL '2 days';

  RETURN QUERY
  SELECT
    -- Did user work out today?
    EXISTS (
      SELECT 1 FROM workout_sessions ws
      WHERE ws.user_id = p_user_id
      AND (ws.started_at AT TIME ZONE p_timezone)::DATE = v_today
    ) AS worked_out_today,

    -- Did user work out yesterday?
    EXISTS (
      SELECT 1 FROM workout_sessions ws
      WHERE ws.user_id = p_user_id
      AND (ws.started_at AT TIME ZONE p_timezone)::DATE = v_yesterday
    ) AS worked_out_yesterday,

    -- Did user work out day before yesterday?
    EXISTS (
      SELECT 1 FROM workout_sessions ws
      WHERE ws.user_id = p_user_id
      AND (ws.started_at AT TIME ZONE p_timezone)::DATE = v_day_before
    ) AS worked_out_day_before,

    -- Last template cycle order
    (
      SELECT wt.cycle_order
      FROM workout_sessions ws
      JOIN workout_templates wt ON ws.template_id = wt.id
      WHERE ws.user_id = p_user_id
      ORDER BY ws.started_at DESC
      LIMIT 1
    ) AS last_template_cycle_order,

    -- Today's session ID (if exists and not ended)
    (
      SELECT ws.id
      FROM workout_sessions ws
      WHERE ws.user_id = p_user_id
      AND (ws.started_at AT TIME ZONE p_timezone)::DATE = v_today
      AND ws.ended_at IS NULL
      ORDER BY ws.started_at DESC
      LIMIT 1
    ) AS today_session_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

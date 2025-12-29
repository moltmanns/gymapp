-- ============================================
-- ADDITIONAL EXERCISES
-- Migration 004: More variety with dumbbells, kettlebells, machines, cables
-- ============================================

-- Clear existing exercises and re-insert complete list
DELETE FROM workout_template_items;
DELETE FROM exercises;

-- ============================================
-- UPPER BODY EXERCISES
-- ============================================

INSERT INTO exercises (name, category, equipment, demo_url, form_cues) VALUES
-- Chest - Machines
('Machine Chest Press', 'upper', 'machine', '/demos/chest-press.mp4',
  'Chest up, shoulders back. Control the weight down slowly. Press through the handles, not your wrists. Stop 1-2 reps shy of failure.'),
('Pec Deck Fly', 'upper', 'machine', '/demos/pec-deck.mp4',
  'Keep slight bend in elbows. Squeeze chest at the top. Control the negative. Dont let arms go too far back.'),
('Incline Machine Press', 'upper', 'machine', '/demos/incline-press.mp4',
  'Set bench to 30-45 degrees. Keep shoulder blades pinched. Drive through the chest, not shoulders.'),

-- Chest - Dumbbells
('Dumbbell Bench Press', 'upper', 'dumbbell', '/demos/db-bench.mp4',
  'Keep feet flat on floor. Lower dumbbells to chest level. Press up and slightly in. Control the eccentric.'),
('Incline Dumbbell Press', 'upper', 'dumbbell', '/demos/incline-db-press.mp4',
  'Set bench to 30-45 degrees. Keep neutral spine. Touch dumbbells at top. Squeeze chest throughout.'),
('Dumbbell Fly', 'upper', 'dumbbell', '/demos/db-fly.mp4',
  'Slight bend in elbows throughout. Lower with control. Feel stretch in chest. Dont go too heavy.'),

-- Chest - Cables
('Cable Crossover', 'upper', 'cable', '/demos/cable-crossover.mp4',
  'Slight forward lean. Cross hands at bottom. Squeeze chest hard. Keep core braced.'),
('Low to High Cable Fly', 'upper', 'cable', '/demos/low-high-fly.mp4',
  'Start with cables at bottom. Drive up and across. Great for upper chest. Control the return.'),

-- Back - Cables
('Lat Pulldown', 'upper', 'cable', '/demos/lat-pulldown.mp4',
  'Chest up, pull elbows to ribs. No swinging. Squeeze lats at the bottom. Control the negative.'),
('Cable Row', 'upper', 'cable', '/demos/cable-row.mp4',
  'Sit tall with chest up. Pull to lower chest/upper abs. Squeeze shoulder blades. Controlled release.'),
('Straight Arm Pulldown', 'upper', 'cable', '/demos/straight-arm-pulldown.mp4',
  'Keep arms slightly bent but fixed. Pull through lats not arms. Great lat isolation. Control tempo.'),
('Face Pull', 'upper', 'cable', '/demos/face-pull.mp4',
  'Pull to face level. External rotate at the top. Great for rear delts and posture. Use lighter weight.'),

-- Back - Machines
('Seated Row', 'upper', 'machine', '/demos/seated-row.mp4',
  'Pull to lower chest. Squeeze shoulder blades together. Keep core tight. Dont lean back excessively.'),
('Machine Pullover', 'upper', 'machine', '/demos/pullover.mp4',
  'Keep arms slightly bent. Feel stretch at top. Pull through lats. Great for lat width.'),

-- Back - Dumbbells
('Dumbbell Row', 'upper', 'dumbbell', '/demos/db-row.mp4',
  'Brace on bench. Pull to hip, not chest. Keep elbow close to body. Squeeze at top.'),
('Chest Supported Row', 'upper', 'dumbbell', '/demos/chest-supported-row.mp4',
  'Lie face down on incline bench. Row to hips. Great for taking lower back out. Full range of motion.'),

-- Back - Barbell
('Barbell Row', 'upper', 'barbell', '/demos/barbell-row.mp4',
  'Hinge at hips, back flat. Pull to lower chest/upper abs. Squeeze lats. Dont use momentum.'),

-- Shoulders - Machines
('Shoulder Press', 'upper', 'machine', '/demos/shoulder-press.mp4',
  'Core tight, back flat against pad. Press up and slightly in. Dont lock out elbows. Go slow on shoulders.'),
('Lateral Raise Machine', 'upper', 'machine', '/demos/lateral-machine.mp4',
  'Lead with elbows. Dont go above shoulder height. Control the negative. Great for isolating side delts.'),
('Rear Delt Machine', 'upper', 'machine', '/demos/rear-delt-machine.mp4',
  'Chest against pad. Open arms wide. Squeeze rear delts. Keep wrists neutral.'),

-- Shoulders - Dumbbells
('Dumbbell Shoulder Press', 'upper', 'dumbbell', '/demos/db-shoulder-press.mp4',
  'Can do seated or standing. Press up and slightly in. Dont lock elbows. Control the descent.'),
('Lateral Raise', 'upper', 'dumbbell', '/demos/lateral-raise.mp4',
  'Slight bend in elbows. Raise to shoulder height. Lead with pinkies. Dont swing.'),
('Front Raise', 'upper', 'dumbbell', '/demos/front-raise.mp4',
  'Alternate or together. Raise to shoulder height. Keep core tight. Control the negative.'),
('Rear Delt Fly', 'upper', 'dumbbell', '/demos/rear-delt-fly.mp4',
  'Hinge forward. Open arms wide. Squeeze rear delts. Use lighter weight for control.'),

-- Arms - Cables
('Triceps Pushdown', 'upper', 'cable', '/demos/triceps-pushdown.mp4',
  'Elbows pinned to sides. Full extension at bottom. Control the return. If elbows flare, drop weight.'),
('Overhead Triceps Extension', 'upper', 'cable', '/demos/overhead-tricep.mp4',
  'Face away from cable. Extend arms overhead. Great long head stretch. Control the eccentric.'),
('Cable Curl', 'upper', 'cable', '/demos/cable-curl.mp4',
  'Elbows at sides. Full range of motion. Squeeze at top. Constant tension throughout.'),
('Hammer Curl (Cable)', 'upper', 'cable', '/demos/cable-hammer.mp4',
  'Rope attachment. Neutral grip. Curl to shoulders. Great for brachialis.'),

-- Arms - Dumbbells
('Dumbbell Curls', 'upper', 'dumbbell', '/demos/dumbbell-curls.mp4',
  'Keep upper arms stationary. Full range of motion. Control, no momentum. Alternate arms or together.'),
('Hammer Curls', 'upper', 'dumbbell', '/demos/hammer-curls.mp4',
  'Neutral grip throughout. Curl to shoulders. Works brachialis and forearms. Dont swing.'),
('Incline Curls', 'upper', 'dumbbell', '/demos/incline-curls.mp4',
  'Lie back on incline bench. Great bicep stretch. Curl with control. Dont let elbows drift forward.'),
('Dumbbell Skull Crushers', 'upper', 'dumbbell', '/demos/db-skull-crushers.mp4',
  'Lower to sides of head. Keep elbows pointed up. Full extension at top. Control the weight.'),
('Dumbbell Kickbacks', 'upper', 'dumbbell', '/demos/kickbacks.mp4',
  'Hinge forward. Extend arm back fully. Squeeze tricep. Keep upper arm stationary.'),

-- Arms - Barbell
('Barbell Curl', 'upper', 'barbell', '/demos/barbell-curl.mp4',
  'Shoulder width grip. Keep elbows at sides. Full range of motion. Dont swing or lean back.'),
('EZ Bar Curl', 'upper', 'barbell', '/demos/ez-curl.mp4',
  'Angled grip easier on wrists. Same form as straight bar. Great for bicep isolation.'),
('Close Grip Bench Press', 'upper', 'barbell', '/demos/close-grip-bench.mp4',
  'Hands shoulder width or closer. Elbows tucked. Great for triceps. Touch lower chest.'),

-- ============================================
-- LOWER BODY EXERCISES
-- ============================================

-- Legs - Machines
('Leg Press', 'lower', 'machine', '/demos/leg-press.mp4',
  'Feet slightly higher on platform for knee safety. Knees track over toes. Dont lock out knees at top. Control the negative.'),
('Hack Squat', 'lower', 'machine', '/demos/hack-squat.mp4',
  'Back flat against pad. Feet shoulder width. Go deep if mobility allows. Drive through heels.'),
('Leg Extension', 'lower', 'machine', '/demos/leg-extension.mp4',
  'Adjust pad to ankle. Extend fully. Squeeze quads at top. Slow negative. Dont swing.'),
('Seated Leg Curl', 'lower', 'machine', '/demos/leg-curl.mp4',
  'Slow negatives (3 seconds down). Full squeeze at contraction. Dont use momentum.'),
('Lying Leg Curl', 'lower', 'machine', '/demos/lying-curl.mp4',
  'Hips stay down. Curl to glutes. Squeeze hamstrings. Control the descent.'),
('Hip Adductor', 'lower', 'machine', '/demos/adductor.mp4',
  'Sit tall. Squeeze inner thighs together. Hold at contraction. Control the release.'),
('Hip Abductor', 'lower', 'machine', '/demos/abductor.mp4',
  'Sit tall. Push knees out. Great for glute medius. Dont lean forward.'),
('Glute Kickback Machine', 'lower', 'machine', '/demos/glute-kickback.mp4',
  'Drive through heel. Squeeze glute at top. Dont hyperextend lower back. Control tempo.'),

-- Legs - Cables
('Cable Pull Through', 'lower', 'cable', '/demos/pull-through.mp4',
  'Face away from cable. Hinge at hips. Squeeze glutes at top. Great glute/ham exercise.'),
('Cable Kickback', 'lower', 'cable', '/demos/cable-kickback.mp4',
  'Ankle strap. Drive back and up. Squeeze glute. Dont swing the leg.'),

-- Legs - Barbell
('Romanian Deadlift', 'lower', 'barbell', '/demos/rdl.mp4',
  'Hinge at hips, soft knees. Bar stays close to legs. Feel stretch in hamstrings. Stop when back rounds.'),
('Barbell Squat', 'lower', 'barbell', '/demos/squat.mp4',
  'Bar on upper back. Brace core. Knees track over toes. Go to parallel or below. Drive up through heels.'),
('Front Squat', 'lower', 'barbell', '/demos/front-squat.mp4',
  'Bar on front delts. Elbows high. More quad dominant. Requires good mobility.'),
('Hip Thrust', 'lower', 'barbell', '/demos/hip-thrust.mp4',
  'Upper back on bench. Drive through heels. Squeeze glutes hard at top. Dont hyperextend.'),
('Walking Lunges', 'lower', 'barbell', '/demos/walking-lunges.mp4',
  'Step forward. Knee tracks over toe. Push through front heel. Alternate legs.'),

-- Legs - Dumbbells
('Goblet Squat', 'lower', 'dumbbell', '/demos/goblet-squat.mp4',
  'Hold dumbbell at chest. Keep elbows in. Squat deep. Great for learning squat pattern.'),
('Dumbbell RDL', 'lower', 'dumbbell', '/demos/db-rdl.mp4',
  'Same as barbell version. Dumbbells at sides. Feel hamstring stretch. Keep back flat.'),
('Dumbbell Lunges', 'lower', 'dumbbell', '/demos/db-lunges.mp4',
  'Step forward or back. Knee tracks over toe. Push through front heel. Great for balance.'),
('Dumbbell Step Ups', 'lower', 'dumbbell', '/demos/step-ups.mp4',
  'Step onto box or bench. Drive through heel. Dont push off back foot. Alternate legs.'),
('Bulgarian Split Squat', 'lower', 'dumbbell', '/demos/bulgarian.mp4',
  'Rear foot on bench. Lower straight down. Great for single leg strength. Challenging balance.'),

-- Calves
('Calf Raise', 'lower', 'machine', '/demos/calf-raise.mp4',
  'Full stretch at bottom. Pause at top squeeze. Controlled tempo. Feel the burn.'),
('Seated Calf Raise', 'lower', 'machine', '/demos/seated-calf.mp4',
  'Targets soleus. Full range of motion. Hold at top. Slow negatives.'),

-- ============================================
-- CORE EXERCISES
-- ============================================

('Cable Crunch', 'core', 'cable', '/demos/cable-crunch.mp4',
  'Hips stay still. Crunch ribcage toward pelvis. Squeeze abs hard. Dont pull with arms.'),
('Hanging Leg Raise', 'core', 'bodyweight', '/demos/hanging-leg-raise.mp4',
  'Hang from bar. Raise legs to parallel or higher. Control the descent. Dont swing.'),
('Plank', 'core', 'bodyweight', '/demos/plank.mp4',
  'Straight line from head to heels. Core braced, glutes tight. Elevate hands if needed. Breathe steadily.'),
('Ab Wheel Rollout', 'core', 'bodyweight', '/demos/ab-wheel.mp4',
  'Start on knees. Roll out with control. Dont let hips sag. Pull back with abs.'),
('Russian Twist', 'core', 'dumbbell', '/demos/russian-twist.mp4',
  'Lean back slightly. Rotate side to side. Hold weight at chest. Keep feet off ground for harder version.'),
('Dead Bug', 'core', 'bodyweight', '/demos/dead-bug.mp4',
  'Back flat on floor. Lower opposite arm and leg. Keep core braced. Dont let back arch.'),
('Bird Dog', 'core', 'bodyweight', '/demos/bird-dog.mp4',
  'On hands and knees. Extend opposite arm and leg. Hold at top. Great for stability.'),
('Pallof Press', 'core', 'cable', '/demos/pallof-press.mp4',
  'Stand perpendicular to cable. Press out and hold. Resist rotation. Great anti-rotation exercise.'),
('Woodchop', 'core', 'cable', '/demos/woodchop.mp4',
  'High to low or low to high. Rotate through core. Keep arms straight. Control the movement.');

-- ============================================
-- UPDATE WORKOUT TEMPLATES WITH NEW EXERCISES
-- ============================================

-- Recreate template items for Day 1 - Upper Body
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
  'Main push movement. Focus on controlled reps, full range.'
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

-- Day 2 - Lower + Core
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
  'Main compound. Feet high on platform for knee safety.'
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
WHERE t.cycle_order = 2 AND e.name = 'Seated Leg Curl';

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

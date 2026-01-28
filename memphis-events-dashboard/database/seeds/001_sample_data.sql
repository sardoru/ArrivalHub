-- Sample data for Memphis Events Dashboard

-- Insert sample venues
INSERT INTO venues (id, name, normalized_name, address, latitude, longitude, capacity, venue_type, downtown_distance_miles) VALUES
  ('11111111-1111-1111-1111-111111111111', 'FedExForum', 'fedexforum', '191 Beale St, Memphis, TN 38103', 35.1381, -90.0505, 18119, 'arena', 0.3),
  ('22222222-2222-2222-2222-222222222222', 'AutoZone Park', 'autozone park', '200 Union Ave, Memphis, TN 38103', 35.1455, -90.0510, 10000, 'stadium', 0.2),
  ('33333333-3333-3333-3333-333333333333', 'Orpheum Theatre', 'orpheum theatre', '203 S Main St, Memphis, TN 38103', 35.1405, -90.0533, 2300, 'theater', 0.4),
  ('44444444-4444-4444-4444-444444444444', 'Liberty Bowl Memorial Stadium', 'liberty bowl memorial stadium', '335 S Hollywood St, Memphis, TN 38104', 35.1206, -89.9985, 58325, 'stadium', 2.5),
  ('55555555-5555-5555-5555-555555555555', 'Beale Street', 'beale street', 'Beale St, Memphis, TN 38103', 35.1395, -90.0533, null, 'outdoor', 0.1);

-- Insert sample events (future dates - adjust as needed)
INSERT INTO events (id, title, normalized_title, description, event_type, start_date, start_time, venue_id, expected_attendance, demand_impact_score, status, confidence_score) VALUES
  ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'Memphis Grizzlies vs Lakers', 'memphis grizzlies vs lakers', 'NBA regular season game', 'sports', CURRENT_DATE + INTERVAL '7 days', '19:00:00', '11111111-1111-1111-1111-111111111111', 18000, 85, 'active', 0.95),
  ('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 'Beale Street Music Festival', 'beale street music festival', 'Annual Memphis in May music festival', 'festival', CURRENT_DATE + INTERVAL '14 days', '12:00:00', '55555555-5555-5555-5555-555555555555', 100000, 98, 'active', 0.95),
  ('cccccccc-cccc-cccc-cccc-cccccccccccc', 'Hamilton', 'hamilton', 'Broadway musical at the Orpheum', 'theater', CURRENT_DATE + INTERVAL '21 days', '19:30:00', '33333333-3333-3333-3333-333333333333', 2300, 75, 'active', 0.90),
  ('dddddddd-dddd-dddd-dddd-dddddddddddd', 'Memphis Redbirds Opening Day', 'memphis redbirds opening day', 'Minor league baseball season opener', 'sports', CURRENT_DATE + INTERVAL '10 days', '18:30:00', '22222222-2222-2222-2222-222222222222', 8000, 65, 'active', 0.90),
  ('eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee', 'Tech Conference Memphis', 'tech conference memphis', 'Annual technology conference', 'conference', CURRENT_DATE + INTERVAL '30 days', '09:00:00', '11111111-1111-1111-1111-111111111111', 5000, 70, 'active', 0.85);

-- Insert event sources
INSERT INTO event_sources (event_id, source_name, source_event_id, raw_data) VALUES
  ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'ticketmaster', 'TM_12345', '{"id": "TM_12345", "name": "Memphis Grizzlies vs Lakers"}'),
  ('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 'predicthq', 'PHQ_67890', '{"id": "PHQ_67890", "title": "Beale Street Music Festival", "phq_attendance": 100000}'),
  ('cccccccc-cccc-cccc-cccc-cccccccccccc', 'ticketmaster', 'TM_11111', '{"id": "TM_11111", "name": "Hamilton"}'),
  ('dddddddd-dddd-dddd-dddd-dddddddddddd', 'seatgeek', 'SG_22222', '{"id": "SG_22222", "title": "Memphis Redbirds Opening Day"}'),
  ('eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee', 'memphis_travel', 'MT_33333', '{"title": "Tech Conference Memphis"}');

-- Insert sample daily demand (for the next 30 days)
DO $$
DECLARE
  d DATE;
  score INTEGER;
  level TEXT;
  multiplier NUMERIC;
BEGIN
  FOR i IN 0..30 LOOP
    d := CURRENT_DATE + i;

    -- Generate varying demand based on day of week
    CASE EXTRACT(DOW FROM d)
      WHEN 0 THEN score := 40 + (random() * 20)::int; -- Sunday
      WHEN 1 THEN score := 20 + (random() * 15)::int; -- Monday
      WHEN 2 THEN score := 20 + (random() * 15)::int; -- Tuesday
      WHEN 3 THEN score := 25 + (random() * 15)::int; -- Wednesday
      WHEN 4 THEN score := 30 + (random() * 20)::int; -- Thursday
      WHEN 5 THEN score := 50 + (random() * 30)::int; -- Friday
      WHEN 6 THEN score := 55 + (random() * 35)::int; -- Saturday
    END CASE;

    -- Determine level
    IF score < 30 THEN
      level := 'low';
      multiplier := 0.85;
    ELSIF score < 60 THEN
      level := 'moderate';
      multiplier := 1.0;
    ELSIF score < 100 THEN
      level := 'high';
      multiplier := 1.35;
    ELSIF score < 150 THEN
      level := 'very_high';
      multiplier := 1.75;
    ELSE
      level := 'extreme';
      multiplier := 2.5;
    END IF;

    -- Weekend bonus
    IF EXTRACT(DOW FROM d) IN (0, 5, 6) THEN
      multiplier := multiplier * 1.15;
    END IF;

    INSERT INTO daily_demand (date, total_demand_score, event_count, demand_level, price_multiplier, suggested_min_price, suggested_max_price)
    VALUES (d, score, (random() * 3)::int, level, round(multiplier::numeric, 2), round(100 * multiplier * 0.9), round(100 * multiplier * 1.1))
    ON CONFLICT (date) DO NOTHING;
  END LOOP;
END $$;

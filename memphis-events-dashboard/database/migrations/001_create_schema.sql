-- Memphis Events Dashboard Schema

-- Enable extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";

-- Venues table
CREATE TABLE venues (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    normalized_name VARCHAR(255) NOT NULL,
    address TEXT,
    latitude DECIMAL(10, 8),
    longitude DECIMAL(11, 8),
    capacity INTEGER,
    venue_type VARCHAR(50),
    downtown_distance_miles DECIMAL(5, 2),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_venues_normalized_name ON venues(normalized_name);
CREATE INDEX idx_venues_location ON venues(latitude, longitude);

-- Events table
CREATE TABLE events (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    title VARCHAR(500) NOT NULL,
    normalized_title VARCHAR(500) NOT NULL,
    description TEXT,
    event_type VARCHAR(50) CHECK (event_type IN ('concert', 'sports', 'conference', 'festival', 'convention', 'theater', 'other')),
    start_date DATE NOT NULL,
    start_time TIME,
    end_date DATE,
    end_time TIME,
    venue_id UUID REFERENCES venues(id) ON DELETE SET NULL,
    expected_attendance INTEGER,
    demand_impact_score INTEGER CHECK (demand_impact_score >= 0 AND demand_impact_score <= 100),
    status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'cancelled', 'postponed', 'completed')),
    confidence_score DECIMAL(3, 2) CHECK (confidence_score >= 0 AND confidence_score <= 1),
    ticket_price_min DECIMAL(10, 2),
    ticket_price_max DECIMAL(10, 2),
    image_url TEXT,
    event_url TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_events_start_date ON events(start_date);
CREATE INDEX idx_events_normalized_title ON events(normalized_title);
CREATE INDEX idx_events_type ON events(event_type);
CREATE INDEX idx_events_venue ON events(venue_id);
CREATE INDEX idx_events_title_trgm ON events USING gin(normalized_title gin_trgm_ops);

-- Event sources table (for tracking which sources an event came from)
CREATE TABLE event_sources (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    event_id UUID REFERENCES events(id) ON DELETE CASCADE,
    source_name VARCHAR(50) NOT NULL CHECK (source_name IN ('ticketmaster', 'predicthq', 'seatgeek', 'memphis_travel', 'downtown_memphis')),
    source_event_id VARCHAR(255) NOT NULL,
    raw_data JSONB,
    fetched_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(source_name, source_event_id)
);

CREATE INDEX idx_event_sources_event ON event_sources(event_id);
CREATE INDEX idx_event_sources_source ON event_sources(source_name, source_event_id);

-- Daily demand table
CREATE TABLE daily_demand (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    date DATE NOT NULL UNIQUE,
    total_demand_score INTEGER DEFAULT 0,
    event_count INTEGER DEFAULT 0,
    demand_level VARCHAR(20) CHECK (demand_level IN ('low', 'moderate', 'high', 'very_high', 'extreme')),
    price_multiplier DECIMAL(4, 2),
    suggested_min_price DECIMAL(10, 2),
    suggested_max_price DECIMAL(10, 2),
    calculated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_daily_demand_date ON daily_demand(date);

-- User settings table
CREATE TABLE user_settings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id VARCHAR(255) DEFAULT 'default',
    base_nightly_rate DECIMAL(10, 2) DEFAULT 100.00,
    min_nightly_rate DECIMAL(10, 2) DEFAULT 50.00,
    max_nightly_rate DECIMAL(10, 2) DEFAULT 500.00,
    property_type VARCHAR(50),
    distance_from_downtown DECIMAL(5, 2),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(user_id)
);

-- Sync log table (for tracking data refresh jobs)
CREATE TABLE sync_log (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    source_name VARCHAR(50) NOT NULL,
    sync_type VARCHAR(20) CHECK (sync_type IN ('scheduled', 'manual', 'full')),
    status VARCHAR(20) CHECK (status IN ('running', 'completed', 'failed')),
    events_fetched INTEGER DEFAULT 0,
    events_added INTEGER DEFAULT 0,
    events_updated INTEGER DEFAULT 0,
    events_deduplicated INTEGER DEFAULT 0,
    error_message TEXT,
    started_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    completed_at TIMESTAMP WITH TIME ZONE
);

CREATE INDEX idx_sync_log_source ON sync_log(source_name);
CREATE INDEX idx_sync_log_started ON sync_log(started_at DESC);

-- Insert default user settings
INSERT INTO user_settings (user_id, base_nightly_rate, min_nightly_rate, max_nightly_rate)
VALUES ('default', 100.00, 50.00, 500.00);

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Triggers for updated_at
CREATE TRIGGER update_venues_updated_at BEFORE UPDATE ON venues
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_events_updated_at BEFORE UPDATE ON events
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_daily_demand_updated_at BEFORE UPDATE ON daily_demand
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_user_settings_updated_at BEFORE UPDATE ON user_settings
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- YellowWant.jo Database Schema
-- Enable PostGIS extension for geolocation queries
CREATE EXTENSION IF NOT EXISTS postgis;

-- ============================================
-- TABLES
-- ============================================

-- Taxis table (driver profiles)
CREATE TABLE IF NOT EXISTS taxis (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    uid UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    driver_name TEXT NOT NULL,
    phone TEXT NOT NULL UNIQUE,
    plate_number TEXT NOT NULL UNIQUE,
    car_make_model TEXT NOT NULL,
    company TEXT,
    license_plate_url TEXT,
    location GEOGRAPHY(POINT, 4326),
    is_online BOOLEAN DEFAULT false,
    status TEXT DEFAULT 'offline' CHECK (status IN ('offline', 'online', 'busy')),
    no_show_count INTEGER DEFAULT 0,
    verified BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- Create index for location queries
CREATE INDEX IF NOT EXISTS idx_taxis_location ON taxis USING GIST (location);
CREATE INDEX IF NOT EXISTS idx_taxis_is_online ON taxis (is_online) WHERE is_online = true;

-- Requests table
CREATE TABLE IF NOT EXISTS requests (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    passenger_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    passenger_name TEXT NOT NULL,
    passenger_phone TEXT,
    driver_id UUID REFERENCES taxis(id) ON DELETE SET NULL,
    pickup_location TEXT NOT NULL,
    pickup_coords GEOGRAPHY(POINT, 4326),
    destination_location TEXT NOT NULL,
    destination_coords GEOGRAPHY(POINT, 4326),
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'arriving', 'arrived', 'in_progress', 'completed', 'cancelled')),
    digital_hide BOOLEAN DEFAULT false,
    payment_method TEXT DEFAULT 'cash' CHECK (payment_method IN ('cash', 'card')),
    fare_amount DECIMAL(10, 2) DEFAULT 0,
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT now(),
    accepted_at TIMESTAMPTZ,
    arrived_at TIMESTAMPTZ,
    completed_at TIMESTAMPTZ,
    cancelled_at TIMESTAMPTZ
);

-- Create index for status queries
CREATE INDEX IF NOT EXISTS idx_requests_status ON requests (status);
CREATE INDEX IF NOT EXISTS idx_requests_created ON requests (created_at DESC);
CREATE INDEX IF NOT EXISTS idx_requests_passenger ON requests (passenger_id);
CREATE INDEX IF NOT EXISTS idx_requests_driver ON requests (driver_id);

-- Messages table (chat between driver and passenger)
CREATE TABLE IF NOT EXISTS messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    request_id UUID REFERENCES requests(id) ON DELETE CASCADE NOT NULL,
    sender_id UUID NOT NULL,
    sender_type TEXT NOT NULL CHECK (sender_type IN ('passenger', 'driver')),
    content TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_messages_request ON messages (request_id);
CREATE INDEX IF NOT EXISTS idx_messages_created ON messages (created_at);

-- Admin users table (single owner)
CREATE TABLE IF NOT EXISTS admins (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email TEXT NOT NULL UNIQUE,
    name TEXT NOT NULL,
    role TEXT DEFAULT 'owner' CHECK (role IN ('owner', 'support')),
    created_at TIMESTAMPTZ DEFAULT now()
);

-- ============================================
-- FUNCTIONS
-- ============================================

-- Function to find nearby taxis using PostGIS
CREATE OR REPLACE FUNCTION find_nearby_taxis(
    passenger_lat DOUBLE PRECISION,
    passenger_lng DOUBLE PRECISION,
    radius_meters INTEGER DEFAULT 2000
)
RETURNS TABLE (
    id UUID,
    driver_name TEXT,
    plate_number TEXT,
    car_make_model TEXT,
    phone TEXT,
    distance DOUBLE PRECISION,
    location GEOGRAPHY
)
LANGUAGE plpgsql
AS $$
BEGIN
    RETURN QUERY
    SELECT
        t.id,
        t.driver_name,
        t.plate_number,
        t.car_make_model,
        t.phone,
        ST_Distance(
            t.location,
            ST_SetSRID(ST_MakePoint(passenger_lng, passenger_lat), 4326)::geography
        ) AS distance,
        t.location
    FROM taxis t
    WHERE
        t.is_online = true
        AND t.verified = true
        AND t.status = 'offline'
        AND ST_DWithin(
            t.location,
            ST_SetSRID(ST_MakePoint(passenger_lng, passenger_lat), 4326)::geography,
            radius_meters
        )
    ORDER BY distance ASC;
END;
$$;

-- Function to update driver's location
CREATE OR REPLACE FUNCTION update_driver_location(
    driver_uuid UUID,
    new_location GEOGRAPHY
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    UPDATE taxis
    SET location = new_location, updated_at = now()
    WHERE uid = driver_uuid;
END;
$$;

-- Function to calculate fare (placeholder - can be customized)
CREATE OR REPLACE FUNCTION calculate_fare(
    pickup_lat DOUBLE PRECISION,
    pickup_lng DOUBLE PRECISION,
    dest_lat DOUBLE PRECISION,
    dest_lng DOUBLE PRECISION
)
RETURNS DECIMAL(10, 2)
LANGUAGE plpgsql
AS $$
DECLARE
    distance_km DOUBLE PRECISION;
    base_fare DECIMAL(10, 2) := 0.85;
    per_km_rate DECIMAL(10, 2) := 0.35;
BEGIN
    distance_km := ST_Distance(
        ST_SetSRID(ST_MakePoint(pickup_lng, pickup_lat), 4326)::geography,
        ST_SetSRID(ST_MakePoint(dest_lng, dest_lat), 4326)::geography
    ) / 1000;
    
    RETURN ROUND(base_fare + (distance_km * per_km_rate), 2);
END;
$$;

-- Trigger to update timestamp
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_taxis_updated_at
    BEFORE UPDATE ON taxis
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at();

-- ============================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- ============================================

-- Enable RLS on all tables
ALTER TABLE taxis ENABLE ROW LEVEL SECURITY;
ALTER TABLE requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE admins ENABLE ROW LEVEL SECURITY;

-- Taxis policies
CREATE POLICY "Allow public read of verified online taxis" ON taxis
    FOR SELECT
    USING (
        verified = true
        AND is_online = true
    );

CREATE POLICY "Allow drivers to update their own profile" ON taxis
    FOR UPDATE
    USING (auth.uid() = uid);

CREATE POLICY "Allow drivers to insert their own profile" ON taxis
    FOR INSERT
    WITH CHECK (auth.uid() = uid);

CREATE POLICY "Allow admin to manage all taxis" ON taxis
    FOR ALL
    USING (
        auth.uid() IN (SELECT id FROM admins)
    );

-- Requests policies
CREATE POLICY "Allow passengers to create requests" ON requests
    FOR INSERT
    WITH CHECK (auth.uid() = passenger_id);

CREATE POLICY "Allow passengers to read their own requests" ON requests
    FOR SELECT
    USING (auth.uid() = passenger_id);

CREATE POLICY "Allow drivers to read requests assigned to them" ON requests
    FOR SELECT
    USING (auth.uid() = driver_id);

CREATE POLICY "Allow drivers to update their assigned requests" ON requests
    FOR UPDATE
    USING (auth.uid() = driver_id);

CREATE POLICY "Allow passengers to cancel their own pending requests" ON requests
    FOR UPDATE
    USING (
        auth.uid() = passenger_id
        AND status IN ('pending', 'accepted')
    );

CREATE POLICY "Allow admin to read all requests" ON requests
    FOR SELECT
    USING (
        auth.uid() IN (SELECT id FROM admins)
    );

CREATE POLICY "Allow admin to update all requests" ON requests
    FOR UPDATE
    USING (
        auth.uid() IN (SELECT id FROM admins)
    );

-- Messages policies
CREATE POLICY "Allow participants to read messages for their request" ON messages
    FOR SELECT
    USING (
        request_id IN (
            SELECT id FROM requests
            WHERE passenger_id = auth.uid()
            OR driver_id = auth.uid()
        )
    );

CREATE POLICY "Allow participants to insert messages for their request" ON messages
    FOR INSERT
    WITH CHECK (
        sender_id = auth.uid()
        AND request_id IN (
            SELECT id FROM requests
            WHERE passenger_id = auth.uid()
            OR driver_id = auth.uid()
        )
    );

-- Admins policies
CREATE POLICY "Allow admin to read admins" ON admins
    FOR SELECT
    USING (auth.uid() = id);

-- ============================================
-- STORAGE BUCKETS
-- ============================================

-- Create storage bucket for license photos
INSERT INTO storage.buckets (id, name, public)
VALUES ('license-photos', 'license-photos', true)
ON CONFLICT (id) DO NOTHING;

-- Create storage policy for license photos
CREATE POLICY "Allow public read of license photos" ON storage.objects
    FOR SELECT
    USING (bucket_id = 'license-photos');

CREATE POLICY "Allow authenticated users to upload license photos" ON storage.objects
    FOR INSERT
    WITH CHECK (
        bucket_id = 'license-photos'
        AND auth.role() = 'authenticated'
    );

CREATE POLICY "Allow drivers to update their own license photos" ON storage.objects
    FOR UPDATE
    USING (
        bucket_id = 'license-photos'
        AND auth.uid()::text = (storage.foldername(name))[1]
    );

-- ============================================
-- SAMPLE DATA (for testing)
-- ============================================

-- Note: This should be removed in production
-- Sample taxi data for testing (without auth dependency)
-- INSERT INTO taxis (driver_name, phone, plate_number, car_make_model, location, is_online, verified)
-- VALUES
--     ('أحمد محمد', '+962791234567', '12-34567', 'Toyota Camry 2022', ST_SetSRID(ST_MakePoint(35.9106, 31.9539), 4326)::geography, true, true),
--     ('خالد عبدالله', '+962792345678', '23-45678', 'Hyundai Sonata 2021', ST_SetSRID(ST_MakePoint(35.9150, 31.9550), 4326)::geography, true, true),
--     ('محمد حسن', '+962793456789', '34-56789', 'Kia K5 2023', ST_SetSRID(ST_MakePoint(35.9050, 31.9500), 4326)::geography, true, true);

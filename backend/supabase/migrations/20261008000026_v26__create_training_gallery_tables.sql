CREATE TABLE IF NOT EXISTS training_glimpses (
    id VARCHAR(36) PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    caption TEXT,
    course_title VARCHAR(255),
    location VARCHAR(255),
    event_date VARCHAR(100),
    attendee_count INT DEFAULT 0,
    image_url TEXT NOT NULL,
    display_order INT DEFAULT 0,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_training_glimpses_active_order ON training_glimpses (is_active, display_order);

-- Seed initial training glimpses
INSERT INTO training_glimpses (id, title, caption, course_title, location, event_date, attendee_count, image_url, display_order, is_active)
VALUES
('glimpse-1', 'Sterile Tissue Culture & Laminar Flow Inoculation', 'Trainees practicing pure spawn inoculation under HEPA filter airflow conditions during the Masterclass.', 'Commercial Spawn Production Masterclass', 'Shriyap Enterprise Lab, Davangere', 'September 2026 Batch', 35, 'https://images.unsplash.com/photo-1581093458791-9f3c3900df4b?auto=format&fit=crop&w=1200&q=80', 1, true),
('glimpse-2', 'Commercial Substrate Pasteurization & Moisture Audit', 'Live practical demonstration on wheat straw thermal pasteurization and pH buffer tuning.', 'Oyster & Button Mushroom Farming Workshop', 'Agritech Demonstration Farm, Davangere', 'August 2026 Batch', 42, 'https://images.unsplash.com/photo-1530836369250-ef72a3f5cda8?auto=format&fit=crop&w=1200&q=80', 2, true),
('glimpse-3', 'High-Yield Milky Mushroom Fruiting Chamber Setup', 'Trainees inspecting climate-controlled humidity and ventilation systems for tropical fruiting.', 'Tropical Milky Mushroom Specialist Course', 'Agritech Demonstration Farm, Davangere', 'July 2026 Batch', 28, 'https://images.unsplash.com/photo-1518531933037-91b2f5f229cc?auto=format&fit=crop&w=1200&q=80', 3, true),
('glimpse-4', 'Grain Spawn Quality Certification & Harvest Graduation', 'Certified trainees receiving government-aligned completion certificates and mother spawn starter kits.', 'Agritech Entrepreneur Incubator', 'Shriyap Enterprise Auditorium, Davangere', 'June 2026 Batch', 50, 'https://images.unsplash.com/photo-1523240795612-9a054b0db644?auto=format&fit=crop&w=1200&q=80', 4, true)
ON CONFLICT (id) DO NOTHING;

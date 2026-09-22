-- Sporekart Migration V16: Product Information Model & Gallery Enhancements

-- 1. Create Product Information Table for structured compliance, food & agritech metadata
CREATE TABLE IF NOT EXISTS product_information (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    product_id UUID NOT NULL UNIQUE REFERENCES products(id) ON DELETE CASCADE,
    
    -- Basic Product & Trade Disclosures
    brand_name VARCHAR(150) DEFAULT 'Sporekart Agritech',
    country_of_origin VARCHAR(100) DEFAULT 'India',
    manufacturer_details TEXT,
    packer_details TEXT,
    marketer_details TEXT,
    customer_care_details TEXT,
    net_quantity VARCHAR(50),
    unit_of_measure VARCHAR(30),
    
    -- Food & FSSAI Compliance
    fssai_license_number VARCHAR(50),
    food_category VARCHAR(100),
    is_vegetarian BOOLEAN DEFAULT TRUE,
    ingredients TEXT,
    allergen_info TEXT,
    nutritional_info_json TEXT,
    serving_size VARCHAR(50),
    
    -- Mushroom & Agritech Specific Disclosures
    mushroom_species VARCHAR(150),
    cultivation_method TEXT,
    strain_variety VARCHAR(100),
    recommended_substrate TEXT,
    inoculation_guidance TEXT,
    kit_contents TEXT,
    cultivation_cycle_days INT,
    environment_requirements TEXT,
    
    -- Storage & Handling Instructions
    storage_instructions TEXT,
    storage_temperature_guidance VARCHAR(100),
    shelf_life_guidance VARCHAR(100),
    handling_instructions TEXT,
    safety_warnings TEXT,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 2. Extend Product Media Tables for Roles (PRIMARY, GALLERY, PACKAGING, LIFESTYLE, INSTRUCTION)
ALTER TABLE product_media ADD COLUMN IF NOT EXISTS role VARCHAR(50) NOT NULL DEFAULT 'GALLERY';
ALTER TABLE media_product_links ADD COLUMN IF NOT EXISTS role VARCHAR(50) NOT NULL DEFAULT 'GALLERY';

-- 3. Indexes
CREATE INDEX IF NOT EXISTS idx_product_information_product_id ON product_information(product_id);

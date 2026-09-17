-- Sporekart Migration V4: Media & Asset Management Bounded Context

-- 1. Media Assets Table (Metadata repository for Supabase Storage objects)
CREATE TABLE IF NOT EXISTS media_assets (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    storage_provider VARCHAR(50) NOT NULL DEFAULT 'SUPABASE',
    bucket VARCHAR(100) NOT NULL DEFAULT 'sporekart-media',
    storage_key VARCHAR(255) NOT NULL UNIQUE,
    original_filename VARCHAR(255) NOT NULL,
    mime_type VARCHAR(100) NOT NULL,
    size_bytes BIGINT NOT NULL,
    width INT,
    height INT,
    checksum VARCHAR(64),
    media_type VARCHAR(50) NOT NULL DEFAULT 'IMAGE', -- IMAGE, VIDEO, DOCUMENT, PDF, CERTIFICATE
    status VARCHAR(50) NOT NULL DEFAULT 'UPLOADING', -- UPLOADING, PROCESSING, READY, ACTIVE, FAILED, ARCHIVED
    alt_text TEXT,
    is_public BOOLEAN NOT NULL DEFAULT TRUE,
    is_deleted BOOLEAN NOT NULL DEFAULT FALSE,
    deleted_at TIMESTAMP WITH TIME ZONE,
    created_by UUID,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 2. Entity Association Links (Preventing orphaned media)
CREATE TABLE IF NOT EXISTS media_product_links (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    media_id UUID NOT NULL REFERENCES media_assets(id) ON DELETE CASCADE,
    product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    variant_id UUID REFERENCES product_variants(id) ON DELETE CASCADE,
    is_primary BOOLEAN NOT NULL DEFAULT FALSE,
    display_order INT NOT NULL DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS media_course_links (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    media_id UUID NOT NULL REFERENCES media_assets(id) ON DELETE CASCADE,
    course_id UUID NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_media_assets_status ON media_assets(status, is_deleted);
CREATE INDEX IF NOT EXISTS idx_media_product_links_product ON media_product_links(product_id);
CREATE INDEX IF NOT EXISTS idx_media_course_links_course ON media_course_links(course_id);

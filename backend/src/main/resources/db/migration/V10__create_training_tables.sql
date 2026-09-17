-- V10: Create Training Module Tables & Customer Capability Fields

ALTER TABLE customer_profiles 
ADD COLUMN IF NOT EXISTS has_training_capability BOOLEAN NOT NULL DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS training_capability_granted_at TIMESTAMP WITH TIME ZONE;

CREATE TABLE IF NOT EXISTS course_categories (
    id UUID PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    slug VARCHAR(100) NOT NULL UNIQUE,
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS courses (
    id UUID PRIMARY KEY,
    category_id UUID,
    title VARCHAR(255) NOT NULL,
    slug VARCHAR(255) NOT NULL UNIQUE,
    description TEXT,
    duration_days INT NOT NULL,
    fee_inr DECIMAL(10, 2) NOT NULL,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_courses_category_id FOREIGN KEY (category_id) REFERENCES course_categories(id)
);

CREATE INDEX idx_courses_category_id ON courses(category_id);
CREATE INDEX idx_courses_slug ON courses(slug);

CREATE TABLE IF NOT EXISTS batches (
    id UUID PRIMARY KEY,
    course_id UUID NOT NULL,
    batch_code VARCHAR(100) NOT NULL UNIQUE,
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    capacity INT NOT NULL,
    enrolled_count INT NOT NULL DEFAULT 0,
    status VARCHAR(50) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_batches_course_id FOREIGN KEY (course_id) REFERENCES courses(id)
);

CREATE INDEX idx_batches_course_id ON batches(course_id);

CREATE TABLE IF NOT EXISTS batch_schedules (
    id UUID PRIMARY KEY,
    batch_id UUID NOT NULL,
    topic VARCHAR(255) NOT NULL,
    scheduled_at TIMESTAMP WITH TIME ZONE NOT NULL,
    duration_minutes INT NOT NULL,
    meeting_link VARCHAR(500),
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_batch_schedules_batch_id FOREIGN KEY (batch_id) REFERENCES batches(id) ON DELETE CASCADE
);

CREATE INDEX idx_batch_schedules_batch_id ON batch_schedules(batch_id);

CREATE TABLE IF NOT EXISTS enrollments (
    id UUID PRIMARY KEY,
    user_id UUID NOT NULL,
    course_id UUID NOT NULL,
    batch_id UUID NOT NULL,
    status VARCHAR(50) NOT NULL,
    fee_paid_inr DECIMAL(10, 2) NOT NULL,
    payment_reference VARCHAR(100),
    enrolled_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_enrollments_course_id FOREIGN KEY (course_id) REFERENCES courses(id),
    CONSTRAINT fk_enrollments_batch_id FOREIGN KEY (batch_id) REFERENCES batches(id)
);

CREATE INDEX idx_enrollments_user_id ON enrollments(user_id);
CREATE INDEX idx_enrollments_batch_id ON enrollments(batch_id);

CREATE TABLE IF NOT EXISTS attendances (
    id UUID PRIMARY KEY,
    enrollment_id UUID NOT NULL,
    schedule_id UUID NOT NULL,
    is_present BOOLEAN NOT NULL DEFAULT FALSE,
    marked_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_attendances_enrollment_id FOREIGN KEY (enrollment_id) REFERENCES enrollments(id) ON DELETE CASCADE,
    CONSTRAINT fk_attendances_schedule_id FOREIGN KEY (schedule_id) REFERENCES batch_schedules(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS completions (
    id UUID PRIMARY KEY,
    enrollment_id UUID NOT NULL UNIQUE,
    user_id UUID NOT NULL,
    course_id UUID NOT NULL,
    completed_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    grade VARCHAR(20),
    CONSTRAINT fk_completions_enrollment_id FOREIGN KEY (enrollment_id) REFERENCES enrollments(id)
);

CREATE TABLE IF NOT EXISTS certificates (
    id UUID PRIMARY KEY,
    enrollment_id UUID NOT NULL UNIQUE,
    certificate_code VARCHAR(100) NOT NULL UNIQUE,
    issue_date DATE NOT NULL,
    certificate_url VARCHAR(500),
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_certificates_enrollment_id FOREIGN KEY (enrollment_id) REFERENCES enrollments(id)
);

CREATE INDEX idx_certificates_certificate_code ON certificates(certificate_code);

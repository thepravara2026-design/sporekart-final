-- Sporekart Database Migration V25: Training & Workshop Review & Feedback System

CREATE TABLE IF NOT EXISTS training_reviews (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    course_id UUID NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
    batch_id UUID NOT NULL REFERENCES batches(id) ON DELETE CASCADE,
    enrollment_id UUID NOT NULL REFERENCES enrollments(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    rating INT NOT NULL CHECK (rating >= 1 AND rating <= 5),
    instructor_rating INT CHECK (instructor_rating >= 1 AND instructor_rating <= 5),
    review_title VARCHAR(255),
    review_text TEXT NOT NULL,
    status VARCHAR(50) NOT NULL DEFAULT 'PUBLISHED',
    is_verified_trainee BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    moderated_at TIMESTAMP WITH TIME ZONE,
    moderated_by UUID REFERENCES users(id) ON DELETE SET NULL,
    moderation_reason TEXT,
    CONSTRAINT uk_training_reviews_user_enrollment UNIQUE (user_id, enrollment_id)
);

CREATE INDEX IF NOT EXISTS idx_training_reviews_course_id ON training_reviews(course_id);
CREATE INDEX IF NOT EXISTS idx_training_reviews_user_id ON training_reviews(user_id);
CREATE INDEX IF NOT EXISTS idx_training_reviews_status ON training_reviews(status);
CREATE INDEX IF NOT EXISTS idx_training_reviews_created_at ON training_reviews(created_at);

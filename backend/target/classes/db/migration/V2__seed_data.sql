-- =============================================================================
-- V2__seed_data.sql
-- Seed roles, departments, and a default admin account.
-- Default admin password: Admin@123  (BCrypt hash below) — CHANGE AFTER FIRST LOGIN.
-- =============================================================================

INSERT INTO roles (name, description) VALUES
    ('ADMIN', 'Hospital administrator with full system access'),
    ('DOCTOR', 'Medical practitioner'),
    ('RECEPTIONIST', 'Front desk staff'),
    ('PATIENT', 'Registered patient');

INSERT INTO departments (name, description) VALUES
    ('General Medicine', 'General physician consultations'),
    ('Cardiology', 'Heart and cardiovascular care'),
    ('Neurology', 'Brain and nervous system care'),
    ('Orthopedics', 'Bone, joint and muscle care'),
    ('Pediatrics', 'Child healthcare'),
    ('Dermatology', 'Skin care'),
    ('ENT', 'Ear, Nose and Throat'),
    ('Gynecology', 'Women''s health'),
    ('Emergency', 'Emergency and trauma care'),
    ('Radiology', 'Imaging and diagnostics');

-- BCrypt hash (10 rounds) for plaintext password "Admin@123" — verified against Spring's BCryptPasswordEncoder.
INSERT INTO users (role_id, first_name, last_name, email, phone, password_hash, is_active, is_email_verified)
VALUES (
    (SELECT id FROM roles WHERE name = 'ADMIN'),
    'System', 'Administrator', 'admin@hms.local', '+10000000000',
    '$2b$10$ZF/0Mmc2.B5hsNG01r5dfOtLCB4X5JEMTRvtVYCypsIWPyquEYczC',
    TRUE, TRUE
);

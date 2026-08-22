-- =============================================================================
-- AI Powered Hospital Management System
-- V1__init_schema.sql
-- Normalized MySQL 8 schema
-- =============================================================================

SET NAMES utf8mb4;
SET FOREIGN_KEY_CHECKS = 0;

-- -----------------------------------------------------------------------------
-- roles
-- -----------------------------------------------------------------------------
CREATE TABLE roles (
    id          BIGINT AUTO_INCREMENT PRIMARY KEY,
    name        VARCHAR(30) NOT NULL UNIQUE,   -- ADMIN, DOCTOR, RECEPTIONIST, PATIENT
    description VARCHAR(255)
) ENGINE=InnoDB;

-- -----------------------------------------------------------------------------
-- users  (core auth identity shared by every role)
-- -----------------------------------------------------------------------------
CREATE TABLE users (
    id                       BIGINT AUTO_INCREMENT PRIMARY KEY,
    role_id                  BIGINT NOT NULL,
    first_name               VARCHAR(80) NOT NULL,
    last_name                VARCHAR(80) NOT NULL,
    email                    VARCHAR(150) NOT NULL UNIQUE,
    phone                    VARCHAR(20),
    password_hash            VARCHAR(255) NOT NULL,
    gender                   ENUM('MALE','FEMALE','OTHER'),
    date_of_birth             DATE,
    profile_image_url        VARCHAR(500),
    is_active                 BOOLEAN NOT NULL DEFAULT TRUE,
    is_email_verified        BOOLEAN NOT NULL DEFAULT FALSE,
    email_verification_token VARCHAR(255),
    reset_password_token     VARCHAR(255),
    reset_password_expires_at DATETIME,
    last_login_at             DATETIME,
    created_at                DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at                DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT fk_users_role FOREIGN KEY (role_id) REFERENCES roles(id)
) ENGINE=InnoDB;

CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_role ON users(role_id);

-- -----------------------------------------------------------------------------
-- refresh_tokens
-- -----------------------------------------------------------------------------
CREATE TABLE refresh_tokens (
    id          BIGINT AUTO_INCREMENT PRIMARY KEY,
    user_id     BIGINT NOT NULL,
    token       VARCHAR(500) NOT NULL UNIQUE,
    expires_at  DATETIME NOT NULL,
    revoked     BOOLEAN NOT NULL DEFAULT FALSE,
    created_at  DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_refresh_tokens_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB;

-- -----------------------------------------------------------------------------
-- departments
-- -----------------------------------------------------------------------------
CREATE TABLE departments (
    id          BIGINT AUTO_INCREMENT PRIMARY KEY,
    name        VARCHAR(100) NOT NULL UNIQUE,
    description VARCHAR(500),
    is_active   BOOLEAN NOT NULL DEFAULT TRUE,
    created_at  DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB;

-- -----------------------------------------------------------------------------
-- doctors  (1:1 extension of users)
-- -----------------------------------------------------------------------------
CREATE TABLE doctors (
    id                 BIGINT AUTO_INCREMENT PRIMARY KEY,
    user_id            BIGINT NOT NULL UNIQUE,
    department_id      BIGINT NOT NULL,
    specialization     VARCHAR(150),
    qualification      VARCHAR(255),
    license_number     VARCHAR(100) UNIQUE,
    years_of_experience INT DEFAULT 0,
    consultation_fee   DECIMAL(10,2) DEFAULT 0.00,
    bio                TEXT,
    available_from     TIME,
    available_to       TIME,
    is_available       BOOLEAN NOT NULL DEFAULT TRUE,
    created_at         DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_doctors_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    CONSTRAINT fk_doctors_department FOREIGN KEY (department_id) REFERENCES departments(id)
) ENGINE=InnoDB;

-- -----------------------------------------------------------------------------
-- patients  (1:1 extension of users)
-- -----------------------------------------------------------------------------
CREATE TABLE patients (
    id                    BIGINT AUTO_INCREMENT PRIMARY KEY,
    user_id               BIGINT NOT NULL UNIQUE,
    blood_group           VARCHAR(5),
    height_cm             DECIMAL(5,2),
    weight_kg             DECIMAL(5,2),
    address               VARCHAR(500),
    emergency_contact_name VARCHAR(150),
    emergency_contact_phone VARCHAR(20),
    allergies             TEXT,
    chronic_conditions    TEXT,
    insurance_provider    VARCHAR(150),
    insurance_policy_no   VARCHAR(100),
    created_at            DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_patients_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB;

-- -----------------------------------------------------------------------------
-- receptionists (1:1 extension of users)
-- -----------------------------------------------------------------------------
CREATE TABLE receptionists (
    id           BIGINT AUTO_INCREMENT PRIMARY KEY,
    user_id      BIGINT NOT NULL UNIQUE,
    desk_number  VARCHAR(20),
    shift        ENUM('MORNING','EVENING','NIGHT') DEFAULT 'MORNING',
    created_at   DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_receptionists_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB;

-- -----------------------------------------------------------------------------
-- rooms
-- -----------------------------------------------------------------------------
CREATE TABLE rooms (
    id            BIGINT AUTO_INCREMENT PRIMARY KEY,
    room_number   VARCHAR(20) NOT NULL UNIQUE,
    room_type     ENUM('GENERAL','PRIVATE','ICU','OPERATION_THEATRE','EMERGENCY') NOT NULL,
    floor         VARCHAR(10),
    capacity      INT NOT NULL DEFAULT 1,
    occupied_beds INT NOT NULL DEFAULT 0,
    daily_rate    DECIMAL(10,2) NOT NULL DEFAULT 0.00,
    status        ENUM('AVAILABLE','OCCUPIED','MAINTENANCE') NOT NULL DEFAULT 'AVAILABLE',
    created_at    DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB;

-- -----------------------------------------------------------------------------
-- appointments
-- -----------------------------------------------------------------------------
CREATE TABLE appointments (
    id               BIGINT AUTO_INCREMENT PRIMARY KEY,
    patient_id       BIGINT NOT NULL,
    doctor_id        BIGINT NOT NULL,
    department_id    BIGINT NOT NULL,
    appointment_date DATE NOT NULL,
    appointment_time TIME NOT NULL,
    status           ENUM('PENDING','CONFIRMED','IN_PROGRESS','COMPLETED','CANCELLED','NO_SHOW') NOT NULL DEFAULT 'PENDING',
    reason           VARCHAR(500),
    queue_number     INT,
    booked_by_user_id BIGINT,           -- receptionist or patient who created it
    cancelled_reason VARCHAR(500),
    created_at       DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at       DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT fk_appt_patient FOREIGN KEY (patient_id) REFERENCES patients(id),
    CONSTRAINT fk_appt_doctor FOREIGN KEY (doctor_id) REFERENCES doctors(id),
    CONSTRAINT fk_appt_department FOREIGN KEY (department_id) REFERENCES departments(id),
    CONSTRAINT fk_appt_booked_by FOREIGN KEY (booked_by_user_id) REFERENCES users(id)
) ENGINE=InnoDB;

CREATE INDEX idx_appt_doctor_date ON appointments(doctor_id, appointment_date);
CREATE INDEX idx_appt_patient ON appointments(patient_id);
CREATE INDEX idx_appt_status ON appointments(status);

-- -----------------------------------------------------------------------------
-- medicines (catalog)
-- -----------------------------------------------------------------------------
CREATE TABLE medicines (
    id            BIGINT AUTO_INCREMENT PRIMARY KEY,
    name          VARCHAR(200) NOT NULL,
    generic_name  VARCHAR(200),
    manufacturer  VARCHAR(200),
    category      VARCHAR(100),
    unit          VARCHAR(30),           -- tablet, ml, mg...
    unit_price    DECIMAL(10,2) NOT NULL DEFAULT 0.00,
    description   TEXT,
    created_at    DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB;

-- -----------------------------------------------------------------------------
-- inventory (stock tracking per medicine)
-- -----------------------------------------------------------------------------
CREATE TABLE inventory (
    id                BIGINT AUTO_INCREMENT PRIMARY KEY,
    medicine_id       BIGINT NOT NULL UNIQUE,
    quantity_in_stock INT NOT NULL DEFAULT 0,
    reorder_level     INT NOT NULL DEFAULT 10,
    batch_number      VARCHAR(100),
    expiry_date       DATE,
    last_restocked_at DATETIME,
    updated_at        DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT fk_inventory_medicine FOREIGN KEY (medicine_id) REFERENCES medicines(id) ON DELETE CASCADE
) ENGINE=InnoDB;

-- -----------------------------------------------------------------------------
-- prescriptions
-- -----------------------------------------------------------------------------
CREATE TABLE prescriptions (
    id               BIGINT AUTO_INCREMENT PRIMARY KEY,
    appointment_id   BIGINT NOT NULL,
    patient_id       BIGINT NOT NULL,
    doctor_id        BIGINT NOT NULL,
    diagnosis        TEXT,
    notes            TEXT,
    ai_summary       TEXT,                -- AI-generated plain-language summary
    pdf_url          VARCHAR(500),
    created_at       DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_presc_appointment FOREIGN KEY (appointment_id) REFERENCES appointments(id),
    CONSTRAINT fk_presc_patient FOREIGN KEY (patient_id) REFERENCES patients(id),
    CONSTRAINT fk_presc_doctor FOREIGN KEY (doctor_id) REFERENCES doctors(id)
) ENGINE=InnoDB;

-- -----------------------------------------------------------------------------
-- prescription_items (medicines within a prescription)
-- -----------------------------------------------------------------------------
CREATE TABLE prescription_items (
    id               BIGINT AUTO_INCREMENT PRIMARY KEY,
    prescription_id  BIGINT NOT NULL,
    medicine_id      BIGINT NOT NULL,
    dosage           VARCHAR(100),        -- e.g. "500mg"
    frequency        VARCHAR(100),        -- e.g. "Twice a day"
    duration_days    INT,
    instructions     VARCHAR(500),        -- e.g. "After food"
    CONSTRAINT fk_pi_prescription FOREIGN KEY (prescription_id) REFERENCES prescriptions(id) ON DELETE CASCADE,
    CONSTRAINT fk_pi_medicine FOREIGN KEY (medicine_id) REFERENCES medicines(id)
) ENGINE=InnoDB;

-- -----------------------------------------------------------------------------
-- laboratories (lab test catalog)
-- -----------------------------------------------------------------------------
CREATE TABLE laboratories (
    id          BIGINT AUTO_INCREMENT PRIMARY KEY,
    test_name   VARCHAR(200) NOT NULL,
    category    VARCHAR(100),
    price       DECIMAL(10,2) NOT NULL DEFAULT 0.00,
    description VARCHAR(500)
) ENGINE=InnoDB;

-- -----------------------------------------------------------------------------
-- lab_reports
-- -----------------------------------------------------------------------------
CREATE TABLE lab_reports (
    id                BIGINT AUTO_INCREMENT PRIMARY KEY,
    patient_id        BIGINT NOT NULL,
    doctor_id         BIGINT,
    laboratory_id     BIGINT NOT NULL,
    appointment_id    BIGINT,
    status            ENUM('REQUESTED','SAMPLE_COLLECTED','IN_PROGRESS','COMPLETED','CANCELLED') NOT NULL DEFAULT 'REQUESTED',
    report_file_url   VARCHAR(500),
    result_summary    TEXT,
    ai_summary        TEXT,               -- AI-generated summary of the uploaded report
    is_abnormal       BOOLEAN DEFAULT FALSE,
    requested_at      DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    completed_at      DATETIME,
    CONSTRAINT fk_lab_report_patient FOREIGN KEY (patient_id) REFERENCES patients(id),
    CONSTRAINT fk_lab_report_doctor FOREIGN KEY (doctor_id) REFERENCES doctors(id),
    CONSTRAINT fk_lab_report_lab FOREIGN KEY (laboratory_id) REFERENCES laboratories(id),
    CONSTRAINT fk_lab_report_appt FOREIGN KEY (appointment_id) REFERENCES appointments(id)
) ENGINE=InnoDB;

-- -----------------------------------------------------------------------------
-- bills
-- -----------------------------------------------------------------------------
CREATE TABLE bills (
    id             BIGINT AUTO_INCREMENT PRIMARY KEY,
    patient_id     BIGINT NOT NULL,
    appointment_id BIGINT,
    room_id        BIGINT,
    bill_number    VARCHAR(50) NOT NULL UNIQUE,
    subtotal       DECIMAL(12,2) NOT NULL DEFAULT 0.00,
    tax_amount     DECIMAL(12,2) NOT NULL DEFAULT 0.00,
    discount_amount DECIMAL(12,2) NOT NULL DEFAULT 0.00,
    total_amount   DECIMAL(12,2) NOT NULL DEFAULT 0.00,
    status         ENUM('PENDING','PARTIALLY_PAID','PAID','CANCELLED') NOT NULL DEFAULT 'PENDING',
    due_date       DATE,
    created_by_user_id BIGINT,
    created_at     DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_bill_patient FOREIGN KEY (patient_id) REFERENCES patients(id),
    CONSTRAINT fk_bill_appointment FOREIGN KEY (appointment_id) REFERENCES appointments(id),
    CONSTRAINT fk_bill_room FOREIGN KEY (room_id) REFERENCES rooms(id),
    CONSTRAINT fk_bill_created_by FOREIGN KEY (created_by_user_id) REFERENCES users(id)
) ENGINE=InnoDB;

-- -----------------------------------------------------------------------------
-- bill_items (line items: consultation, medicine, lab test, room charge...)
-- -----------------------------------------------------------------------------
CREATE TABLE bill_items (
    id           BIGINT AUTO_INCREMENT PRIMARY KEY,
    bill_id      BIGINT NOT NULL,
    item_type    ENUM('CONSULTATION','MEDICINE','LAB_TEST','ROOM_CHARGE','PROCEDURE','OTHER') NOT NULL,
    description  VARCHAR(255) NOT NULL,
    quantity     INT NOT NULL DEFAULT 1,
    unit_price   DECIMAL(10,2) NOT NULL DEFAULT 0.00,
    line_total   DECIMAL(12,2) NOT NULL DEFAULT 0.00,
    CONSTRAINT fk_bill_items_bill FOREIGN KEY (bill_id) REFERENCES bills(id) ON DELETE CASCADE
) ENGINE=InnoDB;

-- -----------------------------------------------------------------------------
-- payments
-- -----------------------------------------------------------------------------
CREATE TABLE payments (
    id             BIGINT AUTO_INCREMENT PRIMARY KEY,
    bill_id        BIGINT NOT NULL,
    amount         DECIMAL(12,2) NOT NULL,
    payment_method ENUM('CASH','CARD','UPI','NET_BANKING','INSURANCE') NOT NULL,
    transaction_ref VARCHAR(150),
    status         ENUM('SUCCESS','FAILED','REFUNDED','PENDING') NOT NULL DEFAULT 'PENDING',
    paid_at        DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_payments_bill FOREIGN KEY (bill_id) REFERENCES bills(id)
) ENGINE=InnoDB;

-- -----------------------------------------------------------------------------
-- notifications
-- -----------------------------------------------------------------------------
CREATE TABLE notifications (
    id          BIGINT AUTO_INCREMENT PRIMARY KEY,
    user_id     BIGINT NOT NULL,
    title       VARCHAR(200) NOT NULL,
    message     VARCHAR(1000) NOT NULL,
    type        ENUM('APPOINTMENT','BILLING','LAB_REPORT','PRESCRIPTION','SYSTEM') NOT NULL DEFAULT 'SYSTEM',
    is_read     BOOLEAN NOT NULL DEFAULT FALSE,
    created_at  DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_notifications_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB;

CREATE INDEX idx_notifications_user ON notifications(user_id, is_read);

-- -----------------------------------------------------------------------------
-- audit_logs
-- -----------------------------------------------------------------------------
CREATE TABLE audit_logs (
    id           BIGINT AUTO_INCREMENT PRIMARY KEY,
    user_id      BIGINT,
    action       VARCHAR(100) NOT NULL,     -- e.g. CREATE_APPOINTMENT, LOGIN, DELETE_PATIENT
    entity_type  VARCHAR(100),
    entity_id    BIGINT,
    details      TEXT,
    ip_address   VARCHAR(50),
    created_at   DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_audit_logs_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL
) ENGINE=InnoDB;

CREATE INDEX idx_audit_logs_entity ON audit_logs(entity_type, entity_id);

SET FOREIGN_KEY_CHECKS = 1;

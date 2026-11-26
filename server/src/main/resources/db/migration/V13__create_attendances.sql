CREATE TABLE attendance (
    id BIGINT NOT NULL AUTO_INCREMENT,
    title VARCHAR(100) NOT NULL,
    date DATE NOT NULL,
    qr_token VARCHAR(43),
    qr_expires_at DATETIME(6),
    PRIMARY KEY (id),
    KEY idx_attendance_date (date, id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE attendance_participant (
    id BIGINT NOT NULL AUTO_INCREMENT,
    attendance_id BIGINT NOT NULL,
    user_id BIGINT NOT NULL,
    user_name VARCHAR(255) NOT NULL,
    status ENUM('PRESENT', 'ABSENT') NOT NULL DEFAULT 'ABSENT',
    checked_in_at DATETIME(6),
    note VARCHAR(500) NOT NULL DEFAULT '',
    PRIMARY KEY (id),
    CONSTRAINT uk_attendance_user UNIQUE (attendance_id, user_id),
    KEY idx_attendance_participant_user (user_id),
    CONSTRAINT fk_attendance_participant_attendance FOREIGN KEY (attendance_id) REFERENCES attendance (id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

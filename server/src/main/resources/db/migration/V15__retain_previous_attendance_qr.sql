ALTER TABLE attendance
    ADD COLUMN previous_qr_token VARCHAR(43),
    ADD COLUMN previous_qr_expires_at DATETIME(6);

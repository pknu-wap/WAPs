-- Historical attendance levels are unknown; keep NONE instead of guessing.
ALTER TABLE attendance_participant
    ADD membership_level ENUM('NONE', 'NEW', 'ASSOCIATE', 'REGULAR') NOT NULL DEFAULT 'NONE';

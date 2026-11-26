-- Preserve existing attendance records and permit administrator-assigned lateness.
ALTER TABLE attendance_participant
    MODIFY COLUMN status ENUM('PRESENT', 'ABSENT', 'LATE') NOT NULL DEFAULT 'ABSENT';

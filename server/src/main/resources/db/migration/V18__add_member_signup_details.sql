-- Preserve all existing accounts and their roles; only new Kakao accounts need signup.
ALTER TABLE `user`
    ADD COLUMN `student_number` VARCHAR(20) NULL,
    ADD COLUMN `signup_completed` BIT NOT NULL DEFAULT b'1';

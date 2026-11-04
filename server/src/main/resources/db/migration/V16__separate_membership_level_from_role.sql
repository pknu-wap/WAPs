-- ROLE_USER represented non-members; preserve their access as guests.
UPDATE `user` SET role = 'ROLE_GUEST' WHERE role = 'ROLE_USER' OR role IS NULL;
UPDATE ballot SET user_role = 'ROLE_GUEST' WHERE user_role = 'ROLE_USER';
ALTER TABLE `user` MODIFY role ENUM('ROLE_ADMIN', 'ROLE_MEMBER', 'ROLE_GUEST') NOT NULL DEFAULT 'ROLE_GUEST';
ALTER TABLE ballot MODIFY user_role ENUM('ROLE_ADMIN', 'ROLE_MEMBER', 'ROLE_GUEST') NOT NULL;
-- Existing roles do not identify membership levels. Administrators assign them explicitly.
ALTER TABLE `user` ADD membership_level ENUM('NONE', 'NEW', 'ASSOCIATE', 'REGULAR') NOT NULL DEFAULT 'NONE';

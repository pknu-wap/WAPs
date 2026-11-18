-- Membership classification is independent of authorization roles.
-- Existing users stay unclassified until an administrator assigns a type.
ALTER TABLE `user` ADD COLUMN member_type VARCHAR(20) NULL;

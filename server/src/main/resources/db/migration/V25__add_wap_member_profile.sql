-- Self-reported membership is separate from administrator-assigned privileges.
ALTER TABLE `user` ADD COLUMN wap_member BOOLEAN NULL;

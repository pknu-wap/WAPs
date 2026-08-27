ALTER TABLE `team`
    MODIFY `project_id` BIGINT NULL,
    MODIFY `leader_id` BIGINT NULL,
    ADD COLUMN `field` VARCHAR(16) NULL;
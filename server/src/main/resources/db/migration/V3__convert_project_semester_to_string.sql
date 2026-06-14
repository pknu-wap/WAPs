ALTER TABLE `project`
    ADD COLUMN `semester_text` varchar(7) DEFAULT NULL;

UPDATE `project`
SET `semester_text` = CONCAT(`project_year`, '-', LPAD(`semester`, 2, '0'))
WHERE `project_year` IS NOT NULL
  AND `semester` IS NOT NULL;

ALTER TABLE `project`
    DROP COLUMN `project_year`,
    DROP COLUMN `semester`;

ALTER TABLE `project`
    CHANGE COLUMN `semester_text` `semester` varchar(7) DEFAULT NULL;

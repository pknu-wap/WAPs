-- Existing name-only team members remain readable and must be selected again when edited.
ALTER TABLE team_member ADD COLUMN user_id BIGINT NULL;

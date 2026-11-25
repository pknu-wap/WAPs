-- 팀원 계정 매핑 롤백으로 더 이상 사용하지 않는 컬럼을 제거합니다.
ALTER TABLE team_member DROP COLUMN user_id;

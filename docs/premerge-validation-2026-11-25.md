# main 반영 전 검증 (2026-11-25)

검증 기준은 main `b666fff`에 현재 작업 내용을 합친 상태이다. 커밋·push·merge·배포는 수행하지 않았다.

## 통과 결과

- 프런트엔드 전체: 54개 suite, 480개 test 통과.
- 프런트엔드 production build 성공.
- 서버 전체: 46개 suite, 384개 test 통과. 실패·오류·skip 모두 0.
- 서버 bootJar 생성 성공.
- 별도 로컬 MySQL에서 Flyway 마이그레이션 및 Hibernate schema validate 통과.
- 실제 JWT와 보안 필터를 통과한 가입 정보 수정·조회, 권한 유지, 미인증 401 및 권한 부족 403 검증 통과.
- 지각 저장·집계·재조회 및 QR 재출석 시 지각 유지 검증 통과.
- main의 V23과 충돌하지 않도록 신규 마이그레이션을 V24, V25로 배치하고 JAR 포함 여부 확인.
- git diff --check 통과.

## 실행 증거

- `server/build/premerge-client-tests.log`
- `server/build/premerge-client-build.log`
- `server/build/premerge-server-mysql.log`
- `server/build/test-results/test/TEST-*.xml`

검증 DB는 127.0.0.1:33087에만 실행한 별도 임시 MySQL이다. 실제 dev/운영 DB는 변경하지 않았으며 테스트 후 임시 MySQL을 종료했다.

## 배포 조건 및 남은 실환경 확인

서버와 V24·V25 마이그레이션을 먼저 반영하고 프런트엔드를 반영한다. 실제 카카오 인증 왕복 및 실물 휴대폰 카메라 QR 스캔은 dev 배포 후 확인해야 한다. 자동 테스트 통과가 외부 인증 설정과 기기별 동작까지 보장하지는 않는다.

브라우저 추가 확인 중 기존 개발 서버가 새 컴포넌트를 찾지 못하는 상태를 발견해 재시작했다. 재시작 후 컴파일 오류 없이 로컬 출석 예시 화면이 열리고, 출석 버튼 → 완료 모달 → 확인 버튼 자동 포커스 → 확인 후 ProjectPage 이동을 확인했다. 이 예시 화면은 실제 출석 저장이나 카카오 인증을 수행하지 않는다.

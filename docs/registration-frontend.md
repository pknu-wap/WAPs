# 카카오 로그인 및 회원가입 화면 연동

## 화면 동작

- 로그인 후 GET /user/me 및 GET /user/role로 계정과 권한을 조회한다.
- registrationRequired=true 또는 signupCompleted=false이면 /signup으로 이동한다.
- 가입 완료 계정은 프로젝트 목록으로 이동한다.
- WAP 회원은 본명 최대 4자와 입학 연도 뒤 두 자리 학번을 입력한다.
- 4자리 연도 또는 9자리 학번을 붙여 넣으면 입학 연도 뒤 두 자리로 변환한다.
- 비회원은 이름과 학번 없이 가입한다.
- /signup?edit=true에서는 기존 정보를 채우고 저장 후 설정으로 돌아간다.
- 가입 정보 수정 화면을 닫아도 로그인 상태를 유지한다.
- 조회/저장 실패 시 오류를 표시하며 저장 실패 후 입력을 유지한다.

## 현재 화면이 요구하는 API

- GET /user/me: userName, registrationRequired 또는 signupCompleted, wapMember, studentId 또는 studentNumber.
- POST /user/registration: { wapMember, name?, studentId? }.
- PATCH /user/registration: 동일한 형식으로 가입 정보를 수정한다.
- 저장 응답은 registrationRequired=false 또는 signupCompleted=true를 포함해야 한다.
- 기존 이름 변경 API PATCH /api/member/name을 유지한다.

## main과의 연동 조건

- main의 POST /user/signup은 member, 9자리 studentNumber, memberType을 요구하므로 현재 화면의 저장 규격과 다르다.
- 가입 상태 읽기 호환만으로 저장까지 호환되는 것은 아니다. 가입/정보 수정 API와 입력 정책을 함께 맞춰야 한다.
- 서버 및 DB 작업은 codex/member-type-management 브랜치에 보존하며 이 PR에는 프론트엔드와 연동 문서만 포함한다.
- 설정의 정보 수정 진입 버튼은 설정 PR #710 작업과 함께 사용한다.

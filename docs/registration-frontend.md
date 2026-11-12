# 카카오 로그인 및 회원가입 화면 연동

## 화면 동작

- 카카오 로그인 후 GET /user/me와 GET /user/role로 사용자 정보를 조회한다.
- registrationRequired가 true이면 /signup, 그렇지 않으면 /ProjectPage로 이동한다.
- /signup은 로그인 토큰과 가입 필요 상태를 다시 확인한다.
- WAP 회원이면 본명과 숫자 9자리 학번을 입력한다.
- 비회원이면 이름과 학번 없이 { wapMember: false }를 보낸다.
- 회원 요청은 { wapMember: true, name, studentId }다.
- POST /user/registration 응답에서 registrationRequired가 false여야 완료 처리한다.
- 성공 응답의 userName을 저장하고 프로젝트 목록으로 이동한다.
- 가입 화면을 닫으면 WAPs 로그인 정보를 지우고 프로젝트 목록으로 이동한다.
- 개발용 미리보기와 카카오 로그인 라디오 버튼은 제공하지 않는다.

## 필요한 백엔드 연동

GET /user/me에 boolean registrationRequired가 필요하다.
신규 카카오 사용자는 true, 가입 완료 후에는 false로 저장되어야 한다.
POST /user/registration은 가입 정보를 저장하고 userName과
registrationRequired: false를 포함한 사용자 정보를 반환해야 한다.

현재 main의 서버에는 이 가입 상태 필드와 저장 API가 없다.
필드가 없으면 콜백은 프로젝트 목록으로 이동하므로 신규 가입 화면을 볼 수 없다.
프론트엔드 단독 배포로 실제 회원가입을 완료할 수 없으며,
백엔드 담당자가 API를 반영한 뒤 실계정 가입을 검증해야 한다.
백엔드와 DB 마이그레이션은 이 작업에 포함하지 않는다.

# 카카오 로그인 및 회원가입 화면 연동

## 화면 동작

- 콜백은 공통 API 클라이언트로 GET /user/me 및 GET /user/role을 조회한다. 개발 세션을 먼저 정리하고 새 토큰을 사용한다.
- signupCompleted=false이면 /signup으로, true이면 프로젝트 목록으로 이동한다. 구형 registrationRequired도 지원하지만 실제 서버의 signupCompleted를 우선한다.
- 가입 상태가 없으면 완료로 추정하지 않고 가입 화면에서 재시도 또는 닫기를 제공한다. 권한 조회의 일시적 실패만으로 정상 로그인을 취소하지 않는다.
- WAP 회원은 본명 최대 4자, 입학 연도 뒤 두 자리 학번, 회원 구분(신입/준회원/정회원)을 입력한다. 4자리 연도 또는 9자리 학번 붙여넣기는 연도 뒤 두 자리로 변환한다. 그 외 길이는 잘라 저장하지 않고 안내한다.
- 비회원은 이름·학번·회원 구분 없이 가입한다.
- 저장 실패 시 입력값을 유지한다. 중복 제출을 방지하고 409 응답은 현재 가입 상태를 재조회하여 이미 완료한 경우 정상 진행한다.
- 가입 후 이름과 권한을 갱신한다. 권한 조회 실패 시 오래된 권한을 제거하고 완료된 가입을 다시 제출하지 않는다.
- 기존 회원의 /signup?edit=true 링크는 설정으로 돌아간다. 서버는 최초 가입 후 회원 구분/학번 수정 API를 제공하지 않는다. 이름 변경은 기존 설정의 PATCH /api/member/name을 사용한다.
- 로그인 및 가입 화면은 전체 화면 레이아웃을 사용하며 /select/role은 /signup으로 연결된다. 개발용 미리보기와 로그인 공급자 라디오 버튼은 제공하지 않는다.

## 실제 서버 계약

- GET /user/me: userName, signupCompleted, studentNumber, memberType, membershipLevel 등.
- POST /user/signup: 회원은 { member:true, name, studentNumber, memberType }, 비회원은 { member:false }.
- 응답의 signupCompleted=true를 확인한 후 프로젝트 목록으로 이동한다. 서버 DTO는 studentNumber에 1~20자리 숫자 문자열을 허용한다. 화면은 이 브랜치의 두 자리 입력 정책을 유지하며 서버 문서에 남아 있던 9자리 제한과 구분한다.
- GET /user/role: 현재 role. 회원 구분은 서버가 지정한 NEW, ASSOCIATE, REGULAR 중 선택한다.
- 존재하지 않는 POST/PATCH /user/registration은 호출하지 않는다.

## 검증 범위

RegistrationFlow/Callback 테스트는 신규·기존 계정 분기, StrictMode 중복 요청 방지, API 필드, 실패/재시도, 401, 중복 제출/409, 가입 상태 누락, 입력 검증과 붙여넣기를 확인한다. API 단위 테스트는 실제 경로를 검증한다. 실제 카카오 신규 계정으로 로그인·가입하는 배포 환경 검증은 별도로 필요하다.

# 회원 구분 관리

접근 권한(`role`)과 회원 구분(`memberType`)은 별도 값이다.
회원 구분 변경으로 관리자 권한이나 서비스 접근 권한은 바뀌지 않는다.

ROLE 선택지는 `ROLE_GUEST`(게스트), `ROLE_MEMBER`(회원), `ROLE_ADMIN`(임원)이다.
기존 `ROLE_USER` 데이터와 기존 권한 변경 API는 호환성을 위해 유지하지만 새 통합 변경의 선택지로 허용하지 않는다.

| API 값 | 화면 표시 |
| --- | --- |
| NEW | 신입 |
| ASSOCIATE | 준회원 |
| REGULAR | 정회원 |
| UNDECIDED | 미정 |
| null (기존 데이터) | 미정 |

기존 사용자에게 회원 구분을 임의로 지정하지 않는다.

## API

- `GET /admin/role`: 기존 목록 응답의 각 사용자에 `memberType` 추가. `role`과 `memberType` 필터를 함께 적용한 뒤 페이지를 나눈다.
- `memberType=UNDECIDED` 필터는 명시적인 `UNDECIDED`와 기존 `null` 사용자를 모두 포함한다.
- `PATCH /admin/role/attributes`: 관리자 전용 단일 적용 API
  - 요청: `{ "userIds": [1, 2], "role": "ROLE_MEMBER", "memberType": "REGULAR" }`
  - `role`, `memberType` 중 하나 이상을 지정한다. 생략하거나 null로 보낸 속성은 기존 값을 유지한다.
  - LEVEL을 미정으로 바꾸려면 `memberType: "UNDECIDED"`를 명시한다.
  - 응답: 변경된 사용자 배열 (`id`, `name`, `email`, `role`, `memberType`)
  - 빈 목록, null/0/음수 ID, 잘못된 ROLE, 변경 값 없는 요청은 거부한다.
  - 한 명이라도 존재하지 않으면 전체 변경을 거부한다. ROLE과 LEVEL을 하나의 트랜잭션에서 함께 저장한다.
- `PATCH /admin/role/user`: 기존 ROLE 변경 API 유지. LEVEL과 독립적으로 적용한다.
- `PATCH /admin/role/member-type`: 관리자만 호출 가능
  - 요청: `{ "memberType": "REGULAR", "userIds": [1, 2] }`
  - 응답: 변경된 사용자 배열 (`id`, `name`, `email`, `role`, `memberType`)
  - 누락된 구분, 빈 목록, 잘못된 ID는 거부한다. 존재하지 않는 사용자 포함 시 전체 변경을 거부한다.
- `GET /user/me`: 기존 응답에 한글 `memberType` 추가 (설정 화면 표시용)

## LEVEL 목록 필터 호환

- 기존 main 서버는 `membershipLevel`과 미정 값 `NONE`을 사용하고, 이 작업의 서버는 `memberType`과 `UNDECIDED`를 사용한다.
- 사용자 목록 조회는 두 필터 이름을 함께 전송하여 각 서버가 지원하는 필터를 페이지 분할 전에 적용하도록 한다. ALL 선택 시에는 두 값 모두 생략한다.
- 목록 응답의 `membershipLevel`도 화면에서 사용하는 `memberType`으로 변환한다. `NONE`과 누락된 값은 미정으로 표시하고, `memberType` 값이 있으면 우선한다.
- 이 호환 처리는 목록 조회와 LEVEL 표시에만 적용한다. 권한/LEVEL 통합 저장 API는 아래 배포 조건대로 별도 서버 반영이 필요하다.

## 배포 및 확인

백엔드에 V16 마이그레이션과 새 API를 먼저 배포한 다음 프론트엔드를 배포한다.
프론트엔드만 실행하거나 배포하면 기존 테스트 서버에는 저장되지 않는다.

목록 행으로 사용자를 선택하고 변경할 ROLE 또는 LEVEL을 고른 뒤 적용한다.
목록은 NAME / EMAIL / ROLE / LEVEL 열을 표시한다. ROLE / LEVEL 필터와
각각의 선택 드롭다운을 제공한다. 적용 버튼은 LEVEL 아래 하나만 둔다.
ROLE만, LEVEL만, 또는 둘 다 선택하여 한 번에 적용할 수 있다.
행 클릭 또는 키보드 Enter/Space로 사용자를 선택한다.
서버가 반환한 값으로 양쪽 목록을 갱신하며 선택은 유지된다.
실패 시 이전 값과 선택을 보존한다. 페이지를 다시 열어도 저장값이 유지되는지,
해당 사용자 설정 페이지에 같은 구분이 표시되는지 통합 검증이 필요하다.

## 전체 선택 및 계정 삭제

- 전체 선택/해제는 현재 페이지에 표시된 사용자에게 적용한다. 다른 페이지에서 선택한 사용자는 유지한다.
- `DELETE /admin/role/users`: 관리자 전용. 요청은 `{ "userIds": [1, 2] }`, 성공 응답은 204이다.
- 확인창에서 동의한 뒤 계정 자체를 삭제한다. 실패하면 선택을 유지하고, 성공하면 선택을 비우고 첫 페이지를 다시 조회한다.
- 자기 계정, 존재하지 않는 계정, 프로젝트 소유 계정이 포함되면 전체 요청을 거부한다. 프로젝트 소유권은 먼저 정리해야 한다.
- 삭제는 하나의 트랜잭션으로 계정과 로그인 토큰, 댓글, 투표, 출석, 지원·모집·팀 배정 기록을 정리한다. 공유 프로젝트는 삭제하지 않는다.

## 가입 정보 수정

- 설정의 `회원가입 정보 수정` 버튼은 `/signup?edit=true`로 이동한다.
- `GET /user/me`의 `wapMember`, `studentId`, `userName`으로 기존 값을 채운다.
- 최초 가입은 `POST /user/registration`, 재수정은 `PATCH /user/registration`을 사용한다.
- 학번은 숫자 두 자리만 저장하며, 회원 여부를 비회원으로 수정하면 저장된 학번을 지운다.
- 저장 후 설정으로 돌아간다. 수정 화면을 닫아도 로그인은 유지된다. 자기 가입 정보를 수정해도 ROLE/LEVEL은 바뀌지 않는다.

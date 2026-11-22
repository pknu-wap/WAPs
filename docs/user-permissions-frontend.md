# 사용자 권한 및 LEVEL 화면 연동

## 화면 동작

- 사용자 행을 클릭하거나 Enter/Space로 선택한다.
- 현재 페이지 전체 선택/해제를 지원하며 다른 페이지에서 선택한 사용자는 유지한다.
- ROLE과 LEVEL을 각각 선택한 뒤 하나의 적용 버튼으로 저장한다.
- ROLE만, LEVEL만 또는 두 값을 함께 변경할 수 있으며 실패 시 선택과 입력을 유지한다.
- 조회 실패는 빈 목록과 구분하여 표시하고 같은 필터로 다시 불러올 수 있다.
- 선택한 사용자 목록에서도 Enter/Space로 선택을 해제할 수 있다.
- 필터가 적용된 목록에서 변경 후에는 첫 페이지부터 다시 조회한다.
- 계정 삭제는 확인창을 거치며 성공 후 선택을 비우고 목록을 다시 조회한다.

## 목록 조회 호환

- GET /admin/role에 role과 함께 memberType 및 membershipLevel 필터를 전달한다.
- UNDECIDED는 기존 서버에 membershipLevel=NONE으로 전달한다.
- 응답의 membershipLevel을 화면의 memberType으로 변환하되 memberType 값이 있으면 우선한다.
- ALL 선택 시 두 LEVEL 필터를 생략한다. 서버에서 필터링한 다음 페이지를 분할한다.
- 기존 updateMembershipLevel 함수와 개별 LEVEL 변경 API는 유지한다.

## 저장 및 삭제 API 계약

- PATCH /admin/role/attributes: { userIds, role?, memberType? }. 변경된 사용자 배열이 필요하다.
- 저장 응답의 membershipLevel/NONE도 memberType/UNDECIDED로 정규화한다.
- HTTP 성공 후 응답이 누락되거나 요청 대상·변경값과 다르면 저장 실패로 단정하지 않는다. 확인 안내를 표시하고 선택과 변경 입력을 비운 후 첫 페이지를 재조회한다. 재조회 실패 시 별도 오류와 재시도 버튼을 표시한다.
- DELETE /admin/role/users: { userIds }. 계정 삭제 성공 시 204를 반환해야 한다.
- 현재 main의 개별 ROLE/LEVEL 변경 API만으로 통합 저장과 계정 삭제가 제공되는 것은 아니다.
- 서버 API 및 DB 변경, 실제 저장/재조회 검증 후 통합해야 한다.
- 서버 작업은 codex/member-type-management 브랜치에 보존하며 이 PR에는 프론트엔드와 문서만 포함한다.

## 2026-11-22 자체 리뷰

- 최신 main을 충돌 없이 병합했다. 현재 AdminUserController는 개별 ROLE/LEVEL 변경만 제공하며 통합 저장 및 계정 삭제 경로는 여전히 없다.
- 저장 성공 응답을 실패로 오인하는 문제, 기존 LEVEL 응답 필드 미변환, 조회 실패 시 재시도 누락을 수정하고 회귀 테스트를 추가했다.
- 선택 목록의 키보드 해제를 추가하고 중복 CSS 및 좁은 화면의 필터 폭을 정리했다.
- 페이지와 필터 사이의 선택 유지는 의도된 동작이다. 오른쪽 선택 목록에서 전체 변경 대상을 확인하고 해제할 수 있다.
- 백엔드 계약 확정과 실제 개발 서버 저장·삭제·재조회 검증은 미완료다. 프론트엔드 테스트는 실제 API 연동 검증을 대체하지 않는다. 연동 완료 전 병합·배포하지 않는다.

# 사용자 권한 및 LEVEL 화면 연동

## 화면 동작

- 사용자 행을 클릭하거나 Enter/Space로 선택한다.
- ROLE과 LEVEL을 각각 선택하고 LEVEL 아래의 적용 버튼으로 한 번에 저장한다.
- 선택하지 않은 속성은 요청에서 생략하여 기존 값을 유지한다.
- 서버 응답의 사용자 ID와 변경 값을 확인한 뒤 양쪽 목록에 반영한다.
- 실패하면 선택한 사용자와 변경 전 값, 입력 중인 선택을 유지한다.
- LEVEL 미정은 UNDECIDED이며, null도 미정으로 표시한다.

## 필요한 API 계약 (백엔드 협의 필요)

- GET /admin/role: role, memberType 필터와 page, size를 받는다.
- 목록의 각 사용자는 id, name, email, role, memberType을 반환한다.
- PATCH /admin/role/attributes: { userIds, role?, memberType? }를 받는다.
- 응답은 변경된 사용자 배열이며 요청한 ID와 변경 값을 모두 포함한다.
- role은 ROLE_GUEST, ROLE_MEMBER, ROLE_ADMIN을 사용한다.
- memberType은 UNDECIDED, NEW, ASSOCIATE, REGULAR를 사용한다.
- 두 값을 함께 변경할 때 서버가 하나의 트랜잭션으로 적용해야 한다.

## 현재 main과의 차이 및 배포 조건

현재 main은 membershipLevel 필드와 NONE 값을 사용하며,
PATCH /admin/role/user/membership-level로 LEVEL을 별도로 변경한다.
이 화면이 사용하는 memberType 필드와 통합 변경 API는 현재 main에 없다.
따라서 프론트 코드만 병합/배포하면 LEVEL 필터와 통합 저장을 사용할 수 없다.
백엔드 담당자와 계약을 확정하고 서버 배포 후 실제 API로 검증해야 한다.
백엔드 및 DB 변경은 이 프론트 작업에 포함하지 않는다.

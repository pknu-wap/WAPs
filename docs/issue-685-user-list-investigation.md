# 관리자 사용자 목록 누락 조사 (#685)

대상: [이슈 #685](https://github.com/pknu-wap/WAPs/issues/685), 제보 커밋 `b778232c7606f55dc58ba6ed61736b43be9f0065`.
현재 코드 비교 기준: `4638993`.

## 확인된 누락 경로와 현재 상태

- 당시 `UserRepository.findUserByOffset`은 `ORDER BY u.name`만 사용했다. 동명이인이 있으면 페이지 사이 순서가 보장되지 않아 중복·누락이 가능했다. 현재는 `u.name, u.id`로 정렬한다. 이는 페이지 조회 중 데이터가 바뀌지 않는 조건에서 순서를 보장한다.
- 당시 `ManagePermissionPage`는 필터를 바꿔도 이전 요청 결과를 그대로 적용했다. ADMIN 응답 이후 도착한 ALL 응답이 목록을 덮거나, 이전 요청 실패가 현재 목록을 비울 수 있었다. 현재는 요청 ID와 effect 정리 상태로 이전 응답을 무시한다.
- 현재 서버는 ROLE/LEVEL 조건을 적용한 뒤 페이지를 나누며, `size + 1`개를 조회해 `hasNext`를 계산한다. 특정 ADMIN 계정을 제외하는 조건은 확인되지 않았다.

서버 정렬은 `e282037`, 클라이언트 이전 응답 차단은 `8f052cb`에서 이미 반영되어 있어 이번 변경은 회귀 테스트를 보강한다. 제보 계정의 당시 DB 상태와 API 응답 기록이 없으므로 두 경로 중 어느 것이 실제 제보 원인인지는 확정하지 않는다.

## 회귀 검증

- 클라이언트: ALL 요청을 보류한 뒤 ADMIN 목록을 표시하고, 이전 요청을 성공/실패시켜도 현재 목록과 페이지 상태가 유지되는지 검증한다.
- 검증력을 확인하기 위해 이전 응답 차단 조건을 일시 제거했을 때 새 테스트 두 개가 모두 실패했다. 검증 후 원본을 복원했다.
- 서버: H2에 동명이인 29명을 넣고 전체/ADMIN/ADMIN+정회원/빈 필터 결과를 페이지 크기 1, 5, 12로 끝까지 조회한다. 예상 ID 순서, 누락·중복, `hasNext`, 마지막 페이지 이후 빈 응답을 검증한다.
- H2 검증은 운영 MySQL 데이터 및 실행 계획에 대한 검증을 대신하지 않는다.

실행 명령:

```powershell
# client
$env:CI='true'
npm test -- --watchAll=false --runInBand --runTestsByPath src/pages/adminPages/ManagePermissionPage.test.js
# server (JDK 17)
.\gradlew.bat test --tests wap.web2.server.admin.service.UserManagementIntegrationTest --console=plain
```

## 운영 환경에서 남은 확인

1. 실제 배포된 클라이언트/서버가 위 방어를 포함하는 커밋인지 확인한다.
2. ROLE_ADMIN, LEVEL 전체 조건에서 처음부터 마지막 페이지까지 API 응답에 대상 사용자 ID가 포함되는지 확인한다.
3. API에도 없으면 해당 환경 DB의 계정 ID/ROLE/LEVEL과 요청 필터를 대조한다. API에는 있고 화면에 없으면 네트워크 응답 순서 및 표시한 페이지를 확인한다.
4. 개인정보를 공개 이슈에 올리지 않고 검증 결과만 기록한다. 제보 계정의 정상 노출을 확인하기 전에는 이슈를 자동 종료하지 않는다.

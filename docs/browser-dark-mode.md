# 브라우저 다크 모드 색상

WAPs는 자체 다크 테마를 사용한다. 일부 기기의 브라우저 다크 모드에서 상단 그래디언트 색상이 과도하게 변하고, 해당 설정을 끄면 복원되는 현상을 사용자가 확인했다.

HTML의 `color-scheme: dark` 메타 선언은 CSS 로딩 전부터 지원 테마를 알린다. CSS 루트의 `color-scheme: dark; color-scheme: only dark;`는 다크 기본 컨트롤을 사용하고 추가 색상 변환을 하지 않도록 요청한다. `only`를 지원하지 않는 브라우저도 앞의 `dark` 선언을 사용할 수 있다. 그래디언트나 이미지 색상 자체는 변경하지 않는다.

## 실기기 확인

1. 변경 버전에서 프로젝트 목록을 열고 브라우저의 웹페이지 다크 모드를 켰다 끄며 새로고침한다.
2. 상단 배경, 검색 입력창, 필터, 썸네일의 색상과 글자 대비를 비교한다.
3. 데스크톱에서도 검색 입력, 선택 목록, 날짜 입력 등의 기본 컨트롤을 확인한다. 색상 체계 선언은 브라우저 기본 컨트롤과 스크롤바에도 영향을 준다.
4. 여전히 변색되면 기기·브라우저 버전과 강제 다크 모드 설정을 기록한다. 사이트 선언을 무시하는 강제 모드는 웹 코드만으로 차단을 보장할 수 없다.

뷰포트 크기 변경이나 prefers-color-scheme 에뮬레이션만으로 모바일 브라우저의 강제 색상 변환을 검증했다고 간주하지 않는다. 실제 문제 기기에서의 수정 후 검증은 별도로 필요하다.

## 참고

- [Samsung Internet의 색상 변환 및 color-scheme 지원](https://developer.samsung.com/browser/blog/en/2020/12/15/dark-mode-in-samsung-internet)
- [Chrome Auto Dark Theme](https://developer.chrome.com/blog/auto-dark-theme)
- [CSS Color Adjustment: color-scheme](https://www.w3.org/TR/css-color-adjust-1/#color-scheme-prop)

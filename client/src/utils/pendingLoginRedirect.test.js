import {
  clearPendingLoginRedirect,
  consumePendingLoginRedirect,
  savePendingAttendance,
  saveVoteRedirect,
} from "./pendingLoginRedirect";

beforeEach(() => sessionStorage.clear());

test("가장 최근에 시작한 로그인 목적지만 한 번 복원한다", () => {
  savePendingAttendance("?attendanceId=4&token=a%2Bb%26c");
  saveVoteRedirect();
  expect(consumePendingLoginRedirect()).toBe("/vote");
  expect(consumePendingLoginRedirect()).toBe("/ProjectPage");
  saveVoteRedirect();
  savePendingAttendance("?attendanceId=4&token=a%2Bb%26c");
  expect(consumePendingLoginRedirect()).toBe("/attendance?attendanceId=4&token=a%2Bb%26c");
});

test("취소와 잘못된 출석 링크는 이전 목적지를 남기지 않는다", () => {
  saveVoteRedirect();
  clearPendingLoginRedirect();
  expect(consumePendingLoginRedirect()).toBe("/ProjectPage");
  saveVoteRedirect();
  savePendingAttendance("?attendanceId=0&token=bad");
  expect(consumePendingLoginRedirect()).toBe("/ProjectPage");
});

test.each(["https://example.com", "//example.com", "/admin", "/vote/../admin"])(
  "허용하지 않은 목적지 %s는 복원하지 않는다",
  (destination) => {
    sessionStorage.setItem("waps.pendingLoginRedirect", destination);
    expect(consumePendingLoginRedirect()).toBe("/ProjectPage");
    expect(sessionStorage.length).toBe(0);
  },
);

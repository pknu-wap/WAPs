import React from "react";
import {
  act,
  fireEvent,
  render,
  screen,
  waitFor,
} from "@testing-library/react";
import "@testing-library/jest-dom";
import AttendanceQr from "./AttendanceQr";
import { adminAttendanceApi } from "../../api/admin";

jest.mock("../../api/admin", () => ({
  adminAttendanceApi: { getDetail: jest.fn(), issueQr: jest.fn() },
}));

jest.mock("qrcode.react", () => ({
  QRCodeSVG: ({ value }) => (
    <svg data-testid="attendance-qr" data-value={value} />
  ),
}));

beforeEach(() => {
  jest.clearAllMocks();
  adminAttendanceApi.getDetail.mockResolvedValue({
    attendanceId: 4,
    status: "ONGOING",
  });
  adminAttendanceApi.issueQr.mockImplementation(() =>
    Promise.resolve({
      attendanceId: 4,
      qrToken: "test-attendance-token",
      expiresAt: new Date(Date.now() + 60000).toISOString(),
    }),
  );
});

afterEach(() => jest.useRealTimers());

test("실제 서버 ID가 없는 로컬 출석은 발급하지 않는다", () => {
  render(<AttendanceQr closed={false} />);
  expect(screen.getByRole("button", { name: "QR 생성" })).toBeDisabled();
  expect(screen.getByText(/출석 생성·목록 API 연동/)).toBeInTheDocument();
  expect(adminAttendanceApi.getDetail).not.toHaveBeenCalled();
  expect(adminAttendanceApi.issueQr).not.toHaveBeenCalled();
});

test("사전 상세 조회 없이 실제 ID로 발급하고 응답의 두 필드만 인코딩한다", async () => {
  render(<AttendanceQr attendanceId={4} closed={false} />);
  fireEvent.click(screen.getByRole("button", { name: "QR 생성" }));
  const qr = await screen.findByTestId("attendance-qr");
  expect(adminAttendanceApi.getDetail).not.toHaveBeenCalled();
  expect(adminAttendanceApi.issueQr).toHaveBeenCalledWith(4);
  expect(JSON.parse(qr.getAttribute("data-value"))).toEqual({
    attendanceId: 4,
    qrToken: "test-attendance-token",
  });
  expect(screen.getByRole("timer")).toHaveTextContent("남은 시간: 60초");
  fireEvent.click(screen.getByRole("button", { name: "QR 재발급" }));
  await waitFor(() =>
    expect(adminAttendanceApi.issueQr).toHaveBeenCalledTimes(2),
  );
});

test("발급 중 중복 클릭을 막는다", async () => {
  let finish;
  adminAttendanceApi.issueQr.mockReturnValue(
    new Promise((resolve) => {
      finish = resolve;
    }),
  );
  render(<AttendanceQr attendanceId={4} closed={false} />);
  fireEvent.click(screen.getByRole("button", { name: "QR 생성" }));
  const button = screen.getByRole("button", { name: "QR 발급 중…" });
  expect(button).toBeDisabled();
  fireEvent.click(button);
  expect(adminAttendanceApi.issueQr).toHaveBeenCalledTimes(1);
  await act(async () =>
    finish({
      attendanceId: 4,
      qrToken: "test-token",
      expiresAt: new Date(Date.now() + 60000).toISOString(),
    }),
  );
  expect(adminAttendanceApi.issueQr).toHaveBeenCalledTimes(1);
});

test("expiresAt이 지나면 QR을 숨기고 재발급할 수 있다", async () => {
  jest.useFakeTimers();
  render(<AttendanceQr attendanceId={4} closed={false} />);
  await act(async () =>
    fireEvent.click(screen.getByRole("button", { name: "QR 생성" })),
  );
  expect(screen.getByTestId("attendance-qr")).toBeInTheDocument();
  act(() => jest.advanceTimersByTime(60000));
  expect(screen.queryByTestId("attendance-qr")).not.toBeInTheDocument();
  expect(screen.getByRole("status")).toHaveTextContent("만료");
  expect(screen.getByRole("button", { name: "QR 재발급" })).toBeEnabled();
});

test("서버가 409를 반환하면 오류를 표시한다", async () => {
  adminAttendanceApi.issueQr.mockRejectedValue({ response: { status: 409 } });
  render(<AttendanceQr attendanceId={4} closed={false} />);
  fireEvent.click(screen.getByRole("button", { name: "QR 생성" }));
  expect(await screen.findByRole("alert")).toHaveTextContent(
    "진행 중인 출석체크",
  );
  expect(screen.queryByTestId("attendance-qr")).not.toBeInTheDocument();
});

test("선택을 변경하면 이전 요청 결과가 새 출석에 표시되지 않는다", async () => {
  let finish;
  adminAttendanceApi.issueQr.mockReturnValue(
    new Promise((resolve) => {
      finish = resolve;
    }),
  );
  const { rerender } = render(
    <AttendanceQr key="first" attendanceId={4} closed={false} />,
  );
  fireEvent.click(screen.getByRole("button", { name: "QR 생성" }));
  await waitFor(() => expect(adminAttendanceApi.issueQr).toHaveBeenCalled());
  rerender(<AttendanceQr key="second" attendanceId={5} closed={false} />);
  await act(async () =>
    finish({
      attendanceId: 4,
      qrToken: "old-test-token",
      expiresAt: new Date(Date.now() + 60000).toISOString(),
    }),
  );
  expect(screen.queryByTestId("attendance-qr")).not.toBeInTheDocument();
});

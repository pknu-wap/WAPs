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

test("사전 상세 조회 없이 실제 ID로 발급하고 출석 링크를 인코딩한다", async () => {
  render(<AttendanceQr attendanceId={4} closed={false} />);
  fireEvent.click(screen.getByRole("button", { name: "QR 생성" }));
  const qr = await screen.findByTestId("attendance-qr");
  expect(adminAttendanceApi.getDetail).not.toHaveBeenCalled();
  expect(adminAttendanceApi.issueQr).toHaveBeenCalledWith(4);
  const url = new URL(qr.getAttribute("data-value"));
  expect(url.origin).toBe(window.location.origin);
  expect(url.pathname).toBe("/attendance");
  expect(url.searchParams.get("attendanceId")).toBe("4");
  expect(url.searchParams.get("token")).toBe("test-attendance-token");
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

test("서버 유효기간이 120초여도 60초마다 새 토큰을 발급한다", async () => {
  jest.useFakeTimers();
  let sequence = 0;
  adminAttendanceApi.issueQr.mockImplementation(async () => ({
    attendanceId: 4,
    qrToken: `token-${++sequence}`,
    expiresAt: new Date(Date.now() + 120000).toISOString(),
  }));
  render(<AttendanceQr attendanceId={4} closed={false} />);
  await act(async () =>
    fireEvent.click(screen.getByRole("button", { name: "QR 생성" })),
  );
  await act(async () => jest.advanceTimersByTime(59000));
  expect(adminAttendanceApi.issueQr).toHaveBeenCalledTimes(1);
  expect(screen.getByRole("timer")).toHaveTextContent("1초");
  await act(async () => jest.advanceTimersByTime(1000));
  expect(adminAttendanceApi.issueQr).toHaveBeenCalledTimes(2);
  expect(screen.getByTestId("attendance-qr")).toHaveAttribute(
    "data-value",
    expect.stringContaining("token-2"),
  );
  await act(async () => jest.advanceTimersByTime(60000));
  expect(adminAttendanceApi.issueQr).toHaveBeenCalledTimes(3);
});

test("자동 갱신 실패 시 QR을 숨기고 요청 반복 없이 재시도할 수 있다", async () => {
  jest.useFakeTimers();
  render(<AttendanceQr attendanceId={4} closed={false} />);
  await act(async () =>
    fireEvent.click(screen.getByRole("button", { name: "QR 생성" })),
  );
  adminAttendanceApi.issueQr.mockRejectedValueOnce(new Error("offline"));
  await act(async () => jest.advanceTimersByTime(60000));
  expect(screen.queryByTestId("attendance-qr")).not.toBeInTheDocument();
  expect(screen.getByRole("alert")).toHaveTextContent(
    "QR을 발급하지 못했습니다",
  );
  await act(async () => jest.advanceTimersByTime(60000));
  expect(adminAttendanceApi.issueQr).toHaveBeenCalledTimes(2);
  await act(async () =>
    fireEvent.click(screen.getByRole("button", { name: "QR 재발급" })),
  );
  expect(screen.getByTestId("attendance-qr")).toBeInTheDocument();
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

beforeAll(() => {
  HTMLDialogElement.prototype.showModal = function () {
    this.setAttribute("open", "");
  };
  HTMLDialogElement.prototype.close = function () {
    this.removeAttribute("open");
  };
});

test.each(["닫기", "Escape", "배경"])(
  "%s로 모달을 닫으면 자동 갱신을 중단한다",
  async (method) => {
    jest.useFakeTimers();
    render(<AttendanceQr attendanceId={4} closed={false} />);
    const trigger = screen.getByRole("button", { name: "QR 생성" });
    trigger.focus();
    await act(async () => fireEvent.click(trigger));
    expect(
      screen.getByRole("dialog", { name: "출석체크 QR" }),
    ).toBeInTheDocument();
    expect(document.body.style.overflow).toBe("hidden");
    if (method === "닫기")
      fireEvent.click(screen.getByRole("button", { name: "QR 모달 닫기" }));
    else if (method === "Escape")
      fireEvent(
        screen.getByRole("dialog"),
        new Event("cancel", { bubbles: true, cancelable: true }),
      );
    else fireEvent.click(screen.getByRole("dialog"));
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    expect(document.body.style.overflow).toBe("");
    expect(trigger).toHaveFocus();
    await act(async () => jest.advanceTimersByTime(120000));
    expect(adminAttendanceApi.issueQr).toHaveBeenCalledTimes(1);
  },
);

test("발급 중 닫았다 다시 열어도 이전 응답이 새 QR을 덮어쓰지 않는다", async () => {
  let finish;
  adminAttendanceApi.issueQr.mockReturnValueOnce(
    new Promise((resolve) => {
      finish = resolve;
    }),
  );
  render(<AttendanceQr attendanceId={4} closed={false} />);
  fireEvent.click(screen.getByRole("button", { name: "QR 생성" }));
  fireEvent.click(screen.getByRole("button", { name: "QR 모달 닫기" }));
  await act(async () =>
    fireEvent.click(screen.getByRole("button", { name: "QR 생성" })),
  );
  await act(async () =>
    finish({
      attendanceId: 4,
      qrToken: "stale-token",
      expiresAt: new Date(Date.now() + 120000).toISOString(),
    }),
  );
  expect(screen.getByTestId("attendance-qr")).toHaveAttribute(
    "data-value",
    expect.stringContaining("test-attendance-token"),
  );
});

test.each(["출석 변경", "출석 종료", "페이지 이탈"])(
  "%s 시 모달과 타이머를 정리한다",
  async (change) => {
    jest.useFakeTimers();
    const { rerender, unmount } = render(
      <AttendanceQr attendanceId={4} closed={false} />,
    );
    await act(async () =>
      fireEvent.click(screen.getByRole("button", { name: "QR 생성" })),
    );
    if (change === "페이지 이탈") unmount();
    else
      rerender(
        <AttendanceQr
          attendanceId={change === "출석 변경" ? 5 : 4}
          closed={change === "출석 종료"}
        />,
      );
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    await act(async () => jest.advanceTimersByTime(120000));
    expect(adminAttendanceApi.issueQr).toHaveBeenCalledTimes(1);
  },
);

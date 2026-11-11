import { act, fireEvent, render, screen, within } from "@testing-library/react";
import "@testing-library/jest-dom";
import AttendancePreviewPage from "./AttendancePreviewPage";
import { adminAttendanceApi } from "../../api/admin";

jest.mock("../../api/admin", () => ({
  adminAttendanceApi: Object.fromEntries(
    [
      "getEvents",
      "getList",
      "getDetail",
      "create",
      "changeStatus",
      "updateParticipant",
      "remove",
      "issueQr",
    ].map((name) => [name, jest.fn()]),
  ),
}));
jest.mock("qrcode.react", () => ({
  QRCodeSVG: ({ value }) => <svg data-testid="preview-qr" data-value={value} />,
}));

const originalEnv = process.env.NODE_ENV;
beforeAll(() => {
  HTMLDialogElement.prototype.showModal = function () {
    this.setAttribute("open", "");
  };
  HTMLDialogElement.prototype.close = function () {
    this.removeAttribute("open");
  };
});
beforeEach(() => {
  process.env.NODE_ENV = "development";
  jest.clearAllMocks();
});
afterEach(() => {
  process.env.NODE_ENV = originalEnv;
  jest.useRealTimers();
  Object.values(adminAttendanceApi).forEach((method) =>
    expect(method).not.toHaveBeenCalled(),
  );
});

test("예시 화면에서 서버 변경을 막고 검색과 화면 전환은 허용한다", () => {
  render(<AttendancePreviewPage />);
  expect(screen.getByText(/모든 인원과 출석 상태는 예시/)).toBeInTheDocument();
  expect(screen.getByRole("button", { name: "출석 체크 종료" })).toBeDisabled();
  fireEvent.change(screen.getByRole("textbox", { name: "이름 검색" }), {
    target: { value: "회원 B" },
  });
  expect(screen.getByText("예시 회원 B")).toBeInTheDocument();
  expect(screen.queryByText("예시 회원 A")).not.toBeInTheDocument();
  fireEvent.click(screen.getByRole("button", { name: /예시 종료 모임/ }));
  expect(screen.getByRole("button", { name: "수정" })).toBeDisabled();
  expect(screen.getByRole("button", { name: "삭제" })).toBeDisabled();
  expect(
    screen.getByRole("button", { name: "QR 생성 (테스트용)" }),
  ).toBeDisabled();
  fireEvent.click(screen.getByRole("button", { name: "출석체크 만들기 +" }));
  expect(
    screen.getByRole("button", { name: "출석체크 생성하기 (미리보기)" }),
  ).toBeDisabled();
  Object.values(adminAttendanceApi).forEach((method) =>
    expect(method).not.toHaveBeenCalled(),
  );
});

test("QR에는 테스트 표식만 넣고 60초마다 자동 갱신하며 수동 재발급과 화면 전환을 처리한다", () => {
  jest.useFakeTimers();
  render(<AttendancePreviewPage />);
  fireEvent.click(screen.getByRole("button", { name: "QR 생성 (테스트용)" }));
  const qrUrl = new URL(
    screen.getByTestId("preview-qr").getAttribute("data-value"),
  );
  expect(qrUrl.origin).toBe("https://waps.im");
  expect(qrUrl.pathname).toBe("/attendance");
  expect([...qrUrl.searchParams]).toEqual([
    ["preview", "1"],
    ["sequence", "1"],
  ]);
  expect(
    screen.getByRole("link", { name: "waps.im 출석 페이지 열기" }),
  ).toHaveAttribute("href", qrUrl.href);
  expect(
    screen.getByText(/실제 출석 토큰과 개인정보는 전송하지 않습니다/),
  ).toBeInTheDocument();
  act(() => jest.advanceTimersByTime(59000));
  expect(screen.getByRole("timer")).toHaveTextContent("1초");
  act(() => jest.advanceTimersByTime(1000));
  expect(
    new URL(
      screen.getByTestId("preview-qr").getAttribute("data-value"),
    ).searchParams.get("sequence"),
  ).toBe("2");
  expect(screen.getByRole("timer")).toHaveTextContent("60초");
  act(() => jest.advanceTimersByTime(60000));
  expect(
    new URL(
      screen.getByTestId("preview-qr").getAttribute("data-value"),
    ).searchParams.get("sequence"),
  ).toBe("3");
  fireEvent.click(screen.getByRole("button", { name: "지금 새 QR 생성" }));
  expect(screen.getByTestId("preview-qr")).toBeInTheDocument();
  expect(
    new URL(
      screen.getByTestId("preview-qr").getAttribute("data-value"),
    ).searchParams.get("sequence"),
  ).toBe("4");
  fireEvent.click(screen.getByRole("button", { name: /예시 예정 모임/ }));
  expect(screen.queryByTestId("preview-qr")).not.toBeInTheDocument();
  act(() => jest.advanceTimersByTime(60000));
  expect(screen.queryByTestId("preview-qr")).not.toBeInTheDocument();
  Object.values(adminAttendanceApi).forEach((method) =>
    expect(method).not.toHaveBeenCalled(),
  );
});

test("QR을 큰 모달에 표시하고 닫기·Escape·배경 클릭으로 닫는다", () => {
  jest.useFakeTimers();
  render(<AttendancePreviewPage />);
  fireEvent.click(screen.getByRole("button", { name: "QR 생성 (테스트용)" }));
  const dialog = screen.getByRole("dialog", { name: "테스트용 출석 QR" });
  expect(within(dialog).getByTestId("preview-qr")).toBeInTheDocument();
  fireEvent.click(within(dialog).getByRole("button", { name: "QR 모달 닫기" }));
  expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  act(() => jest.advanceTimersByTime(60000));
  expect(screen.queryByTestId("preview-qr")).not.toBeInTheDocument();
  fireEvent.click(screen.getByRole("button", { name: "테스트 QR 재발급" }));
  fireEvent(
    screen.getByRole("dialog"),
    new Event("cancel", { bubbles: true, cancelable: true }),
  );
  expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  fireEvent.click(screen.getByRole("button", { name: "테스트 QR 재발급" }));
  fireEvent.click(screen.getByRole("dialog"));
  expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
});

test.each(["test", "production"])(
  "%s 환경에서는 화면을 표시하지 않는다",
  (environment) => {
    process.env.NODE_ENV = environment;
    const { container } = render(<AttendancePreviewPage />);
    expect(container).toBeEmptyDOMElement();
  },
);

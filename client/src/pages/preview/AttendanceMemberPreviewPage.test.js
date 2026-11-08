import { fireEvent, render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import "@testing-library/jest-dom";
import AttendanceMemberPreviewPage from "./AttendanceMemberPreviewPage";

const originalEnv = process.env.NODE_ENV;
beforeEach(() => { process.env.NODE_ENV = "development"; });
afterEach(() => { process.env.NODE_ENV = originalEnv; jest.restoreAllMocks(); });

const renderMember = (search = "?preview=1&sequence=1") => render(
  <MemoryRouter initialEntries={[`/preview/attendance/check-in${search}`]}>
    <AttendanceMemberPreviewPage />
  </MemoryRouter>,
);

test("QR 링크로 회원용 예시 화면을 열고 저장 없이 버튼 동작을 확인한다", () => {
  const request = jest.spyOn(XMLHttpRequest.prototype, "open");
  const storage = jest.spyOn(Storage.prototype, "setItem");
  renderMember();
  expect(screen.getByRole("heading", { name: "회원 출석체크" })).toBeInTheDocument();
  expect(screen.getByText("예시 회원 A 님의 화면입니다.")).toBeInTheDocument();
  fireEvent.click(screen.getByRole("button", { name: "출석 버튼 테스트 (저장 안 됨)" }));
  expect(screen.getByRole("status")).toHaveTextContent("실제 출석은 기록되지 않았습니다");
  expect(screen.getByRole("button", { name: "화면 테스트 완료" })).toBeDisabled();
  expect(request).not.toHaveBeenCalled();
  expect(storage).not.toHaveBeenCalled();
});

test.each(["", "?preview=1", "?preview=1&sequence=0", "?preview=0&sequence=1"])("잘못된 테스트 링크(%s)는 안내를 표시한다", (search) => {
  renderMember(search);
  expect(screen.getByRole("alert")).toHaveTextContent("테스트 QR");
  expect(screen.queryByRole("button")).not.toBeInTheDocument();
});

test.each(["test", "production"])("%s에서는 회원용 미리보기를 표시하지 않는다", (environment) => {
  process.env.NODE_ENV = environment;
  const { container } = renderMember();
  expect(container).toBeEmptyDOMElement();
});

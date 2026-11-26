import { fireEvent, render, screen } from "@testing-library/react";
import "@testing-library/jest-dom";
import { MemoryRouter, useLocation } from "react-router-dom";
import Menu from "./Menu";
import authStorage from "../utils/authStorage";

jest.mock("../utils/authStorage", () => ({
  get: jest.fn(), set: jest.fn(), remove: jest.fn(),
}));
jest.mock("../api/attendance", () => ({ attendanceApi: { getAttendances: jest.fn() } }));

function Location() {
  return <output data-testid="location">{useLocation().pathname}</output>;
}
let token;
beforeEach(() => {
  jest.clearAllMocks();
  token = "token";
  authStorage.get.mockImplementation((key) => key === "authToken" ? token : null);
  jest.spyOn(window, "alert").mockImplementation(() => {});
});
afterEach(() => jest.restoreAllMocks());

test("로그인한 사용자에게 설정 버튼 하나를 표시하고 이동 시 메뉴를 닫는다", () => {
  const close = jest.fn();
  render(<MemoryRouter><Menu menuOpen toggleMenu={close} /><Location /></MemoryRouter>);
  expect(screen.getAllByRole("button", { name: "설정 Settings" })).toHaveLength(1);
  fireEvent.click(screen.getByRole("button", { name: "설정 Settings" }));
  expect(screen.getByTestId("location")).toHaveTextContent("/settings");
  expect(close).toHaveBeenCalledTimes(1);
});

test("메뉴를 다시 열면 만료된 로그인 상태를 반영한다", () => {
  const view = (open) => <MemoryRouter><Menu menuOpen={open} toggleMenu={jest.fn()} /></MemoryRouter>;
  const { rerender } = render(view(true));
  expect(screen.getByRole("button", { name: "설정 Settings" })).toBeInTheDocument();
  rerender(view(false));
  token = undefined;
  rerender(view(true));
  expect(screen.queryByRole("button", { name: "설정 Settings" })).not.toBeInTheDocument();
  expect(screen.getByRole("button", { name: "로그인 Login" })).toBeInTheDocument();
});

test("메뉴가 열린 동안 로그인 만료 시 설정 대신 로그인으로 이동한다", () => {
  render(<MemoryRouter><Menu menuOpen toggleMenu={jest.fn()} /><Location /></MemoryRouter>);
  token = undefined;
  fireEvent.click(screen.getByRole("button", { name: "설정 Settings" }));
  expect(screen.getByTestId("location")).toHaveTextContent("/login");
});

test("로그인한 사용자의 이름을 조회하는 중에는 로그인 안내를 표시하지 않는다", () => {
  const view = (name) => <MemoryRouter><Menu menuOpen toggleMenu={jest.fn()} userName={name} /></MemoryRouter>;
  const { rerender } = render(view(""));
  expect(screen.getByText("환영합니다.")).toBeInTheDocument();
  expect(screen.queryByText("로그인을 해주십시오.")).toBeNull();
  rerender(view("김하늘"));
  expect(screen.getByText("김하늘님 환영합니다.")).toBeInTheDocument();
});

test("팀빌딩 결과 화면에서 같은 메뉴를 선택해도 메뉴를 닫는다", () => {
  const close = jest.fn();
  render(<MemoryRouter initialEntries={["/team-build/result"]}>
    <Menu menuOpen toggleMenu={close} /><Location />
  </MemoryRouter>);
  fireEvent.click(screen.getByRole("button", { name: /팀빌딩 결과/ }));
  expect(screen.getByTestId("location")).toHaveTextContent("/team-build/result");
  expect(close).toHaveBeenCalledTimes(1);
});

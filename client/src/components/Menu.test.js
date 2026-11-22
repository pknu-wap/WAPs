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

import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import "@testing-library/jest-dom";
import { MemoryRouter, useLocation } from "react-router-dom";
import Header from "./Header";
import authStorage from "../utils/authStorage";
jest.mock("../api/user", () => ({ userApi: { getMe: jest.fn() } }));

jest.mock("../utils/authStorage", () => ({
  get: jest.fn(),
  remove: jest.fn(),
}));
function Location() {
  return <output>{useLocation().pathname}</output>;
}
beforeEach(() => {
  jest.resetAllMocks();
  sessionStorage.clear();
});

test("메뉴 버튼을 키보드로 열고 닫는다", async () => {
  render(
    <MemoryRouter>
      <Header />
    </MemoryRouter>,
  );
  const menu = screen.getByRole("button", { name: "메뉴 열기" });
  menu.focus();
  await userEvent.keyboard("{Enter}");
  expect(screen.getByRole("button", { name: "메뉴 닫기" })).toHaveAttribute(
    "aria-expanded",
    "true",
  );
  await userEvent.keyboard(" ");
  expect(screen.getByRole("button", { name: "메뉴 열기" })).toHaveAttribute(
    "aria-expanded",
    "false",
  );
});

test("전체 화면 메뉴 안에서 탭이 순환하고 Escape로 닫으면 열기 버튼으로 돌아간다", async () => {
  render(<MemoryRouter><Header /></MemoryRouter>);
  const toggle = screen.getByRole("button", { name: "메뉴 열기" });
  await userEvent.click(toggle);
  const brand = screen.getByRole("button", { name: "WAPs 프로젝트 페이지" });
  const last = screen.getByRole("button", { name: "로그인 Login" });
  last.focus();
  await userEvent.tab();
  expect(brand).toHaveFocus();
  await userEvent.tab({ shift: true });
  expect(last).toHaveFocus();
  await userEvent.keyboard("{Escape}");
  expect(screen.queryByRole("navigation", { name: "주 메뉴" })).toBeNull();
  expect(toggle).toHaveFocus();
});

test.each([false, true])(
  "인증 상태에 맞는 로그인 동작을 제공한다: %s",
  async (loggedIn) => {
    authStorage.get.mockImplementation((key) =>
      key === "authToken" && loggedIn ? "test-token" : undefined,
    );
    render(
      <MemoryRouter initialEntries={["/ProjectPage"]}>
        <Header />
        <Location />
      </MemoryRouter>,
    );
    await userEvent.click(
      screen.getByRole("button", { name: loggedIn ? "LOGOUT" : "LOGIN" }),
    );
    expect(await screen.findByText("/login")).toBeInTheDocument();
    expect(authStorage.remove).toHaveBeenCalledTimes(loggedIn ? 2 : 0);
  },
);

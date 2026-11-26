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
jest.mock("./Menu", () => () => null);
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

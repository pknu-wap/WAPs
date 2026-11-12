import { render, screen, fireEvent } from "@testing-library/react";
import "@testing-library/jest-dom";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import Callback from "./Callback";
import RegistrationPage from "../../pages/RegistrationPage";
import { userApi } from "../../api/user";
import authStorage from "../../utils/authStorage";

jest.mock("../../api/user", () => ({
  userApi: { getMe: jest.fn(), completeRegistration: jest.fn() },
}));

jest.mock("../../utils/authStorage", () => ({
  __esModule: true,
  default: { get: jest.fn(), set: jest.fn(), remove: jest.fn() },
  clearDevSession: jest.fn(),
}));

const originalFetch = global.fetch;
const originalNodeEnv = process.env.NODE_ENV;

beforeEach(() => {
  jest.resetAllMocks();
  authStorage.get.mockImplementation((key) =>
    key === "authToken" ? "test-token" : undefined,
  );
});

afterEach(() => {
  global.fetch = originalFetch;
  process.env.NODE_ENV = originalNodeEnv;
});

function openCallback(profile) {
  global.fetch = jest.fn(async (url) => ({
    ok: true,
    json: async () =>
      url.endsWith("/role") ? { role: "ROLE_GUEST" } : profile,
  }));
  userApi.getMe.mockResolvedValue(profile);

  render(
    <MemoryRouter initialEntries={["/oauth/callback?token=test-token"]}>
      <Routes>
        <Route path="/oauth/callback" element={<Callback />} />
        <Route path="/signup" element={<RegistrationPage />} />
        <Route path="/ProjectPage" element={<h1>프로젝트 목록</h1>} />
      </Routes>
    </MemoryRouter>,
  );
}

test("an existing Kakao account skips signup", async () => {
  openCallback({ userName: "기존 사용자", registrationRequired: false });
  await screen.findByRole("heading", { name: "프로젝트 목록" });
  expect(userApi.getMe).not.toHaveBeenCalled();
  expect(userApi.completeRegistration).not.toHaveBeenCalled();
});

test.each([false, undefined])(
  "development login skips signup when registrationRequired is %s",
  async (registrationRequired) => {
    process.env.NODE_ENV = "development";
    openCallback({ userName: "기존 사용자", registrationRequired });

    await screen.findByRole("heading", { name: "프로젝트 목록" });
    expect(authStorage.set).toHaveBeenCalledWith("authToken", "test-token", {
      expires: 7,
    });
    expect(userApi.getMe).not.toHaveBeenCalled();
    expect(userApi.completeRegistration).not.toHaveBeenCalled();
  },
);

test("a first-time non-member finishes signup without a name or student ID", async () => {
  openCallback({ userName: "카카오 닉네임", registrationRequired: true });
  userApi.completeRegistration.mockResolvedValue({
    userName: "카카오 닉네임",
    registrationRequired: false,
  });

  fireEvent.click(await screen.findByRole("radio", { name: /아니[오요]/ }));
  expect(screen.queryByLabelText(/학번/)).not.toBeInTheDocument();
  fireEvent.click(screen.getByRole("button", { name: /회원가입/ }));

  await screen.findByRole("heading", { name: "프로젝트 목록" });
  expect(userApi.completeRegistration).toHaveBeenCalledWith({
    wapMember: false,
  });
});

test("a WAP member submits the real name and student ID and sees their saved name", async () => {
  openCallback({ userName: "카카오 닉네임", registrationRequired: true });
  userApi.completeRegistration.mockResolvedValue({
    userName: "테스트 회원",
    registrationRequired: false,
  });

  fireEvent.click(await screen.findByRole("radio", { name: "네" }));
  fireEvent.change(screen.getByLabelText(/이름/), {
    target: { value: "테스트 회원" },
  });
  fireEvent.change(screen.getByLabelText(/학번/), {
    target: { value: "202612345" },
  });
  fireEvent.click(screen.getByRole("button", { name: /회원가입/ }));

  await screen.findByRole("heading", { name: "프로젝트 목록" });
  expect(userApi.completeRegistration).toHaveBeenCalledWith({
    wapMember: true,
    name: "테스트 회원",
    studentId: "202612345",
  });
  expect(authStorage.set).toHaveBeenLastCalledWith("userName", "테스트 회원", {
    expires: 7,
  });
});

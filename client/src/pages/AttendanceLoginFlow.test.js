import { StrictMode } from "react";
import { fireEvent, render, screen } from "@testing-library/react";
import "@testing-library/jest-dom";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import AttendanceCheckInPage from "./AttendanceCheckInPage";
import Login from "./Login";
import Callback from "../components/Login/Callback";
import RegistrationPage from "./RegistrationPage";
import apiClient from "../api/client";
import { userApi } from "../api/user";
import authStorage from "../utils/authStorage";

jest.mock("../api/client", () => ({ post: jest.fn() }));
jest.mock("../api/auth", () => ({ authApi: { getKakaoLoginUrl: jest.fn() } }));
jest.mock("../api/user", () => ({
  userApi: { getMe: jest.fn(), getRole: jest.fn(), signup: jest.fn() },
}));
jest.mock("../utils/authStorage", () => ({
  __esModule: true,
  default: { get: jest.fn(), set: jest.fn(), remove: jest.fn() },
  clearDevSession: jest.fn(),
}));
jest.mock("../components/LoadingPage", () => () => <p>Loading</p>);

beforeEach(() => {
  jest.resetAllMocks();
  sessionStorage.clear();
  const values = new Map();
  authStorage.get.mockImplementation((key) => values.get(key));
  authStorage.set.mockImplementation((key, value) => values.set(key, value));
  authStorage.remove.mockImplementation((key) => values.delete(key));
  userApi.getMe.mockResolvedValue({ signupCompleted: true, userName: "회원" });
  userApi.getRole.mockResolvedValue({ role: "ROLE_MEMBER" });
  apiClient.post.mockResolvedValue({});
});

function open(path) {
  return render(
    <StrictMode>
      <MemoryRouter initialEntries={[path]} future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
        <Routes>
          <Route path="/attendance" element={<AttendanceCheckInPage />} />
          <Route path="/login" element={<Login />} />
          <Route path="/oauth/callback" element={<Callback />} />
          <Route path="/signup" element={<RegistrationPage />} />
          <Route path="/ProjectPage" element={<h1>왑스 메인</h1>} />
          <Route path="/" element={<h1>홈</h1>} />
        </Routes>
      </MemoryRouter>
    </StrictMode>,
  );
}

async function scanAndLeaveForOAuth() {
  const view = open("/attendance?attendanceId=4&token=a%2Bb%26c");
  await screen.findByRole("button", { name: "로그인" });
  expect(apiClient.post).not.toHaveBeenCalled();
  // OAuth leaves the React application; only tab storage survives the round trip.
  view.unmount();
}

async function confirmAttendance() {
  expect(await screen.findByRole("alertdialog", { name: "출석 완료" }))
    .toHaveTextContent("출석체크가 완료되었습니다.");
  expect(screen.queryByRole("heading", { name: "왑스 메인" })).not.toBeInTheDocument();
  fireEvent.click(screen.getByRole("button", { name: "확인" }));
}

test("카메라 QR 진입 후 로그인 왕복을 거쳐 같은 토큰으로 한 번만 출석한다", async () => {
  await scanAndLeaveForOAuth();
  const callback = open("/oauth/callback?token=login-token");
  await confirmAttendance();
  await screen.findByRole("heading", { name: "왑스 메인" });
  expect(apiClient.post).toHaveBeenCalledTimes(1);
  expect(apiClient.post).toHaveBeenCalledWith("/attendances/4/check-in", { qrToken: "a+b&c" });
  callback.unmount();
  open("/oauth/callback?token=another-login-token");
  await screen.findByRole("heading", { name: "왑스 메인" });
  expect(apiClient.post).toHaveBeenCalledTimes(1);
});

test.each([
  [400, "유효하지 않거나 만료된 QR"],
  [403, "대상자가 아닙니다"],
  [409, "진행 중인 출석이 아닙니다"],
])("로그인 후 출석 서버의 %s 오류를 표시한다", async (status, message) => {
  await scanAndLeaveForOAuth();
  apiClient.post.mockRejectedValue({ response: { status } });
  open("/oauth/callback?token=login-token");
  expect(await screen.findByRole("alert")).toHaveTextContent(message);
  expect(screen.queryByRole("heading", { name: "왑스 메인" })).not.toBeInTheDocument();
});

test("로그인 실패 후 다시 로그인하면 보관한 출석을 재개한다", async () => {
  await scanAndLeaveForOAuth();
  userApi.getMe.mockRejectedValueOnce(new Error("network"));
  const failed = open("/oauth/callback?token=failed-token");
  await screen.findByRole("button", { name: "로그인" });
  expect(apiClient.post).not.toHaveBeenCalled();
  failed.unmount();
  open("/oauth/callback?token=login-token");
  await confirmAttendance();
  await screen.findByRole("heading", { name: "왑스 메인" });
  expect(apiClient.post).toHaveBeenCalledTimes(1);
});

test.each(["로그인 닫기", "로그인 없이 계속하기"])("%s를 선택하면 이후 로그인에서 출석하지 않는다", async (name) => {
  const view = open("/attendance?attendanceId=4&token=qr-token");
  fireEvent.click(await screen.findByRole("button", { name }));
  view.unmount();
  open("/oauth/callback?token=login-token");
  await screen.findByRole("heading", { name: "왑스 메인" });
  expect(apiClient.post).not.toHaveBeenCalled();
});

test("잘못된 출석 링크는 로그인이나 출석 요청을 시작하지 않는다", async () => {
  open("/attendance?attendanceId=0&token=qr-token");
  expect(await screen.findByRole("alert")).toHaveTextContent("출석 링크가 올바르지 않습니다");
  expect(apiClient.post).not.toHaveBeenCalled();
  expect(sessionStorage.length).toBe(0);
});

test("가입이 필요한 사용자는 가입을 마친 뒤 출석을 재개한다", async () => {
  await scanAndLeaveForOAuth();
  userApi.getMe.mockResolvedValue({ signupCompleted: false, userName: "회원" });
  userApi.signup.mockResolvedValue({ signupCompleted: true, userName: "회원" });
  open("/oauth/callback?token=login-token");
  fireEvent.click(await screen.findByRole("radio", { name: "아니요" }));
  expect(apiClient.post).not.toHaveBeenCalled();
  fireEvent.click(screen.getByRole("button", { name: "회원가입하기" }));
  await confirmAttendance();
  await screen.findByRole("heading", { name: "왑스 메인" });
  expect(apiClient.post).toHaveBeenCalledTimes(1);
});

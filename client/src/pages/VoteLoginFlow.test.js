import { StrictMode } from "react";
import { fireEvent, render, screen } from "@testing-library/react";
import "@testing-library/jest-dom";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import VotePage from "./VotePage";
import { voteApi } from "../api/vote";
import Login from "./Login";
import Callback from "../components/Login/Callback";
import RegistrationPage from "./RegistrationPage";
import { userApi } from "../api/user";
import authStorage from "../utils/authStorage";

jest.mock("../components/Header", () => () => null);
jest.mock("../components/Menu", () => () => null);
jest.mock("../components/FloatingButton", () => () => null);
jest.mock("../components/Vote/VoteForm", () => () => <h1>프로젝트 투표</h1>);
jest.mock("../api/vote", () => ({ voteApi: { getVoteNow: jest.fn() } }));
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
  window.alert = jest.fn();
  voteApi.getVoteNow.mockResolvedValue({ isOpen: true, isVotedUser: false });
  const values = new Map();
  authStorage.get.mockImplementation((key) => values.get(key));
  authStorage.set.mockImplementation((key, value) => values.set(key, value));
  authStorage.remove.mockImplementation((key) => values.delete(key));
  userApi.getMe.mockResolvedValue({ signupCompleted: true, userName: "회원" });
  userApi.getRole.mockResolvedValue({ role: "ROLE_MEMBER" });
});

function open(path) {
  return render(
    <StrictMode>
      <MemoryRouter initialEntries={[path]} future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
        <Routes>
          <Route path="/vote" element={<VotePage />} />
          <Route path="/vote/result" element={<h1>투표 결과</h1>} />
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

async function leaveForOAuth() {
  const view = open("/vote");
  await screen.findByRole("button", { name: "로그인" });
  expect(voteApi.getVoteNow).not.toHaveBeenCalled();
  view.unmount(); // OAuth round trip keeps sessionStorage, but loses React state.
}

test("투표 진입 후 기존 게스트 로그인은 투표로 한 번만 복귀한다", async () => {
  await leaveForOAuth();
  userApi.getRole.mockResolvedValue({ role: "ROLE_GUEST" });
  const view = open("/oauth/callback?token=login-token");
  await screen.findByRole("heading", { name: "프로젝트 투표" });
  expect(voteApi.getVoteNow).toHaveBeenCalledTimes(1);
  view.unmount();
  open("/oauth/callback?token=another-token");
  await screen.findByRole("heading", { name: "왑스 메인" });
});

test("신규 비회원은 가입 완료 후 투표로 복귀한다", async () => {
  await leaveForOAuth();
  userApi.getMe.mockResolvedValue({ signupCompleted: false });
  userApi.signup.mockImplementation(async () => {
    const profile = { signupCompleted: true, userName: "게스트" };
    userApi.getMe.mockResolvedValue(profile);
    return profile;
  });
  open("/oauth/callback?token=login-token");
  fireEvent.click(await screen.findByRole("radio", { name: "아니요" }));
  expect(voteApi.getVoteNow).not.toHaveBeenCalled();
  fireEvent.click(screen.getByRole("button", { name: "회원가입하기" }));
  await screen.findByRole("heading", { name: "프로젝트 투표" });
  expect(userApi.signup).toHaveBeenCalledWith({ member: false });
});

test("로그인 실패 후 재시도에도 투표 복귀 목적지를 유지한다", async () => {
  await leaveForOAuth();
  userApi.getMe.mockRejectedValueOnce(new Error("network"));
  const failed = open("/oauth/callback?token=failed-token");
  await screen.findByRole("button", { name: "로그인" });
  failed.unmount();
  open("/oauth/callback?token=login-token");
  await screen.findByRole("heading", { name: "프로젝트 투표" });
});

test.each(["로그인 닫기", "로그인 없이 계속하기"])("%s는 투표 복귀를 취소한다", async (name) => {
  const view = open("/vote");
  fireEvent.click(await screen.findByRole("button", { name }));
  view.unmount();
  open("/oauth/callback?token=login-token");
  await screen.findByRole("heading", { name: "왑스 메인" });
});

test("가입 취소는 투표 복귀를 취소한다", async () => {
  await leaveForOAuth();
  userApi.getMe.mockResolvedValue({ signupCompleted: false });
  const view = open("/oauth/callback?token=login-token");
  fireEvent.click(await screen.findByRole("button", { name: "가입 화면 닫기" }));
  view.unmount();
  userApi.getMe.mockResolvedValue({ signupCompleted: true });
  open("/oauth/callback?token=another-token");
  await screen.findByRole("heading", { name: "왑스 메인" });
});

test("만료 토큰으로 투표 진입 시 재로그인 후 복귀한다", async () => {
  authStorage.set("authToken", "expired");
  userApi.getMe.mockRejectedValueOnce({ response: { status: 401 } });
  await leaveForOAuth();
  expect(authStorage.get("authToken")).toBeUndefined();
  open("/oauth/callback?token=login-token");
  await screen.findByRole("heading", { name: "프로젝트 투표" });
});

test("가입 미완료 토큰으로 직접 진입하면 먼저 가입 화면으로 이동한다", async () => {
  authStorage.set("authToken", "pending");
  userApi.getMe.mockResolvedValue({ signupCompleted: false });
  open("/vote");
  await screen.findByRole("button", { name: "회원가입하기" });
  expect(voteApi.getVoteNow).not.toHaveBeenCalled();
});

test("복귀 시 투표가 종료되었으면 기존 결과 안내를 유지한다", async () => {
  await leaveForOAuth();
  voteApi.getVoteNow.mockResolvedValue({ isOpen: false });
  open("/oauth/callback?token=login-token");
  await screen.findByRole("heading", { name: "투표 결과" });
});

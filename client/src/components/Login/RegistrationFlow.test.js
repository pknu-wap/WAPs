import { render, screen, fireEvent, act } from "@testing-library/react";
import "@testing-library/jest-dom";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import Callback from "./Callback";
import RegistrationPage from "../../pages/RegistrationPage";
import { userApi } from "../../api/user";
import authStorage from "../../utils/authStorage";

jest.mock("../../api/user", () => ({
  userApi: { getMe: jest.fn(), signup: jest.fn(), getRole: jest.fn() },
}));
jest.mock("../../utils/authStorage", () => ({
  __esModule: true,
  default: { get: jest.fn(), set: jest.fn(), remove: jest.fn() },
  clearDevSession: jest.fn(),
}));

const pending = { userName: "카카오 이름", signupCompleted: false };
const completed = { userName: "남궁민수", signupCompleted: true };

beforeEach(() => {
  jest.resetAllMocks();
  authStorage.get.mockReturnValue("test-token");
  userApi.getMe.mockResolvedValue(pending);
  userApi.getRole.mockResolvedValue({ role: "ROLE_MEMBER" });
  userApi.signup.mockResolvedValue(completed);
});

function open(path = "/signup") {
  render(<MemoryRouter initialEntries={[path]}><Routes>
    <Route path="/oauth/callback" element={<Callback />} />
    <Route path="/signup" element={<RegistrationPage />} />
    <Route path="/ProjectPage" element={<h1>프로젝트 목록</h1>} />
    <Route path="/settings" element={<h1>설정</h1>} />
    <Route path="/login" element={<h1>로그인</h1>} />
  </Routes></MemoryRouter>);
}

async function fillMember() {
  fireEvent.click(await screen.findByRole("radio", { name: "네" }));
  fireEvent.change(screen.getByLabelText(/이름/), { target: { value: "남궁민수" } });
  fireEvent.change(screen.getByLabelText(/학번/), { target: { value: "26" } });
  fireEvent.change(screen.getByLabelText("회원 구분"), { target: { value: "ASSOCIATE" } });
}

test.each([true, false])("callback routes using signupCompleted=%s", async (signupCompleted) => {
  userApi.getMe.mockResolvedValue({ ...pending, signupCompleted });
  open("/oauth/callback?token=test-token");
  if (signupCompleted) await screen.findByRole("heading", { name: "프로젝트 목록" });
  else await screen.findByRole("radio", { name: "네" });
  expect(userApi.signup).not.toHaveBeenCalled();
});

test("role lookup failure does not discard a successful login", async () => {
  userApi.getMe.mockResolvedValue(completed);
  userApi.getRole.mockRejectedValue(new Error("unavailable"));
  open("/oauth/callback?token=test-token");
  await screen.findByRole("heading", { name: "프로젝트 목록" });
  expect(authStorage.remove).toHaveBeenCalledWith("userRole");
  expect(authStorage.remove).not.toHaveBeenCalledWith("authToken");
});

test("failed callback removes stale login state", async () => {
  userApi.getMe.mockRejectedValue(new Error("network"));
  open("/oauth/callback?token=test-token");
  await screen.findByRole("heading", { name: "로그인" });
  expect(authStorage.remove).toHaveBeenCalledWith("authToken");
  expect(authStorage.remove).toHaveBeenCalledWith("userRole");
});

test("unknown signup status fails closed with retry and exit", async () => {
  userApi.getMe.mockResolvedValue({ userName: "unknown" });
  open("/oauth/callback?token=test-token");
  await screen.findByRole("alert");
  expect(screen.queryByRole("heading", { name: "프로젝트 목록" })).not.toBeInTheDocument();
  userApi.getMe.mockResolvedValue(pending);
  fireEvent.click(screen.getByRole("button", { name: "다시 시도" }));
  await screen.findByRole("radio", { name: "네" });
  fireEvent.click(screen.getByRole("button", { name: "가입 화면 닫기" }));
  await screen.findByRole("heading", { name: "프로젝트 목록" });
  expect(authStorage.remove).toHaveBeenCalledWith("authToken");
});

test("guest signup omits member fields", async () => {
  open();
  fireEvent.click(await screen.findByRole("radio", { name: "아니요" }));
  fireEvent.click(screen.getByRole("button", { name: "회원가입하기" }));
  await screen.findByRole("heading", { name: "프로젝트 목록" });
  expect(userApi.signup).toHaveBeenCalledWith({ member: false });
});

test("member signup sends the actual server contract and refreshes role", async () => {
  open();
  await fillMember();
  fireEvent.click(screen.getByRole("button", { name: "회원가입하기" }));
  await screen.findByRole("heading", { name: "프로젝트 목록" });
  expect(userApi.signup).toHaveBeenCalledWith({ member: true, name: "남궁민수", studentNumber: "26", memberType: "ASSOCIATE" });
  expect(authStorage.set).toHaveBeenCalledWith("userRole", "ROLE_MEMBER", { expires: 7 });
});

test.each(["2026", "202612862", "26"])("pasting %s retains the admission year", async (text) => {
  open();
  await fillMember();
  fireEvent.paste(screen.getByLabelText(/학번/), { clipboardData: { getData: () => text } });
  expect(screen.getByLabelText(/학번/)).toHaveValue("26");
});

test("unsupported paste does not silently truncate or replace the year", async () => {
  open();
  await fillMember();
  fireEvent.paste(screen.getByLabelText(/학번/), { clipboardData: { getData: () => "20261" } });
  expect(screen.getByLabelText(/학번/)).toHaveValue("26");
  expect(screen.getByRole("alert")).toHaveTextContent("붙여 넣어주세요");
});

test("invalid name and year cannot be submitted even without native validation", async () => {
  open();
  await fillMember();
  const name = screen.getByLabelText(/이름/);
  fireEvent.change(name, { target: { value: "남궁민수준" } });
  fireEvent.submit(name.closest("form"));
  expect(screen.getByRole("alert")).toHaveTextContent("4자");
  fireEvent.change(name, { target: { value: "회원" } });
  fireEvent.change(screen.getByLabelText(/학번/), { target: { value: "2" } });
  fireEvent.submit(name.closest("form"));
  expect(screen.getByRole("alert")).toHaveTextContent("두 자리");
  expect(userApi.signup).not.toHaveBeenCalled();
});

test("failed save preserves input and can retry", async () => {
  userApi.signup.mockRejectedValueOnce(new Error("network"));
  open();
  await fillMember();
  fireEvent.click(screen.getByRole("button", { name: "회원가입하기" }));
  await screen.findByRole("alert");
  expect(screen.getByLabelText(/이름/)).toHaveValue("남궁민수");
  fireEvent.click(screen.getByRole("button", { name: "회원가입하기" }));
  await screen.findByRole("heading", { name: "프로젝트 목록" });
});

test("concurrent or previously successful submission recovers through 409 lookup", async () => {
  userApi.signup.mockRejectedValue({ response: { status: 409 } });
  open();
  await fillMember();
  userApi.getMe.mockResolvedValue(completed);
  fireEvent.click(screen.getByRole("button", { name: "회원가입하기" }));
  await screen.findByRole("heading", { name: "프로젝트 목록" });
});

test("incomplete success response does not navigate away", async () => {
  userApi.signup.mockResolvedValue({ userName: "incomplete" });
  open();
  await fillMember();
  fireEvent.click(screen.getByRole("button", { name: "회원가입하기" }));
  expect(await screen.findByRole("alert")).toHaveTextContent("가입이 완료되지 않았습니다");
});

test("double submit sends only one request", async () => {
  let resolve;
  userApi.signup.mockReturnValue(new Promise((done) => { resolve = done; }));
  open();
  await fillMember();
  const form = screen.getByLabelText(/이름/).closest("form");
  fireEvent.submit(form);
  fireEvent.submit(form);
  expect(userApi.signup).toHaveBeenCalledTimes(1);
  await act(async () => resolve(completed));
  await screen.findByRole("heading", { name: "프로젝트 목록" });
});

test("expired signup session returns to login", async () => {
  userApi.getMe.mockRejectedValue({ response: { status: 401 } });
  open();
  await screen.findByRole("heading", { name: "로그인" });
  expect(authStorage.remove).toHaveBeenCalledWith("authToken");
});

test("completed account edit link returns to supported settings without changing membership", async () => {
  userApi.getMe.mockResolvedValue(completed);
  open("/signup?edit=true");
  await screen.findByRole("heading", { name: "설정" });
  expect(userApi.signup).not.toHaveBeenCalled();
  expect(authStorage.remove).not.toHaveBeenCalled();
});

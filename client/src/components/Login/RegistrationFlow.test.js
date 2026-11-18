import { render, screen, fireEvent } from "@testing-library/react";
import "@testing-library/jest-dom";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import Callback from "./Callback";
import RegistrationPage from "../../pages/RegistrationPage";
import { userApi } from "../../api/user";
import authStorage from "../../utils/authStorage";

jest.mock("../../api/user", () => ({
  userApi: { getMe: jest.fn(), completeRegistration: jest.fn(), updateRegistration: jest.fn() },
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

test("a pending main-server account cannot bypass registration", async () => {
  openCallback({ userName: "가입대기", signupCompleted: false });
  expect(await screen.findByRole("radio", { name: "네" })).toBeInTheDocument();
  expect(screen.queryByRole("heading", { name: "프로젝트 목록" })).not.toBeInTheDocument();
});

test("completed main-server accounts skip registration", async () => {
  openCallback({ userName: "기존회원", signupCompleted: true });
  await screen.findByRole("heading", { name: "프로젝트 목록" });
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
    userName: "시험회원",
    registrationRequired: false,
  });

  fireEvent.click(await screen.findByRole("radio", { name: "네" }));
  fireEvent.change(screen.getByLabelText(/이름/), {
    target: { value: "시험회원" },
  });
  fireEvent.change(screen.getByLabelText(/학번/), {
    target: { value: "26" },
  });
  fireEvent.click(screen.getByRole("button", { name: /회원가입/ }));

  await screen.findByRole("heading", { name: "프로젝트 목록" });
  expect(userApi.completeRegistration).toHaveBeenCalledWith({
    wapMember: true,
    name: "시험회원",
    studentId: "26",
  });
  expect(authStorage.set).toHaveBeenLastCalledWith("userName", "시험회원", {
    expires: 7,
  });
});

test.each(["2026", "202612862"])(
  "pasting %s submits the admission year suffix 26",
  async (pastedValue) => {
    openCallback({ userName: "카카오 닉네임", registrationRequired: true });
    userApi.completeRegistration.mockResolvedValue({ registrationRequired: false });

    fireEvent.click(await screen.findByRole("radio", { name: "네" }));
    fireEvent.change(screen.getByLabelText(/이름/), {
      target: { value: "시험회원" },
    });
    const studentIdInput = screen.getByLabelText(/학번/);
    expect(studentIdInput).toHaveAccessibleDescription(
      "입학 연도 뒤 두 자리를 입력해주세요. 예: 2026 → 26",
    );
    fireEvent.paste(studentIdInput, {
      clipboardData: { getData: () => pastedValue },
    });
    expect(studentIdInput).toHaveValue("26");
    fireEvent.click(screen.getByRole("button", { name: "회원가입하기" }));

    await screen.findByRole("heading", { name: "프로젝트 목록" });
    expect(userApi.completeRegistration).toHaveBeenCalledWith({
      wapMember: true,
      name: "시험회원",
      studentId: "26",
    });
  },
);

test.each(["202612862", "26"])(
  "editing saved student ID %s preserves the admission year suffix",
  async (studentId) => {
    userApi.getMe.mockResolvedValue({
      userName: "시험회원",
      wapMember: true,
      studentId,
      registrationRequired: false,
    });
    userApi.updateRegistration.mockResolvedValue({ registrationRequired: false });
    render(
      <MemoryRouter initialEntries={["/signup?edit=true"]}>
        <Routes>
          <Route path="/signup" element={<RegistrationPage />} />
          <Route path="/settings" element={<h1>설정</h1>} />
        </Routes>
      </MemoryRouter>,
    );

    expect(await screen.findByLabelText(/학번/)).toHaveValue("26");
    fireEvent.click(screen.getByRole("button", { name: "가입 정보 저장" }));

    await screen.findByRole("heading", { name: "설정" });
    expect(userApi.updateRegistration).toHaveBeenCalledWith({
      wapMember: true,
      name: "시험회원",
      studentId: "26",
    });
  },
);

function openEdit(profile) {
  userApi.getMe.mockResolvedValue(profile);
  render(<MemoryRouter initialEntries={["/signup?edit=true"]}><Routes>
    <Route path="/signup" element={<RegistrationPage />} />
    <Route path="/settings" element={<h1>설정</h1>} />
  </Routes></MemoryRouter>);
}

test("existing members can edit persisted registration details and save", async () => {
  openEdit({ userName: "기존이름", registrationRequired: false, wapMember: true, studentId: "21" });
  expect(await screen.findByLabelText(/학번/)).toHaveValue("21");
  expect(screen.getByLabelText(/이름/)).toHaveValue("기존이름");
  fireEvent.change(screen.getByLabelText(/이름/), { target: { value: "수정이름" } });
  fireEvent.change(screen.getByLabelText(/학번/), { target: { value: "ab234567" } });
  expect(screen.getByLabelText(/학번/)).toHaveValue("23");
  userApi.updateRegistration.mockResolvedValue({ userName: "수정이름", registrationRequired: false });
  fireEvent.click(screen.getByRole("button", { name: "가입 정보 저장" }));
  await screen.findByRole("heading", { name: "설정" });
  expect(userApi.updateRegistration).toHaveBeenCalledWith({ wapMember: true, name: "수정이름", studentId: "23" });
  expect(userApi.completeRegistration).not.toHaveBeenCalled();
});

test("closing registration editing keeps the login session", async () => {
  openEdit({ userName: "회원", registrationRequired: false, wapMember: false });
  fireEvent.click(await screen.findByRole("button", { name: "가입 화면 닫기" }));
  await screen.findByRole("heading", { name: "설정" });
  expect(authStorage.remove).not.toHaveBeenCalled();
});

test("failed edits retain entered registration details", async () => {
  openEdit({ userName: "회원", registrationRequired: false, wapMember: true, studentId: "22" });
  await screen.findByLabelText(/학번/);
  userApi.updateRegistration.mockRejectedValue(new Error("failed"));
  fireEvent.click(screen.getByRole("button", { name: "가입 정보 저장" }));
  await screen.findByRole("alert");
  expect(screen.getByLabelText(/학번/)).toHaveValue("22");
});


test.each([false, true])("four-character real names can be saved (editing: %s)", async (editing) => {
  const profile = { userName: "홍길동", registrationRequired: !editing, wapMember: true, studentId: "26" };
  const save = editing ? userApi.updateRegistration : userApi.completeRegistration;
  save.mockResolvedValue({ userName: "남궁민수", registrationRequired: false });
  if (editing) openEdit(profile);
  else {
    openCallback(profile);
    fireEvent.click(await screen.findByRole("radio", { name: "네" }));
  }
  const nameInput = await screen.findByLabelText(/이름/);
  expect(nameInput).toHaveAttribute("maxlength", "4");
  fireEvent.change(nameInput, { target: { value: "남궁민수" } });
  fireEvent.change(screen.getByLabelText(/학번/), { target: { value: "26" } });
  fireEvent.click(screen.getByRole("button", { name: editing ? "가입 정보 저장" : "회원가입하기" }));
  await screen.findByRole("heading", { name: editing ? "설정" : "프로젝트 목록" });
  expect(save).toHaveBeenCalledWith({ wapMember: true, name: "남궁민수", studentId: "26" });
});

test.each([false, true])("five-character real names are rejected before any save request (editing: %s)", async (editing) => {
  const profile = { userName: "홍길동", registrationRequired: !editing, wapMember: true, studentId: "26" };
  if (editing) openEdit(profile);
  else {
    openCallback(profile);
    fireEvent.click(await screen.findByRole("radio", { name: "네" }));
  }
  const nameInput = await screen.findByLabelText(/이름/);
  fireEvent.change(nameInput, { target: { value: "남궁민수준" } });
  fireEvent.change(screen.getByLabelText(/학번/), { target: { value: "26" } });
  // Submit directly to verify the guard even when native maxlength is bypassed.
  fireEvent.submit(nameInput.closest("form"));
  expect(await screen.findByRole("alert")).toHaveTextContent("이름은 4자 이내로 입력해주세요.");
  expect(userApi.completeRegistration).not.toHaveBeenCalled();
  expect(userApi.updateRegistration).not.toHaveBeenCalled();
});

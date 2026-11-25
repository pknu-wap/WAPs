import {
  act,
  fireEvent,
  render,
  screen,
  waitFor,
} from "@testing-library/react";
import "@testing-library/jest-dom";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import Settings from "./Settings";
import { userApi } from "../api/user";
import authStorage from "../utils/authStorage";

jest.mock("../api/user", () => ({
  userApi: { getMe: jest.fn(), updateName: jest.fn() },
}));
jest.mock("../utils/authStorage", () => ({
  __esModule: true,
  default: { get: jest.fn(), set: jest.fn() },
}));

beforeEach(() => {
  jest.resetAllMocks();
  userApi.getMe.mockResolvedValue({
    userName: "기존이름",
    memberType: "정회원",
  });
  jest.spyOn(window, "alert").mockImplementation(() => {});
});
afterEach(() => jest.restoreAllMocks());

function openSettings() {
  render(
    <MemoryRouter initialEntries={["/settings"]}>
      <Routes>
        <Route path="/settings" element={<Settings />} />
        <Route path="/ProjectPage" element={<h1>프로젝트</h1>} />
      </Routes>
    </MemoryRouter>,
  );
}

test.each([
  [{ memberType: "정회원" }, "정회원"],
  [{ memberType: "NEW" }, "신입"],
  [{ membershipLevel: "ASSOCIATE" }, "준회원"],
  [{ membershipLevel: "NONE", memberType: null }, "미정"],
])(
  "settings displays the saved member level for either server response",
  async (profile, label) => {
    userApi.getMe.mockResolvedValue({ userName: "기존이름", ...profile });
    openSettings();
    expect(await screen.findAllByText(label)).toHaveLength(2);
  },
);

test("name saving blocks duplicate submissions and updates the login display name", async () => {
  let finishSave;
  userApi.updateName.mockReturnValue(
    new Promise((resolve) => {
      finishSave = resolve;
    }),
  );
  openSettings();
  await screen.findAllByText("기존이름");
  fireEvent.click(
    screen.getByRole("button", { name: "이름 변경", exact: true }),
  );
  fireEvent.change(screen.getByLabelText("변경할 이름"), {
    target: { value: "새이름" },
  });
  fireEvent.click(screen.getByRole("button", { name: "이름 변경하기" }));
  fireEvent.click(screen.getByRole("button", { name: "이름 변경하기" }));
  const pending = screen.getByRole("button", { name: "저장 중..." });
  expect(pending).toBeDisabled();
  fireEvent.click(pending);
  expect(userApi.updateName).toHaveBeenCalledTimes(1);
  expect(userApi.updateName).toHaveBeenCalledWith("새이름");
  await act(async () => finishSave({ name: "새이름" }));
  expect(screen.getAllByText("새이름")).toHaveLength(2);
  expect(authStorage.set).toHaveBeenCalledWith("userName", "새이름", {
    expires: 7,
  });
  expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
});

test("failed profile loading prevents edits and can be retried", async () => {
  userApi.getMe.mockRejectedValueOnce(new Error("offline"));
  openSettings();
  expect(await screen.findByRole("alert")).toHaveTextContent(
    "회원 정보를 불러오지 못했습니다.",
  );
  expect(
    screen.getByRole("button", { name: "이름 변경", exact: true }),
  ).toBeDisabled();
  fireEvent.click(screen.getByRole("button", { name: "다시 불러오기" }));
  await screen.findAllByText("기존이름");
  expect(screen.queryByRole("alert")).not.toBeInTheDocument();
  expect(
    screen.getByRole("button", { name: "이름 변경", exact: true }),
  ).toBeEnabled();
});

test("a failed name save keeps the old profile and allows retry", async () => {
  jest.spyOn(console, "error").mockImplementation(() => {});
  userApi.updateName.mockRejectedValue(new Error("offline"));
  openSettings();
  await screen.findAllByText("기존이름");
  fireEvent.click(
    screen.getByRole("button", { name: "이름 변경", exact: true }),
  );
  fireEvent.change(screen.getByLabelText("변경할 이름"), {
    target: { value: "새이름" },
  });
  fireEvent.click(screen.getByRole("button", { name: "이름 변경하기" }));
  fireEvent.click(screen.getByRole("button", { name: "이름 변경하기" }));
  await waitFor(() =>
    expect(window.alert).toHaveBeenCalledWith("이름 변경에 실패했습니다."),
  );
  expect(screen.getAllByText("기존이름")).toHaveLength(2);
  expect(authStorage.set).toHaveBeenCalledTimes(1);
  expect(authStorage.set).toHaveBeenCalledWith("userName", "기존이름", { expires: 7 });
  expect(screen.getByRole("button", { name: "이름 변경하기" })).toBeEnabled();
});

test("name editing rejects five characters even if the input limit is bypassed", async () => {
  openSettings();
  await screen.findAllByText("기존이름");
  fireEvent.click(
    screen.getByRole("button", { name: "이름 변경", exact: true }),
  );
  const input = screen.getByLabelText("변경할 이름");
  expect(input).toHaveAttribute("maxlength", "4");
  fireEvent.change(input, { target: { value: "남궁민수준" } });
  fireEvent.click(screen.getByRole("button", { name: "이름 변경하기" }));
  expect(window.alert).toHaveBeenCalledWith("이름은 4자 이내로 입력해주세요.");
  expect(userApi.updateName).not.toHaveBeenCalled();
});

test("설정은 메뉴 경로와 가입 정보 수정 경로를 제공한다", async () => {
  openSettings();
  await screen.findAllByText("기존이름");
  expect(screen.getByRole("button", { name: "회원가입 정보 수정" })).toBeEnabled();
  fireEvent.click(screen.getByRole("button", { name: "메뉴 페이지로 돌아가기" }));
  expect(
    await screen.findByRole("heading", { name: "프로젝트" }),
  ).toBeInTheDocument();
  expect(sessionStorage.getItem("openMenuAfterBack")).toBe("true");
});

test("가입 정보 수정 버튼은 실제 수정 화면으로 이동한다", async () => {
  render(<MemoryRouter initialEntries={["/settings"]}><Routes>
    <Route path="/settings" element={<Settings />} />
    <Route path="/signup" element={<h1>가입 정보 수정 화면</h1>} />
  </Routes></MemoryRouter>);
  await screen.findAllByText("기존이름");
  fireEvent.click(screen.getByRole("button", { name: "회원가입 정보 수정" }));
  await screen.findByRole("heading", { name: "가입 정보 수정 화면" });
});

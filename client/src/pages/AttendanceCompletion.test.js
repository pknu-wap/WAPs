import { StrictMode } from "react";
import { act, fireEvent, render, screen } from "@testing-library/react";
import "@testing-library/jest-dom";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import apiClient from "../api/client";
import authStorage from "../utils/authStorage";
import AttendanceCheckInPage from "./AttendanceCheckInPage";

jest.mock("../api/client", () => ({ post: jest.fn() }));
jest.mock("../utils/authStorage", () => ({ get: jest.fn() }));

beforeEach(() => {
  jest.clearAllMocks();
  authStorage.get.mockReturnValue("login-token");
});

const open = () => render(
  <StrictMode><MemoryRouter initialEntries={["/attendance?attendanceId=4&token=qr-token"]}>
    <Routes>
      <Route path="/attendance" element={<AttendanceCheckInPage />} />
      <Route path="/ProjectPage" element={<h1>프로젝트</h1>} />
    </Routes>
  </MemoryRouter></StrictMode>,
);

test.each([400, 403, 404, 409])("출석 저장 실패(%s)는 완료 알림을 표시하지 않는다", async (status) => {
  apiClient.post.mockRejectedValue({ response: { status } });
  open();
  await screen.findByRole("alert");
  expect(screen.queryByRole("alertdialog")).not.toBeInTheDocument();
  expect(apiClient.post).toHaveBeenCalledTimes(1);
});

test("화면을 떠난 뒤 도착한 출석 응답은 완료 알림을 열지 않는다", async () => {
  let finish;
  apiClient.post.mockReturnValue(new Promise((resolve) => { finish = resolve; }));
  const { unmount } = open();
  unmount();
  await act(async () => finish({}));
  expect(screen.queryByRole("alertdialog")).not.toBeInTheDocument();
});

test("완료 확인은 API를 다시 호출하지 않고 한 번만 이동한다", async () => {
  apiClient.post.mockResolvedValue({});
  open();
  await screen.findByRole("alertdialog");
  fireEvent.click(screen.getByRole("button", { name: "확인" }));
  expect(await screen.findByRole("heading", { name: "프로젝트" })).toBeInTheDocument();
  expect(apiClient.post).toHaveBeenCalledTimes(1);
  expect(screen.queryByRole("alertdialog")).not.toBeInTheDocument();
});

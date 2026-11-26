import "@testing-library/jest-dom";
import { StrictMode } from "react";
import { fireEvent, render, screen } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import apiClient from "../api/client";
import authStorage from "../utils/authStorage";
import AttendanceCheckInPage from "./AttendanceCheckInPage";

jest.mock("../api/client", () => ({ post: jest.fn() }));
jest.mock("../utils/authStorage", () => ({ get: jest.fn() }));

test("디코딩한 토큰으로 한 번만 출석을 요청하고 성공하면 왑스 메인으로 이동한다", async () => {
  authStorage.get.mockReturnValue("login-token");
  apiClient.post.mockResolvedValue({});

  render(
    <StrictMode>
      <MemoryRouter
        initialEntries={["/attendance?attendanceId=4&token=a%2Bb"]}
        future={{ v7_startTransition: true, v7_relativeSplatPath: true }}
      >
        <Routes>
          <Route path="/attendance" element={<AttendanceCheckInPage />} />
          <Route path="/ProjectPage" element={<h1>왑스 메인</h1>} />
        </Routes>
      </MemoryRouter>
    </StrictMode>,
  );

  expect(await screen.findByRole("alertdialog", { name: "출석 완료" })).toHaveTextContent("출석체크가 완료되었습니다.");
  fireEvent.click(screen.getByRole("button", { name: "확인" }));
  await screen.findByRole("heading", { name: "왑스 메인" });
  expect(apiClient.post).toHaveBeenCalledTimes(1);
  expect(apiClient.post).toHaveBeenCalledWith("/attendances/4/check-in", {
    qrToken: "a+b",
  });
});

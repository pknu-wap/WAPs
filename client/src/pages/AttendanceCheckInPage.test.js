import { StrictMode } from "react";
import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import apiClient from "../api/client";
import authStorage from "../utils/authStorage";
import AttendanceCheckInPage from "./AttendanceCheckInPage";

jest.mock("../api/client", () => ({ post: jest.fn() }));
jest.mock("../utils/authStorage", () => ({ get: jest.fn() }));

test("로그인한 회원이 QR 링크를 열면 디코딩한 토큰으로 한 번만 출석을 요청한다", async () => {
  authStorage.get.mockReturnValue("login-token");
  apiClient.post.mockResolvedValue({});

  render(
    <StrictMode>
      <MemoryRouter
        initialEntries={["/attendance?attendanceId=4&token=a%2Bb"]}
        future={{ v7_startTransition: true, v7_relativeSplatPath: true }}
      >
        <AttendanceCheckInPage />
      </MemoryRouter>
    </StrictMode>,
  );

  await screen.findByText("출석이 완료되었습니다.");
  expect(apiClient.post).toHaveBeenCalledTimes(1);
  expect(apiClient.post).toHaveBeenCalledWith("/attendances/4/check-in", {
    qrToken: "a+b",
  });
});

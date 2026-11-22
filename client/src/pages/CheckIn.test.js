import React from "react";
import { render, screen } from "@testing-library/react";
import "@testing-library/jest-dom";
import { MemoryRouter } from "react-router-dom";
import CheckIn from "./CheckIn";
import { attendanceApi } from "../api/attendance";
jest.mock("../api/attendance", () => ({ attendanceApi: { getAttendances: jest.fn() } }));
test("새로고침 버튼 없이 출석 기록을 조회하고 재진입하면 최신 상태를 읽는다", async () => {
  attendanceApi.getAttendances.mockImplementation(async (status) => status === "ONGOING" ? [] : [
    { attendanceId: 3, title: "종료된 모임", myStatus: "PRESENT" },
  ]);
  const { unmount } = render(<React.StrictMode><MemoryRouter><CheckIn /></MemoryRouter></React.StrictMode>);
  expect(await screen.findByText("종료된 모임")).toBeInTheDocument();
  expect(screen.getByText("진행 중인 출석이 없습니다.")).toBeInTheDocument();
  expect(screen.queryByRole("button", { name: "새로고침" })).not.toBeInTheDocument();
  unmount();
  attendanceApi.getAttendances.mockImplementation(async (status) => status === "ONGOING" ? [
    { attendanceId: 4, title: "현재 모임", myStatus: "PRESENT" },
  ] : []);
  render(<MemoryRouter><CheckIn /></MemoryRouter>);
  expect(await screen.findByText("현재 모임")).toBeInTheDocument();
  expect(screen.getByRole("button", { name: "출석이 완료되었습니다" })).toBeDisabled();
});

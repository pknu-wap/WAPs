import React from "react";
import { fireEvent, render, screen } from "@testing-library/react";
import "@testing-library/jest-dom";
import { MemoryRouter } from "react-router-dom";
import CheckIn from "./CheckIn";
import { attendanceApi } from "../api/attendance";
jest.mock("../api/attendance", () => ({ attendanceApi: { getAttendances: jest.fn() } }));
test("진행 중인 출석이 없어도 종료 기록을 조회하고 최신 상태를 다시 읽는다", async () => {
  attendanceApi.getAttendances.mockImplementation(async (status) => status === "ONGOING" ? [] : [
    { attendanceId: 3, title: "종료된 모임", myStatus: "PRESENT" },
  ]);
  render(<React.StrictMode><MemoryRouter><CheckIn /></MemoryRouter></React.StrictMode>);
  expect(await screen.findByText("종료된 모임")).toBeInTheDocument();
  expect(screen.getByText("진행 중인 출석이 없습니다.")).toBeInTheDocument();
  attendanceApi.getAttendances.mockImplementation(async (status) => status === "ONGOING" ? [
    { attendanceId: 4, title: "현재 모임", myStatus: "PRESENT" },
  ] : []);
  fireEvent.click(screen.getByRole("button", { name: "새로고침" }));
  expect(await screen.findByText("현재 모임")).toBeInTheDocument();
  expect(screen.getByRole("button", { name: "출석이 완료되었습니다" })).toBeDisabled();
});

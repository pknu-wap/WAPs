import React from "react";
import { fireEvent, render, screen } from "@testing-library/react";
import "@testing-library/jest-dom";
import { MemoryRouter, Route, Routes, useLocation } from "react-router-dom";
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
  expect(screen.queryByRole("button", { name: "출석이 완료되었습니다" })).not.toBeInTheDocument();
  expect(screen.queryByRole("button", { name: "출석 QR 찍기" })).not.toBeInTheDocument();
  expect(screen.queryByRole("alertdialog")).not.toBeInTheDocument();
});

test("관리자가 지각 처리한 출석은 지각으로 표시하고 QR 재출석을 요구하지 않는다", async () => {
  attendanceApi.getAttendances.mockImplementation(async (status) =>
    status === "ONGOING"
      ? [{ attendanceId: 4, title: "정기 회의", myStatus: "LATE" }]
      : [],
  );
  render(<MemoryRouter><CheckIn /></MemoryRouter>);
  expect(await screen.findByText("정기 회의")).toBeInTheDocument();
  expect(screen.getByText(/나의 출석 상태.*지각/)).toBeInTheDocument();
  expect(screen.queryByRole("button", { name: "출석 QR 찍기" })).not.toBeInTheDocument();
});

test("첫 모임이 지각이어도 다음 미출석 모임의 QR을 열 수 있다", async () => {
  attendanceApi.getAttendances.mockImplementation(async (status) => status === "ONGOING" ? [
    { attendanceId: 4, title: "첫 모임", myStatus: "LATE" },
    { attendanceId: 5, title: "다음 모임", myStatus: "ABSENT" },
  ] : []);
  function ScanLocation() {
    return <p>{useLocation().pathname}</p>;
  }
  render(<MemoryRouter initialEntries={["/CheckIn"]}><Routes>
    <Route path="/CheckIn" element={<CheckIn />} />
    <Route path="/CheckIn/scan/:attendanceId" element={<ScanLocation />} />
  </Routes></MemoryRouter>);
  await screen.findByText("첫 모임");
  expect(screen.getByText("다음 모임")).toBeInTheDocument();
  fireEvent.click(screen.getByRole("button", { name: "출석 QR 찍기" }));
  await screen.findByText("/CheckIn/scan/5");
});

import { StrictMode } from "react";
import { act, fireEvent, render, screen, waitFor } from "@testing-library/react";
import "@testing-library/jest-dom";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import CheckInScan from "./CheckInScan";
import { attendanceApi } from "../api/attendance";
import QrScanner from "qr-scanner";
jest.mock("qr-scanner", () => jest.fn());
jest.mock("../api/attendance", () => ({ attendanceApi: { checkIn: jest.fn() } }));
test("관리자 URL QR의 token을 전송하고 실패 후 새 QR로 재시도한다", async () => {
  let scan;
  const scanner = { start: jest.fn().mockResolvedValue(undefined), stop: jest.fn(), destroy: jest.fn() };
  QrScanner.mockImplementation((video, callback) => {
    scan = (data) => callback({ data });
    return scanner;
  });
  attendanceApi.checkIn.mockRejectedValueOnce({ response: { status: 400 } }).mockResolvedValueOnce({ status: "PRESENT" });
  jest.spyOn(console, "error").mockImplementation(() => {});
  render(<MemoryRouter initialEntries={["/CheckIn/scan/4"]}><Routes>
    <Route path="/CheckIn/scan/:attendanceId" element={<CheckInScan />} />
    <Route path="/CheckIn" element={<h1>출석 기록</h1>} />
  </Routes></MemoryRouter>);
  await waitFor(() => expect(scan).toBeDefined());
  await act(async () => scan("https://dev.waps.im/attendance?attendanceId=4&token=expired"));
  expect(attendanceApi.checkIn).toHaveBeenLastCalledWith("4", "expired");
  expect(scanner.stop).not.toHaveBeenCalled();
  await act(async () => scan("https://dev.waps.im/attendance?attendanceId=4&token=current"));
  expect(attendanceApi.checkIn).toHaveBeenLastCalledWith("4", "current");
  expect(await screen.findByRole("alertdialog", { name: "출석 완료" })).toHaveTextContent("출석체크가 완료되었습니다.");
  expect(screen.queryByRole("heading", { name: "출석 기록" })).not.toBeInTheDocument();
  await act(async () => scan("https://dev.waps.im/attendance?attendanceId=4&token=current"));
  expect(attendanceApi.checkIn).toHaveBeenCalledTimes(2);
  fireEvent.click(screen.getByRole("button", { name: "확인" }));
  expect(await screen.findByRole("heading", { name: "출석 기록" })).toBeInTheDocument();
  expect(scanner.stop).toHaveBeenCalledTimes(1);
  console.error.mockRestore();
});

test("카메라 권한 대기 중 화면을 닫으면 스캐너를 해제하고 뒤늦은 인식을 무시한다", async () => {
  let allowCamera;
  let scan;
  const scanner = {
    start: jest.fn(() => new Promise((resolve) => { allowCamera = resolve; })),
    destroy: jest.fn(),
  };
  QrScanner.mockImplementation((video, onSuccess) => {
    scan = (data) => onSuccess({ data });
    return scanner;
  });
  attendanceApi.checkIn.mockClear();

  render(<StrictMode><MemoryRouter initialEntries={["/CheckIn", "/CheckIn/scan/4"]}><Routes>
    <Route path="/CheckIn/scan/:attendanceId" element={<CheckInScan />} />
    <Route path="/CheckIn" element={<h1>출석 기록</h1>} />
  </Routes></MemoryRouter></StrictMode>);
  await waitFor(() => expect(scanner.start).toHaveBeenCalledTimes(1));
  scanner.destroy.mockClear();
  fireEvent.click(screen.getByRole("button", { name: "닫기" }));
  await screen.findByRole("heading", { name: "출석 기록" });
  expect(scanner.destroy).toHaveBeenCalledTimes(1);

  await act(async () => {
    allowCamera();
    await scan("stale");
  });
  expect(scanner.start).toHaveBeenCalledTimes(1);
  expect(attendanceApi.checkIn).not.toHaveBeenCalled();
});

import { act, fireEvent, render, screen, waitFor } from "@testing-library/react";
import "@testing-library/jest-dom";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import CheckInScan from "./CheckInScan";
import { attendanceApi } from "../api/attendance";
import { Html5Qrcode } from "html5-qrcode";
jest.mock("html5-qrcode", () => ({ Html5Qrcode: jest.fn() }));
jest.mock("../api/attendance", () => ({ attendanceApi: { checkIn: jest.fn() } }));
test("관리자 URL QR의 token을 전송하고 실패 후 새 QR로 재시도한다", async () => {
  let scan;
  const scanner = { isScanning: true, start: jest.fn(async (camera, config, callback) => { scan = callback; }), stop: jest.fn(async () => {}), clear: jest.fn() };
  Html5Qrcode.mockImplementation(() => scanner);
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
  console.error.mockRestore();
});

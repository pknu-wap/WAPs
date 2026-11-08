import React from "react";
import { act, fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import "@testing-library/jest-dom";
import ManageAttendancePage from "./ManageAttendancePage";
import { adminAttendanceApi } from "../../api/admin";

jest.mock("../../api/admin", () => ({
  adminAttendanceApi: {
    getEvents: jest.fn(), getList: jest.fn(), getDetail: jest.fn(),
    create: jest.fn(), changeStatus: jest.fn(), updateParticipant: jest.fn(),
    remove: jest.fn(), issueQr: jest.fn(),
  },
}));
jest.mock("qrcode.react", () => ({
  QRCodeSVG: ({ value }) => <svg data-testid="attendance-qr" data-value={value} />,
}));

let summary;
let participants;

beforeEach(() => {
  jest.resetAllMocks();
  summary = { attendanceId: 4, title: "정기 모임", date: "2099-11-07", status: "SCHEDULED", totalCount: 1, presentCount: 0, absentCount: 1 };
  participants = [{ userId: 8, userName: "회원", membershipLevel: "REGULAR", status: "ABSENT", checkedInAt: null, note: "" }];
  adminAttendanceApi.getEvents.mockResolvedValue([]);
  adminAttendanceApi.getList.mockImplementation(async () => ({ content: [summary] }));
  adminAttendanceApi.getDetail.mockImplementation(async () => ({ ...summary, participants: { content: participants } }));
  adminAttendanceApi.changeStatus.mockImplementation(async (id, status) => { summary = { ...summary, status }; return summary; });
  adminAttendanceApi.issueQr.mockImplementation(async () => ({ attendanceId: 4, qrToken: "test-token", expiresAt: new Date(Date.now() + 60000).toISOString() }));
  adminAttendanceApi.updateParticipant.mockImplementation(async (id, userId, patch) => {
    participants = participants.map((participant) => participant.userId === userId ? { ...participant, ...patch } : participant);
    return participants.find((participant) => participant.userId === userId);
  });
  jest.spyOn(window, "confirm").mockReturnValue(true);
});

afterEach(() => { jest.restoreAllMocks(); window.localStorage.clear(); });

const renderReady = async () => {
  render(<ManageAttendancePage />);
  await screen.findByRole("button", { name: "출석 체크 시작" });
};

test("서버 명단을 표시하고 기존 로컬 출석은 읽거나 변환하지 않는다", async () => {
  window.localStorage.setItem("waps-admin-attendance-sessions", JSON.stringify([{ id: "fake-local-id", title: "로컬 행사" }]));
  const getItem = jest.spyOn(Storage.prototype, "getItem");
  const setItem = jest.spyOn(Storage.prototype, "setItem");
  await renderReady();
  expect(screen.getByText("회원")).toBeInTheDocument();
  expect(screen.getByText("정회원")).toBeInTheDocument();
  expect(screen.queryByText("로컬 행사")).not.toBeInTheDocument();
  expect(getItem).not.toHaveBeenCalled();
  expect(setItem).not.toHaveBeenCalled();
  expect(adminAttendanceApi.getDetail).toHaveBeenCalledWith(4);
  expect(screen.getByRole("button", { name: "QR 생성" })).toBeDisabled();
});

test("생성 요청은 title/date만 보내며 응답의 실제 ID로 상세를 조회한다", async () => {
  adminAttendanceApi.getList.mockResolvedValue({ content: [] });
  adminAttendanceApi.create.mockImplementation(async (body) => {
    summary = { ...summary, ...body, attendanceId: 19 };
    adminAttendanceApi.getList.mockResolvedValue({ content: [summary] });
    return summary;
  });
  render(<ManageAttendancePage />);
  await waitFor(() => expect(screen.getByRole("button", { name: "출석체크 생성하기" })).toBeEnabled());
  fireEvent.change(screen.getByLabelText("출석체크 명"), { target: { value: "서버 모임" } });
  fireEvent.change(screen.getByLabelText("출석체크 기간"), { target: { value: "2099-11-07" } });
  expect(screen.getByLabelText("출석체크 마감시간")).toBeDisabled();
  fireEvent.click(screen.getByRole("button", { name: "출석체크 생성하기" }));
  await screen.findByRole("button", { name: "출석 체크 시작" });
  expect(adminAttendanceApi.create).toHaveBeenCalledWith({ title: "서버 모임", date: "2099-11-07" });
  expect(adminAttendanceApi.getDetail).toHaveBeenCalledWith(19);
});

test("시작 → 실제 ID QR 발급 → 종료하면 QR이 제거된다", async () => {
  await renderReady();
  fireEvent.click(screen.getByRole("button", { name: "출석 체크 시작" }));
  const close = await screen.findByRole("button", { name: "출석 체크 종료" });
  await waitFor(() => expect(close).toBeEnabled());
  expect(adminAttendanceApi.changeStatus).toHaveBeenCalledWith(4, "ONGOING");
  fireEvent.click(screen.getByRole("button", { name: "QR 생성" }));
  expect(JSON.parse((await screen.findByTestId("attendance-qr")).getAttribute("data-value"))).toEqual({ attendanceId: 4, qrToken: "test-token" });
  fireEvent.click(close);
  await screen.findByRole("button", { name: "수정" });
  expect(adminAttendanceApi.changeStatus).toHaveBeenCalledWith(4, "ENDED");
  expect(screen.queryByTestId("attendance-qr")).not.toBeInTheDocument();
  expect(screen.getByRole("button", { name: "QR 생성" })).toBeDisabled();
});

test("진행 중 출석 상태와 비고는 서버에 저장하고 지각은 전송하지 않는다", async () => {
  summary.status = "ONGOING";
  render(<ManageAttendancePage />);
  await screen.findByText("회원");
  await act(async () => fireEvent.click(screen.getByRole("button", { name: "출석", exact: true })));
  await waitFor(() => expect(adminAttendanceApi.updateParticipant).toHaveBeenCalledWith(4, 8, { status: "PRESENT" }));
  const note = screen.getByLabelText("회원 비고");
  await waitFor(() => expect(note).toBeEnabled());
  fireEvent.change(note, { target: { value: "관리자 확인" } });
  expect(adminAttendanceApi.updateParticipant).toHaveBeenCalledTimes(1);
  await act(async () => fireEvent.blur(note));
  await waitFor(() => expect(adminAttendanceApi.updateParticipant).toHaveBeenCalledWith(4, 8, { note: "관리자 확인" }));
  expect(screen.getByRole("button", { name: "지각" })).toBeDisabled();
});

test("권한 부족 오류와 재시도를 표시한다", async () => {
  adminAttendanceApi.getList.mockRejectedValueOnce({ response: { status: 403 } });
  render(<ManageAttendancePage />);
  expect((await screen.findAllByRole("alert"))[0]).toHaveTextContent("관리자 권한");
  await waitFor(() => expect(screen.getByRole("button", { name: "새로고침" })).toBeEnabled());
  fireEvent.click(screen.getByRole("button", { name: "새로고침" }));
  await screen.findByText("정기 모임");
  expect(adminAttendanceApi.getList).toHaveBeenCalledTimes(2);
});

test("상세 조회 실패 시 빈 명단으로 오인하지 않고 재시도할 수 있다", async () => {
  adminAttendanceApi.getDetail.mockRejectedValueOnce({ response: { status: 404 } });
  render(<ManageAttendancePage />);
  await screen.findByText(/출석 상세를 불러오지 못했습니다/);
  expect(screen.queryByRole("button", { name: "QR 생성" })).not.toBeInTheDocument();
  fireEvent.click(screen.getByRole("button", { name: "새로고침" }));
  await screen.findByRole("button", { name: "출석 체크 시작" });
});

test("늦게 도착한 이전 출석 상세 응답은 새 선택을 덮어쓰지 않는다", async () => {
  const second = { ...summary, attendanceId: 9, title: "다른 모임" };
  adminAttendanceApi.getList.mockResolvedValue({ content: [summary, second] });
  let finishFirst;
  adminAttendanceApi.getDetail.mockImplementation((id) => id === 4
    ? new Promise((resolve) => { finishFirst = resolve; })
    : Promise.resolve({ ...second, participants: { content: [] } }));
  render(<ManageAttendancePage />);
  await waitFor(() => expect(adminAttendanceApi.getDetail).toHaveBeenCalledWith(4));
  fireEvent.click(screen.getByRole("button", { name: /다른 모임/ }));
  await screen.findByRole("button", { name: "출석 체크 시작" });
  await act(async () => finishFirst({ ...summary, participants: { content: participants } }));
  expect(within(screen.getByRole("region", { name: "회원 출석 현황" })).getByRole("heading", { name: "다른 모임" })).toBeInTheDocument();
});

test("서버의 빈 목록과 빈 명단을 처리한다", async () => {
  adminAttendanceApi.getList.mockResolvedValue({ content: [] });
  render(<ManageAttendancePage />);
  await screen.findByText("예정·진행 중인 출석 체크가 없습니다.");
  expect(screen.getByRole("button", { name: "출석체크 생성하기" })).toBeEnabled();
});

test("종료 실패 시 기존 진행 상태와 QR 발급 기능을 유지한다", async () => {
  summary.status = "ONGOING";
  adminAttendanceApi.changeStatus.mockRejectedValue({ response: { status: 403 } });
  render(<ManageAttendancePage />);
  fireEvent.click(await screen.findByRole("button", { name: "출석 체크 종료" }));
  expect(await screen.findByRole("alert")).toHaveTextContent("관리자 권한");
  expect(screen.getByRole("button", { name: "출석 체크 종료" })).toBeEnabled();
  expect(screen.getByRole("button", { name: "QR 생성" })).toBeEnabled();
});

test("종료된 출석 삭제는 서버 성공 후 목록에서 제거한다", async () => {
  summary.status = "ENDED";
  adminAttendanceApi.remove.mockImplementation(async () => {
    adminAttendanceApi.getList.mockResolvedValue({ content: [] });
  });
  render(<ManageAttendancePage />);
  fireEvent.click(await screen.findByRole("button", { name: "삭제" }));
  await waitFor(() => expect(screen.queryByRole("button", { name: "삭제" })).not.toBeInTheDocument());
  expect(adminAttendanceApi.remove).toHaveBeenCalledWith(4);
  await waitFor(() => expect(screen.getByRole("button", { name: "출석체크 생성하기" })).toBeEnabled());
});

test("종료된 명단의 일부만 저장되면 실패와 재시도를 명확히 표시한다", async () => {
  summary.status = "ENDED";
  participants.push({ ...participants[0], userId: 9, userName: "회원2" });
  adminAttendanceApi.updateParticipant.mockResolvedValueOnce({ ...participants[0], status: "PRESENT" })
    .mockRejectedValueOnce({ response: { status: 500 } });
  render(<ManageAttendancePage />);
  fireEvent.click(await screen.findByRole("button", { name: "수정", exact: true }));
  screen.getAllByRole("button", { name: "출석", exact: true }).forEach((button) => fireEvent.click(button));
  fireEvent.click(screen.getByRole("button", { name: "수정내용 저장" }));
  expect(await screen.findByRole("alert")).toHaveTextContent("1명 저장 후 중단");
  await waitFor(() => expect(screen.getByRole("button", { name: "수정내용 저장" })).toBeEnabled());
  expect(adminAttendanceApi.updateParticipant).toHaveBeenCalledTimes(2);
});

test("생성 요청 중 중복 제출을 방지한다", async () => {
  adminAttendanceApi.getList.mockResolvedValue({ content: [] });
  let finish;
  adminAttendanceApi.create.mockReturnValue(new Promise((resolve) => { finish = resolve; }));
  render(<ManageAttendancePage />);
  await waitFor(() => expect(screen.getByRole("button", { name: "출석체크 생성하기" })).toBeEnabled());
  fireEvent.change(screen.getByLabelText("출석체크 명"), { target: { value: "모임" } });
  const form = screen.getByLabelText("출석체크 명").closest("form");
  fireEvent.submit(form);
  fireEvent.submit(form);
  expect(adminAttendanceApi.create).toHaveBeenCalledTimes(1);
  expect(screen.getByRole("button", { name: "생성 중…" })).toBeDisabled();
  await act(async () => finish(summary));
});

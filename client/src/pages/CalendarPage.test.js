import "@testing-library/jest-dom";
import { fireEvent, render, screen } from "@testing-library/react";
import CalendarPage from "./CalendarPage";
import { calendarApi } from "../api/calendar";

jest.mock("react-router-dom", () => ({ useNavigate: () => jest.fn() }));
jest.mock("../api/calendar", () => ({ calendarApi: { getEvents: jest.fn() } }));

beforeEach(() => jest.resetAllMocks());

test("조회 중에는 일정 없음으로 표시하지 않는다", () => {
  calendarApi.getEvents.mockReturnValue(new Promise(() => {}));
  render(<CalendarPage />);
  expect(screen.getByRole("status")).toHaveTextContent("불러오는 중");
  expect(
    screen.queryByText("다가오는 일정이 없습니다."),
  ).not.toBeInTheDocument();
});

test("성공한 빈 응답에만 일정 없음으로 표시한다", async () => {
  calendarApi.getEvents.mockResolvedValue([]);
  render(<CalendarPage />);
  expect(
    await screen.findByText("다가오는 일정이 없습니다."),
  ).toBeInTheDocument();
  expect(screen.queryByRole("status")).not.toBeInTheDocument();
  expect(screen.queryByRole("alert")).not.toBeInTheDocument();
});

test("조회 오류를 안내하고 재시도하면 서버 일정을 표시한다", async () => {
  calendarApi.getEvents
    .mockRejectedValueOnce(new Error("offline"))
    .mockResolvedValueOnce([
      {
        date: "2026-12-01 18:30",
        title: "최종 발표",
        content: "프로젝트 발표\n동아리방",
        target: "전체 회원",
      },
    ]);
  render(<CalendarPage />);
  expect(await screen.findByRole("alert")).toHaveTextContent(
    "일정을 불러오지 못했습니다",
  );
  expect(
    screen.queryByText("다가오는 일정이 없습니다."),
  ).not.toBeInTheDocument();
  fireEvent.click(screen.getByRole("button", { name: "다시 시도" }));
  expect(await screen.findByText("최종 발표")).toBeInTheDocument();
  for (const value of [
    "2026-12-01 18:30",
    "프로젝트 발표",
    "동아리방",
    "#전체 회원",
  ]) {
    expect(screen.getByText(value)).toBeInTheDocument();
  }
  expect(screen.queryByRole("alert")).not.toBeInTheDocument();
  expect(calendarApi.getEvents).toHaveBeenCalledTimes(2);
});

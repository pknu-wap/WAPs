import "@testing-library/jest-dom";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import ManagePlanPage from "./ManagePlanPage";
import { adminPlanApi } from "../../api/admin";

jest.mock("../../api/admin", () => ({
  adminPlanApi: { createEvent: jest.fn() },
}));

beforeEach(() => {
  jest.useFakeTimers().setSystemTime(new Date(2026, 10, 4, 0, 30));
  jest.spyOn(window, "alert").mockImplementation(() => {});
});

afterEach(() => {
  jest.useRealTimers();
  jest.restoreAllMocks();
  jest.clearAllMocks();
});

test("현지 날짜와 시간을 기본값으로 표시하고 선택한 일정을 서버 형식으로 발행한다", async () => {
  adminPlanApi.createEvent.mockResolvedValue({});
  render(<ManagePlanPage />);
  const dateInput = screen.getByLabelText("날짜");
  expect(dateInput).toHaveAttribute("type", "datetime-local");
  expect(dateInput).toHaveValue("2026-11-04T00:30");
  fireEvent.change(dateInput, { target: { value: "2026-11-20T18:30" } });
  expect(screen.getByText("2026-11-20 18:30")).toBeInTheDocument();
  for (const [label, value] of [
    ["제목", "정기 모임"],
    ["내용", "프로젝트 발표"],
    ["필수 참여인원", "전체 회원"],
    ["위치", "동아리방"],
  ]) {
    fireEvent.change(screen.getByLabelText(label), { target: { value } });
  }
  fireEvent.click(screen.getByRole("button", { name: "일정 발행" }));
  await waitFor(() => {
    expect(adminPlanApi.createEvent).toHaveBeenCalledWith({
      title: "정기 모임",
      dateTime: "2026-11-20T18:30:00",
      content: "프로젝트 발표",
      target: "전체 회원",
      location: "동아리방",
    });
    expect(dateInput).toHaveValue("2026-11-04T00:30");
  });
});

test("날짜를 지우면 발행하지 않고 필수 입력 안내를 표시한다", () => {
  render(<ManagePlanPage />);
  fireEvent.change(screen.getByLabelText("날짜"), { target: { value: "" } });
  fireEvent.click(screen.getByRole("button", { name: "일정 발행" }));
  expect(adminPlanApi.createEvent).not.toHaveBeenCalled();
  expect(window.alert).toHaveBeenCalledWith("항목을 모두 입력해 주세요.");
});

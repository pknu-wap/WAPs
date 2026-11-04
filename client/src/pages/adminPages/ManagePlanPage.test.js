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
  const hourInput = screen.getByRole("combobox", { name: "시" });
  const minuteInput = screen.getByRole("combobox", { name: "분" });
  expect(screen.getByRole("group", { name: "일정" })).toBeInTheDocument();
  expect(dateInput).toHaveAttribute("type", "date");
  expect(Array.from(hourInput.options, (option) => option.value)).toEqual(
    Array.from({ length: 24 }, (_, hour) => String(hour).padStart(2, "0")),
  );
  expect(hourInput).toHaveValue("00");
  expect(minuteInput).toHaveValue("30");
  expect(dateInput).toHaveValue("2026-11-04");
  fireEvent.change(dateInput, { target: { value: "2026-11-20" } });
  expect(hourInput).toHaveValue("00");
  expect(minuteInput).toHaveValue("30");
  fireEvent.change(hourInput, { target: { value: "23" } });
  expect(minuteInput).toHaveValue("30");
  fireEvent.change(minuteInput, { target: { value: "59" } });
  expect(screen.getByText("2026-11-20 23:59")).toBeInTheDocument();
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
      dateTime: "2026-11-20T23:59:00",
      content: "프로젝트 발표",
      target: "전체 회원",
      location: "동아리방",
    });
    expect(dateInput).toHaveValue("2026-11-04");
    expect(hourInput).toHaveValue("00");
    expect(minuteInput).toHaveValue("30");
  });
});

test.each(["날짜"])(
  "%s을 지우면 발행하지 않고 필수 입력 안내를 표시한다",
  (label) => {
    render(<ManagePlanPage />);
    for (const field of ["제목", "내용", "필수 참여인원", "위치"]) {
      fireEvent.change(screen.getByLabelText(field), {
        target: { value: "테스트" },
      });
    }
    fireEvent.change(screen.getByLabelText(label), { target: { value: "" } });
    fireEvent.click(screen.getByRole("button", { name: "일정 발행" }));
    expect(adminPlanApi.createEvent).not.toHaveBeenCalled();
    expect(window.alert).toHaveBeenCalledWith("항목을 모두 입력해 주세요.");
  },
);

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

test("오늘 날짜와 18시 30분을 기본값으로 표시하고 선택한 일정을 서버 형식으로 발행한다", async () => {
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
  expect(hourInput).toHaveValue("18");
  expect(minuteInput).toHaveValue("30");
  expect(dateInput).toHaveValue("2026-11-04");
  fireEvent.change(dateInput, { target: { value: "2026-11-20" } });
  expect(hourInput).toHaveValue("18");
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
    expect(hourInput).toHaveValue("18");
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

const fillEvent = () => {
  for (const [label, value] of [
    ["제목", " 정기 모임 "],
    ["내용", " 프로젝트 발표 "],
    ["필수 참여인원", " 전체 회원 "],
    ["위치", " 동아리방 "],
  ]) {
    fireEvent.change(screen.getByLabelText(label), { target: { value } });
  }
};

test("잘못된 서버 오류 메시지 형식은 기본 안내로 대체한다", async () => {
  adminPlanApi.createEvent.mockRejectedValueOnce({ response: { data: { message: { code: "ERROR" } } } });
  render(<ManagePlanPage />);
  fillEvent();
  fireEvent.click(screen.getByRole("button", { name: "일정 발행" }));
  await waitFor(() => expect(window.alert).toHaveBeenCalledWith("일정 등록 중 오류가 발생했습니다. 다시 시도해주세요."));
  expect(screen.getByLabelText("제목")).toHaveValue(" 정기 모임 ");
});

test("발행 중 중복 요청과 입력 변경을 막고 정리한 값을 전송한다", async () => {
  let complete;
  adminPlanApi.createEvent.mockImplementation(
    () =>
      new Promise((resolve) => {
        complete = resolve;
      }),
  );
  render(<ManagePlanPage />);
  fillEvent();
  const publish = screen.getByRole("button", { name: "일정 발행" });
  fireEvent.click(publish);
  fireEvent.click(publish);
  expect(adminPlanApi.createEvent).toHaveBeenCalledTimes(1);
  expect(adminPlanApi.createEvent).toHaveBeenCalledWith({
    title: "정기 모임",
    content: "프로젝트 발표",
    target: "전체 회원",
    location: "동아리방",
    dateTime: "2026-11-04T18:30:00",
  });
  expect(publish).toBeDisabled();
  for (const label of [
    "제목",
    "내용",
    "필수 참여인원",
    "위치",
    "날짜",
    "시",
    "분",
  ]) {
    expect(screen.getByLabelText(label)).toBeDisabled();
  }
  complete();
  await waitFor(() => expect(publish).toBeEnabled());
  expect(screen.getByLabelText("제목")).toHaveValue("");
});

test("발행 실패는 서버 오류를 표시하고 입력을 보존해 재시도한다", async () => {
  adminPlanApi.createEvent
    .mockRejectedValueOnce({
      response: { data: { message: "일정 등록 권한이 없습니다." } },
    })
    .mockResolvedValueOnce({});
  render(<ManagePlanPage />);
  fillEvent();
  fireEvent.click(screen.getByRole("button", { name: "일정 발행" }));
  await waitFor(() =>
    expect(window.alert).toHaveBeenCalledWith("일정 등록 권한이 없습니다."),
  );
  expect(screen.getByLabelText("제목")).toHaveValue(" 정기 모임 ");
  fireEvent.click(screen.getByRole("button", { name: "일정 발행" }));
  await waitFor(() => expect(screen.getByLabelText("제목")).toHaveValue(""));
  expect(adminPlanApi.createEvent).toHaveBeenCalledTimes(2);
  expect(adminPlanApi.createEvent.mock.calls[1]).toEqual(
    adminPlanApi.createEvent.mock.calls[0],
  );
});

test.each(["제목", "내용", "필수 참여인원", "위치"])(
  "%s이 공백뿐이면 요청하지 않는다",
  (label) => {
    render(<ManagePlanPage />);
    fillEvent();
    fireEvent.change(screen.getByLabelText(label), {
      target: { value: "   " },
    });
    fireEvent.click(screen.getByRole("button", { name: "일정 발행" }));
    expect(adminPlanApi.createEvent).not.toHaveBeenCalled();
    expect(window.alert).toHaveBeenCalledWith("항목을 모두 입력해 주세요.");
  },
);

test.each([
  ["제목", 30],
  ["내용", 2000],
  ["필수 참여인원", 30],
  ["위치", 30],
])("%s의 서버 길이 제한을 검사한다", (label, limit) => {
  render(<ManagePlanPage />);
  fillEvent();
  expect(screen.getByLabelText(label)).toHaveAttribute(
    "maxlength",
    String(limit),
  );
  fireEvent.change(screen.getByLabelText(label), {
    target: { value: "가".repeat(limit + 1) },
  });
  fireEvent.click(screen.getByRole("button", { name: "일정 발행" }));
  expect(adminPlanApi.createEvent).not.toHaveBeenCalled();
  expect(window.alert).toHaveBeenCalledWith(
    "제목, 참여인원, 위치는 30자, 내용은 2000자 이내로 입력해 주세요.",
  );
});

import "@testing-library/jest-dom";
import {
  act,
  fireEvent,
  render,
  screen,
  waitFor,
  within,
} from "@testing-library/react";
import ManageVotePage from "./ManageVotePage";
import { adminVoteApi } from "../../api/admin";
import { projectApi } from "../../api/project";

jest.mock("../../api/admin", () => ({
  adminVoteApi: {
    getStatus: jest.fn(),
    getResults: jest.fn(),
    getIsVoteOpen: jest.fn(),
    setPublicStatus: jest.fn(),
    reopen: jest.fn(),
    close: jest.fn(),
  },
}));
jest.mock("../../api/project", () => ({
  projectApi: { getProjectList: jest.fn() },
}));

beforeEach(() => {
  jest.clearAllMocks();
  adminVoteApi.getResults.mockResolvedValue([]);
  adminVoteApi.getIsVoteOpen.mockResolvedValue({ isPublic: true });
});

afterEach(() => {
  jest.restoreAllMocks();
  jest.useRealTimers();
});

const results = [
  { projectId: 1, projectName: "첫 프로젝트", voteCount: 0, voteRate: 0 },
  {
    projectId: 2,
    projectName: "두 번째 프로젝트",
    voteCount: 3,
    voteRate: 100,
  },
];

test("진행 중 득표 현황과 0표 프로젝트를 표시하고 수동 갱신한다", async () => {
  adminVoteApi.getStatus.mockResolvedValue({ status: "VOTING" });
  adminVoteApi.getResults.mockResolvedValue(results);
  render(<ManageVotePage />);
  expect(
    await screen.findByText("총 3표 · 참여 프로젝트 2개"),
  ).toBeInTheDocument();
  const rows = screen.getAllByRole("row");
  expect(within(rows[1]).getByText("두 번째 프로젝트")).toBeInTheDocument();
  expect(within(rows[2]).getAllByRole("cell")[2]).toHaveTextContent("0");
  expect(adminVoteApi.getIsVoteOpen).not.toHaveBeenCalled();
  adminVoteApi.getResults.mockResolvedValue([
    { ...results[0], voteCount: 3, voteRate: 50 },
    { ...results[1], voteRate: 50 },
  ]);
  fireEvent.click(screen.getByRole("button", { name: "현황 새로고침" }));
  expect(
    await screen.findByText("총 6표 · 참여 프로젝트 2개"),
  ).toBeInTheDocument();
  expect(adminVoteApi.setPublicStatus).not.toHaveBeenCalled();
});

test("최초 조회 실패를 0표로 표시하지 않고 화면에서 재시도한다", async () => {
  adminVoteApi.getStatus.mockResolvedValue({ status: "VOTING" });
  adminVoteApi.getResults.mockRejectedValueOnce(new Error("offline"));
  render(<ManageVotePage />);
  expect(await screen.findByRole("alert")).toHaveTextContent(
    "투표 현황을 불러오지 못했습니다",
  );
  expect(screen.queryByRole("table")).not.toBeInTheDocument();
  expect(screen.getByRole("button", { name: "투표 종료" })).toBeEnabled();
  adminVoteApi.getResults.mockResolvedValue([{ ...results[0] }]);
  fireEvent.click(screen.getByRole("button", { name: "현황 새로고침" }));
  expect(
    await screen.findByText("총 0표 · 참여 프로젝트 1개"),
  ).toBeInTheDocument();
  expect(screen.queryByRole("alert")).not.toBeInTheDocument();
});

test("자동 갱신 실패 시 이전 집계를 보존하고 화면 이탈 시 갱신을 중단한다", async () => {
  jest.useFakeTimers();
  adminVoteApi.getStatus.mockResolvedValue({ status: "VOTING" });
  adminVoteApi.getResults.mockResolvedValue(results);
  const { unmount } = render(<ManageVotePage />);
  await screen.findByText("총 3표 · 참여 프로젝트 2개");
  adminVoteApi.getResults.mockRejectedValueOnce(new Error("offline"));
  await act(async () => jest.advanceTimersByTime(30000));
  expect(adminVoteApi.getResults).toHaveBeenCalledTimes(2);
  expect(screen.getByRole("alert")).toHaveTextContent("마지막으로 조회한 현황");
  expect(screen.getByText("총 3표 · 참여 프로젝트 2개")).toBeInTheDocument();
  await act(async () => jest.advanceTimersByTime(30000));
  expect(adminVoteApi.getResults).toHaveBeenCalledTimes(3);
  expect(screen.queryByRole("alert")).not.toBeInTheDocument();
  unmount();
  await act(async () => jest.advanceTimersByTime(60000));
  expect(adminVoteApi.getResults).toHaveBeenCalledTimes(3);
});

test("투표 종료 후 늦게 도착한 진행 중 집계가 최종 결과를 덮어쓰지 않는다", async () => {
  jest.useFakeTimers();
  adminVoteApi.getStatus.mockResolvedValue({ status: "VOTING" });
  let resolveOld;
  adminVoteApi.getResults.mockImplementationOnce(
    () =>
      new Promise((resolve) => {
        resolveOld = resolve;
      }),
  );
  adminVoteApi.close.mockResolvedValue();
  adminVoteApi.setPublicStatus.mockResolvedValue();
  render(<ManageVotePage />);
  fireEvent.click(await screen.findByRole("button", { name: "투표 종료" }));
  await screen.findByText("총 0표 · 참여 프로젝트 0개");
  await act(async () => resolveOld(results));
  expect(screen.queryByText("첫 프로젝트")).not.toBeInTheDocument();
  await act(async () => jest.advanceTimersByTime(60000));
  expect(adminVoteApi.getResults).toHaveBeenCalledTimes(2);
});

test("종료된 투표를 다시 열면 요청 중 중복 실행을 막고 진행 중 화면으로 전환한다", async () => {
  adminVoteApi.getStatus.mockResolvedValue({ status: "ENDED" });
  jest.spyOn(window, "confirm").mockReturnValue(true);
  let resolveReopen;
  adminVoteApi.reopen.mockImplementation(
    () =>
      new Promise((resolve) => {
        resolveReopen = resolve;
      }),
  );
  render(<ManageVotePage />);
  fireEvent.click(
    await screen.findByRole("button", { name: "투표 다시 열기" }),
  );
  expect(
    screen.getByRole("button", { name: "다시 여는 중..." }),
  ).toBeDisabled();
  expect(adminVoteApi.reopen).toHaveBeenCalledTimes(1);
  expect(screen.getByRole("button", { name: "공개" })).toBeDisabled();
  expect(screen.getByRole("button", { name: "비공개" })).toBeDisabled();
  expect(adminVoteApi.reopen).toHaveBeenCalledWith(
    expect.stringMatching(/^\d{4}-0[12]$/),
  );
  expect(projectApi.getProjectList).not.toHaveBeenCalled();
  await act(async () => resolveReopen());
  expect(
    await screen.findByRole("button", { name: "투표 종료" }),
  ).toBeEnabled();
  expect(screen.getByRole("button", { name: "공개" })).toBeDisabled();
});

test("다시 열기를 취소하면 요청하지 않는다", async () => {
  adminVoteApi.getStatus.mockResolvedValue({ status: "ENDED" });
  jest.spyOn(window, "confirm").mockReturnValue(false);
  render(<ManageVotePage />);
  fireEvent.click(
    await screen.findByRole("button", { name: "투표 다시 열기" }),
  );
  expect(adminVoteApi.reopen).not.toHaveBeenCalled();
  await waitFor(() =>
    expect(screen.getByRole("button", { name: "비공개" })).toBeEnabled(),
  );
});

test("결과 공개 변경 중에는 투표를 다시 열 수 없다", async () => {
  adminVoteApi.getStatus.mockResolvedValue({ status: "ENDED" });
  let resolveVisibility;
  adminVoteApi.setPublicStatus.mockImplementation(
    () =>
      new Promise((resolve) => {
        resolveVisibility = resolve;
      }),
  );
  render(<ManageVotePage />);
  await waitFor(() =>
    expect(screen.getByRole("button", { name: "비공개" })).toBeEnabled(),
  );
  fireEvent.click(screen.getByRole("button", { name: "비공개" }));
  expect(
    screen.getByRole("button", { name: "다시 여는 중..." }),
  ).toBeDisabled();
  await act(async () => resolveVisibility());
  expect(screen.getByRole("button", { name: "투표 다시 열기" })).toBeEnabled();
});

test("다시 열기 실패 후 종료 상태에서 재시도할 수 있다", async () => {
  adminVoteApi.getStatus.mockResolvedValue({ status: "ENDED" });
  jest.spyOn(window, "confirm").mockReturnValue(true);
  const alert = jest.spyOn(window, "alert").mockImplementation(() => {});
  adminVoteApi.reopen.mockRejectedValueOnce(new Error("network"));
  render(<ManageVotePage />);
  fireEvent.click(
    await screen.findByRole("button", { name: "투표 다시 열기" }),
  );
  await waitFor(() => expect(alert).toHaveBeenCalled());
  expect(screen.getByRole("button", { name: "투표 다시 열기" })).toBeEnabled();
  expect(screen.getByRole("button", { name: "공개" })).toBeDisabled();
});

test("프로젝트 선택 상태가 바뀌어도 키보드 포커스를 유지한다", async () => {
  adminVoteApi.getStatus.mockResolvedValue({ status: "NOT_CREATED" });
  projectApi.getProjectList.mockResolvedValue({
    projectsResponse: [{ projectId: 1, title: "WAPs", thumbnail: "test.png" }],
  });
  render(<ManageVotePage />);
  const project = await screen.findByRole("button", { name: "WAPs 선택됨" });
  project.focus();
  fireEvent.click(project);
  expect(screen.getByRole("button", { name: "WAPs 선택 안 됨" })).toHaveFocus();
  expect(project).toHaveAttribute("aria-pressed", "false");
  fireEvent.click(project);
  expect(project).toHaveAttribute("aria-pressed", "true");
});

test("투표 중에는 결과 공개 버튼을 사용할 수 없다", async () => {
  adminVoteApi.getStatus.mockResolvedValue({ status: "VOTING" });
  render(<ManageVotePage />);
  expect(await screen.findByRole("button", { name: "공개" })).toBeDisabled();
  expect(screen.getByRole("button", { name: "비공개" })).toBeDisabled();
});

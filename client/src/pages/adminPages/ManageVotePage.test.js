import "@testing-library/jest-dom";
import {
  act,
  fireEvent,
  render,
  screen,
  waitFor,
} from "@testing-library/react";
import ManageVotePage from "./ManageVotePage";
import { adminVoteApi } from "../../api/admin";
import { projectApi } from "../../api/project";

jest.mock("../../api/admin", () => ({
  adminVoteApi: {
    getStatus: jest.fn(),
    getResults: jest.fn(),
    getIsVoteOpen: jest.fn(),
    reopen: jest.fn(),
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

afterEach(() => jest.restoreAllMocks());

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

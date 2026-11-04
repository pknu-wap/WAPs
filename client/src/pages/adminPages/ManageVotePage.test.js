import "@testing-library/jest-dom";
import { fireEvent, render, screen } from "@testing-library/react";
import ManageVotePage from "./ManageVotePage";
import { adminVoteApi } from "../../api/admin";
import { projectApi } from "../../api/project";

jest.mock("../../api/admin", () => ({
  adminVoteApi: { getStatus: jest.fn() },
}));
jest.mock("../../api/project", () => ({
  projectApi: { getProjectList: jest.fn() },
}));

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

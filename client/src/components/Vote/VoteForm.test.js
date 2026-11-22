import "@testing-library/jest-dom";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import VoteForm from "./VoteForm";
import apiClient from "../../api/client";

const mockNavigate = jest.fn();
jest.mock("react-router-dom", () => ({ useNavigate: () => mockNavigate }));
jest.mock("../../api/client", () => ({ get: jest.fn(), post: jest.fn() }));

const projects = [1, 2, 3, 4].map((id) => ({
  participants: id,
  title: `프로젝트 ${id}`,
  summary: `설명 ${id}`,
}));

beforeEach(() => {
  jest.clearAllMocks();
  jest.spyOn(window, "alert").mockImplementation(() => {});
  apiClient.get.mockImplementation((url) => {
    if (url === "/project/semester/current")
      return Promise.resolve({ semester: "2030-01" });
    if (url === "/vote/2030-01/projects") return Promise.resolve(projects);
    if (url === "/user/vote/2030-01")
      return Promise.resolve({ projectIds: [1, 2, 3] });
    return Promise.reject(new Error(`Unexpected URL: ${url}`));
  });
});
afterEach(() => jest.restoreAllMocks());

test("서버 학기로 목록과 내 투표를 조회하고 응답 본문의 선택을 복원한다", async () => {
  render(<VoteForm isVotedUser />);
  const card = await screen.findByText("프로젝트 1");
  expect(card.closest(".project_list_box")).toHaveClass("selected");
  expect(
    screen.getByText("프로젝트 4").closest(".project_list_box"),
  ).not.toHaveClass("selected");
  expect(apiClient.get).toHaveBeenCalledWith("/user/vote/2030-01");
  expect(
    screen.queryByRole("button", { name: "투표 완료" }),
  ).not.toBeInTheDocument();
  expect(window.alert).not.toHaveBeenCalled();
});

test("조회 실패 시 제출을 막고 재시도 후 목록을 표시한다", async () => {
  apiClient.get.mockRejectedValueOnce(new Error("offline"));
  render(<VoteForm isVotedUser={false} />);
  expect(await screen.findByRole("alert")).toHaveTextContent(
    "투표 정보를 불러오지 못했습니다",
  );
  expect(screen.getByRole("button", { name: "투표 완료" })).toBeDisabled();
  fireEvent.click(screen.getByRole("button", { name: "다시 시도" }));
  expect(await screen.findByText("프로젝트 1")).toBeInTheDocument();
  expect(screen.queryByRole("alert")).not.toBeInTheDocument();
});

test("빈 참여 목록을 로딩과 구분하고 제출을 막는다", async () => {
  apiClient.get
    .mockResolvedValueOnce({ semester: "2030-01" })
    .mockResolvedValueOnce([]);
  render(<VoteForm isVotedUser={false} />);
  expect(
    await screen.findByText("투표에 참여하는 프로젝트가 없습니다."),
  ).toBeInTheDocument();
  expect(screen.getByRole("button", { name: "투표 완료" })).toBeDisabled();
});

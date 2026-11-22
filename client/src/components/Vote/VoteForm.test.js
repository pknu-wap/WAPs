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

async function selectProjects() {
  await screen.findByText("프로젝트 1");
  [1, 2, 3].forEach((id) =>
    fireEvent.click(screen.getByText(`프로젝트 ${id}`)),
  );
}

test("제출 중 중복 요청과 선택 변경을 막고 서버 학기로 한 번 제출한다", async () => {
  let complete;
  apiClient.post.mockImplementation(
    () =>
      new Promise((resolve) => {
        complete = resolve;
      }),
  );
  render(<VoteForm isVotedUser={false} />);
  await selectProjects();
  const submit = screen.getByRole("button", { name: "투표 완료" });
  fireEvent.click(submit);
  fireEvent.click(submit);
  fireEvent.click(screen.getByText("프로젝트 1"));
  expect(submit).toBeDisabled();
  expect(
    screen.getByText("프로젝트 1").closest(".project_list_box"),
  ).toHaveClass("selected");
  expect(apiClient.post).toHaveBeenCalledTimes(1);
  expect(apiClient.post).toHaveBeenCalledWith("/vote", {
    projectIds: [1, 2, 3],
    semester: "2030-01",
  });
  complete();
  await waitFor(() =>
    expect(mockNavigate).toHaveBeenCalledWith("/ProjectPage"),
  );
  expect(mockNavigate).toHaveBeenCalledTimes(1);
});

test.each([
  [
    {
      response: { status: 409, data: { message: "이미 투표한 사용자입니다." } },
      request: {},
    },
    "이미 투표한 사용자입니다.",
  ],
  [
    { response: { status: 403 }, request: {} },
    "투표 요청이 거절되었습니다. 투표 상태를 확인하고 다시 시도해주세요.",
  ],
  [{ request: {} }, "서버 응답이 없습니다. 나중에 다시 시도해주세요."],
])(
  "제출 실패 시 오류를 구분하고 선택을 보존해 재시도한다 (%j)",
  async (failure, message) => {
    apiClient.post
      .mockRejectedValueOnce(failure)
      .mockResolvedValueOnce(undefined);
    render(<VoteForm isVotedUser={false} />);
    await selectProjects();
    fireEvent.click(screen.getByRole("button", { name: "투표 완료" }));
    await waitFor(() => expect(window.alert).toHaveBeenCalledWith(message));
    expect(mockNavigate).not.toHaveBeenCalled();
    expect(
      screen.getByText("프로젝트 1").closest(".project_list_box"),
    ).toHaveClass("selected");
    fireEvent.click(screen.getByRole("button", { name: "투표 완료" }));
    await waitFor(() => expect(apiClient.post).toHaveBeenCalledTimes(2));
    expect(apiClient.post.mock.calls[1]).toEqual(apiClient.post.mock.calls[0]);
  },
);

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

import "@testing-library/jest-dom";
import { fireEvent, render, screen } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import VoteResultPage from "./VoteResultPage";
import { voteApi } from "../api/vote";

jest.mock("../api/vote", () => ({ voteApi: { getVoteResult: jest.fn() } }));
jest.mock("../components/Header", () => () => null);
jest.mock("../components/Menu", () => () => null);
jest.mock("../components/FloatingButton", () => () => null);

test.each([
  [403, "해당 학기 투표 결과는 아직 공개되지 않았습니다."],
  [404, "해당 학기 투표 결과는 아직 공개되지 않았습니다."],
  [400, "투표 결과를 가져오는데 실패했습니다."],
  [500, "투표 결과를 가져오는데 실패했습니다."],
  [undefined, "투표 결과를 가져오는데 실패했습니다."],
])("결과 조회 실패(%s)를 올바르게 안내한다", async (status, message) => {
  voteApi.getVoteResult.mockRejectedValue({ response: status ? { status } : undefined });
  render(
    <MemoryRouter initialEntries={["/vote/result/2026-02"]}>
      <Routes>
        <Route path="/vote/result/:semesterParam" element={<VoteResultPage />} />
      </Routes>
    </MemoryRouter>,
  );
  expect(await screen.findByText(message)).toBeInTheDocument();
  expect(voteApi.getVoteResult).toHaveBeenCalledWith("2026-02");
});

test("결과 제목을 표시하고 상단 필터에서 다른 학기를 선택한다", async () => {
  voteApi.getVoteResult.mockResolvedValue({ results: [] });
  render(
    <MemoryRouter initialEntries={["/vote/result/2026-02"]}>
      <Routes>
        <Route path="/vote/result/:semesterParam" element={<VoteResultPage />} />
      </Routes>
    </MemoryRouter>,
  );

  expect(screen.getByRole("heading", { level: 1, name: "VOTING RESULTS" })).toBeVisible();
  fireEvent.click(screen.getByRole("button", { name: /26년 2학기/, expanded: false }));
  fireEvent.click(screen.getByRole("button", { name: "25-1" }));
  expect(await screen.findByRole("button", { name: /25년 1학기/, expanded: false })).toBeVisible();
  expect(voteApi.getVoteResult).toHaveBeenLastCalledWith("2025-01");
});

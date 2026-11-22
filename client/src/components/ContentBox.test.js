import { act, fireEvent, render, screen, waitFor } from "@testing-library/react";
import "@testing-library/jest-dom";
import { MemoryRouter } from "react-router-dom";
import ContentBox from "./ContentBox";
import { projectApi } from "../api/project";

jest.mock("../api/project", () => ({ projectApi: { getProjectList: jest.fn() } }));
jest.mock("../hooks/useSemester", () => () => "2025-02");
const projects = [
  { projectId: 1, title: "WAP Web", projectType: "Web" },
  { projectId: 2, title: "WAP App", projectType: "App" },
];
beforeEach(() => {
  jest.resetAllMocks();
  projectApi.getProjectList.mockResolvedValue({ projectsResponse: projects });
});
const open = () => render(<MemoryRouter><ContentBox /></MemoryRouter>);

test("검색어의 앞뒤 공백과 대소문자를 무시하고 유형 필터를 함께 적용한다", async () => {
  open();
  await screen.findByRole("heading", { name: "WAP Web" });
  fireEvent.change(screen.getByLabelText("project title search"), { target: { value: "  wAp  " } });
  expect(screen.getByRole("heading", { name: "WAP Web" })).toBeInTheDocument();
  expect(screen.getByRole("heading", { name: "WAP App" })).toBeInTheDocument();
  fireEvent.click(screen.getByRole("tab", { name: "앱" }));
  expect(screen.queryByRole("heading", { name: "WAP Web" })).not.toBeInTheDocument();
  expect(screen.getByRole("heading", { name: "WAP App" })).toBeInTheDocument();
});

test("검색 결과가 없으면 안내하고 검색어를 지우면 목록을 복원한다", async () => {
  open();
  await screen.findByRole("heading", { name: "WAP Web" });
  const input = screen.getByLabelText("project title search");
  fireEvent.change(input, { target: { value: "없는 제목" } });
  expect(screen.getByText("조건에 맞는 프로젝트가 없어요")).toBeInTheDocument();
  fireEvent.change(input, { target: { value: "" } });
  expect(screen.getByRole("heading", { name: "WAP Web" })).toBeInTheDocument();
});

test("이전 학기의 늦은 응답이 최신 학기 검색 결과를 덮지 않는다", async () => {
  open();
  await screen.findByRole("heading", { name: "WAP Web" });
  let finishOld;
  projectApi.getProjectList.mockImplementation((semester) => semester === "2025-01"
    ? new Promise((resolve) => { finishOld = resolve; })
    : Promise.resolve({ projectsResponse: [{ ...projects[0], title: "최신 프로젝트" }] }));
  fireEvent.click(screen.getByRole("button", { name: /25년 2학기/ }));
  fireEvent.click(screen.getByRole("button", { name: "25-1" }));
  await waitFor(() => expect(projectApi.getProjectList).toHaveBeenLastCalledWith("2025-01"));
  fireEvent.click(screen.getByRole("button", { name: /25년 1학기/ }));
  fireEvent.click(screen.getByRole("button", { name: "25-2" }));
  await screen.findByRole("heading", { name: "최신 프로젝트" });
  await act(async () => finishOld({ projectsResponse: [{ ...projects[0], title: "이전 프로젝트" }] }));
  expect(screen.getByRole("heading", { name: "최신 프로젝트" })).toBeInTheDocument();
  expect(screen.queryByRole("heading", { name: "이전 프로젝트" })).not.toBeInTheDocument();
});

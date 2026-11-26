import "@testing-library/jest-dom";
import { act, fireEvent, render, screen } from "@testing-library/react";
import { Link, MemoryRouter, Route, Routes } from "react-router-dom";
import ProjectCreatePage from "./ProjectCreatePage";
import { projectApi } from "../api/project";
import authStorage from "../utils/authStorage";

jest.mock("../api/project", () => ({
  projectApi: { getprojectUpdatePage: jest.fn() },
}));
jest.mock("../utils/authStorage", () => ({ get: jest.fn() }));
jest.mock("../components/Header", () => () => null);
jest.mock("../components/Menu", () => () => null);
jest.mock("../components/FloatingButton", () => () => null);
jest.mock("../components/LoadingPage", () => () => <p>Loading</p>);
jest.mock(
  "../components/ProjectCreation/ProjectFormNew",
  () =>
    ({ existingProject }) => (
      <div data-testid="project-form">
        {existingProject?.title || "새 프로젝트"}
      </div>
    ),
);

const openPage = () =>
  render(
    <MemoryRouter initialEntries={["/project/edit/10"]}>
      <Link to="/project/edit/20">다른 프로젝트</Link>
      <Routes>
        <Route
          path="/project/edit/:projectId"
          element={<ProjectCreatePage />}
        />
        <Route path="/login" element={<p>로그인 화면</p>} />
      </Routes>
    </MemoryRouter>,
  );

beforeEach(() => {
  jest.resetAllMocks();
  authStorage.get.mockReturnValue("token");
  jest.spyOn(window, "alert").mockImplementation(() => {});
});
afterEach(() => jest.restoreAllMocks());

test("원본 조회 중에는 수정 폼을 표시하지 않는다", () => {
  projectApi.getprojectUpdatePage.mockReturnValue(new Promise(() => {}));
  openPage();
  expect(screen.getByText("Loading")).toBeInTheDocument();
  expect(screen.queryByTestId("project-form")).not.toBeInTheDocument();
});

test.each([403, 404, 500])(
  "원본 조회 실패(%s)는 폼 대신 재시도를 제공한다",
  async (status) => {
    projectApi.getprojectUpdatePage
      .mockRejectedValueOnce({ response: { status } })
      .mockResolvedValueOnce({ title: "원본 프로젝트" });
    openPage();
    expect(await screen.findByRole("alert")).toHaveTextContent(
      "프로젝트 정보를 불러오지 못했습니다",
    );
    expect(screen.queryByTestId("project-form")).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "다시 시도" }));
    expect(await screen.findByText("원본 프로젝트")).toBeInTheDocument();
    expect(projectApi.getprojectUpdatePage).toHaveBeenNthCalledWith(2, "10");
  },
);

test("다른 프로젝트로 이동하면 늦게 도착한 이전 응답을 무시한다", async () => {
  let finishOldRequest;
  projectApi.getprojectUpdatePage.mockImplementation((id) =>
    id === "10"
      ? new Promise((resolve) => {
          finishOldRequest = resolve;
        })
      : Promise.resolve({ title: "새 수정 대상" }),
  );
  openPage();
  fireEvent.click(screen.getByRole("link", { name: "다른 프로젝트" }));
  expect(await screen.findByText("새 수정 대상")).toBeInTheDocument();
  await act(async () => {
    finishOldRequest({ title: "이전 수정 대상" });
  });
  expect(screen.getByTestId("project-form")).toHaveTextContent("새 수정 대상");
});

test("비로그인은 원본 API를 호출하지 않고 로그인으로 이동한다", async () => {
  authStorage.get.mockReturnValue(undefined);
  openPage();
  expect(await screen.findByText("로그인 화면")).toBeInTheDocument();
  expect(projectApi.getprojectUpdatePage).not.toHaveBeenCalled();
  expect(window.alert).toHaveBeenCalledTimes(1);
});

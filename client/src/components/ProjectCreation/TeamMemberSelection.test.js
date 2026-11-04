import React from "react";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import ProjectFormNew from "./ProjectFormNew";
import { projectApi } from "../../api/project";

jest.mock("../../api/project", () => ({
  projectApi: {
    getCurrentSemester: jest.fn(),
    getMemberOptions: jest.fn(),
    createProject: jest.fn(),
    updateProject: jest.fn(),
  },
}));
jest.mock("./ImageUploader", () => () => null);
jest.mock("./TechStackSelector", () => () => null);
jest.mock("./InputPin", () => ({ setPassword }) => (
  <input aria-label="비밀번호" onChange={(e) => setPassword(e.target.value)} />
));

const members = [
  { userId: 1, memberName: "김회원" },
  { userId: 2, memberName: "김회원" },
  { userId: 3, memberName: "이회원" },
];
beforeEach(() => {
  jest.clearAllMocks();
  jest.spyOn(window, "alert").mockImplementation(() => {});
  projectApi.getMemberOptions.mockResolvedValue(members);
  projectApi.getCurrentSemester.mockResolvedValue({ semester: "2026-02" });
  projectApi.updateProject.mockResolvedValue({});
});
afterEach(() => jest.restoreAllMocks());

const renderForm = (teamMember = []) =>
  render(
    <MemoryRouter>
      <ProjectFormNew
        isEdit
        existingProject={{ semester: "2026-02", teamMember }}
      />
    </MemoryRouter>,
  );
const submit = async () => {
  fireEvent.change(screen.getByLabelText("비밀번호"), {
    target: { value: "pw" },
  });
  fireEvent.click(screen.getByRole("button", { name: "프로젝트 수정" }));
  await waitFor(() =>
    expect(screen.queryByRole("button", { name: "업로드 중..." })).toBeNull(),
  );
};
const readProject = (data) =>
  new Promise((resolve) => {
    const reader = new FileReader();
    reader.onload = () => resolve(JSON.parse(reader.result));
    reader.readAsText(data.get("project"));
  });

test("동명이인을 ID로 선택하고 중복 후보와 빈 행을 제외해 저장한다", async () => {
  renderForm();
  await screen.findByRole("option", { name: "김회원 (#2)" });
  fireEvent.change(screen.getByLabelText("팀원 1 검색"), {
    target: { value: "김" },
  });
  expect(screen.queryByRole("option", { name: "이회원 (#3)" })).toBeNull();
  fireEvent.change(screen.getByLabelText("팀원 1 선택"), {
    target: { value: "2" },
  });
  fireEvent.change(screen.getByLabelText("팀원 1 역할"), {
    target: { value: "Server" },
  });
  fireEvent.click(screen.getByRole("button", { name: "등록" }));
  expect(
    Array.from(screen.getByLabelText("팀원 2 선택").options).map(
      (o) => o.value,
    ),
  ).not.toContain("2");
  await submit();
  expect(projectApi.updateProject).toHaveBeenCalledTimes(1);
  expect(
    (await readProject(projectApi.updateProject.mock.calls[0][1])).teamMember,
  ).toEqual([{ userId: 2, memberRole: "Server" }]);
});

test("검색어만 입력해서는 팀원을 등록할 수 없다", async () => {
  renderForm();
  await screen.findByRole("option", { name: "김회원 (#1)" });
  fireEvent.change(screen.getByLabelText("팀원 1 검색"), {
    target: { value: "없는이름" },
  });
  fireEvent.change(screen.getByLabelText("팀원 1 역할"), {
    target: { value: "PM" },
  });
  expect(screen.getByRole("button", { name: "등록" }).disabled).toBe(true);
  await submit();
  expect(projectApi.updateProject).not.toHaveBeenCalled();
});

test("기존 이름만 있는 팀원은 재선택해야 하며 삭제할 수 있다", async () => {
  renderForm([{ memberName: "옛회원", memberRole: "PM" }]);
  await screen.findByText("옛회원: 회원을 다시 선택해 주세요.");
  await submit();
  expect(projectApi.updateProject).not.toHaveBeenCalled();
  fireEvent.click(screen.getByLabelText("팀원 1 삭제"));
  await submit();
  expect(
    (await readProject(projectApi.updateProject.mock.calls[0][1])).teamMember,
  ).toEqual([]);
});

test("회원 조회 실패 시 재시도할 수 있다", async () => {
  projectApi.getMemberOptions.mockRejectedValueOnce(new Error("offline"));
  renderForm();
  fireEvent.click(await screen.findByRole("button", { name: "다시 시도" }));
  await screen.findByRole("option", { name: "김회원 (#1)" });
  expect(projectApi.getMemberOptions).toHaveBeenCalledTimes(2);
});

test("기존 계정 ID를 유지하고 마지막 입력 행을 삭제하면 초기화한다", async () => {
  renderForm([{ userId: 1, memberName: "김회원", memberRole: "PM" }]);
  await waitFor(() =>
    expect(screen.getByLabelText("팀원 1 선택").disabled).toBe(false),
  );
  expect(screen.getByLabelText("팀원 1 선택").value).toBe("1");
  fireEvent.change(screen.getByLabelText("팀원 2 선택"), {
    target: { value: "3" },
  });
  fireEvent.change(screen.getByLabelText("팀원 2 역할"), {
    target: { value: "AI" },
  });
  fireEvent.click(screen.getByLabelText("팀원 2 삭제"));
  expect(screen.getByLabelText("팀원 2 선택").value).toBe("");
  expect(screen.getByLabelText("팀원 2 역할").value).toBe("");
  await submit();
  expect(
    (await readProject(projectApi.updateProject.mock.calls[0][1])).teamMember,
  ).toEqual([{ userId: 1, memberRole: "PM" }]);
});

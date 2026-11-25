import React from "react";
import "@testing-library/jest-dom";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import MemoryRouter from "../../testUtils/ProjectRouter";
import ProjectFormNew from "./ProjectFormNew";
import { projectApi } from "../../api/project";

jest.mock("../../api/project", () => ({
  projectApi: {
    getCurrentSemester: jest.fn(),
    createProject: jest.fn(),
    updateProject: jest.fn(),
  },
}));
jest.mock("./ImageUploader", () => () => null);
jest.mock("./TechStackSelector", () => () => null);
jest.mock("./InputPin", () => ({ setPassword }) => (
  <input aria-label="비밀번호" onChange={(e) => setPassword(e.target.value)} />
));

beforeEach(() => {
  jest.clearAllMocks();
  jest.spyOn(window, "alert").mockImplementation(() => {});
  projectApi.getCurrentSemester.mockResolvedValue({ semester: "2026-02" });
  projectApi.updateProject.mockResolvedValue({});
  projectApi.createProject.mockResolvedValue({});
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

const enterMember = (index, name, role) => {
  fireEvent.change(screen.getByLabelText(`팀원 ${index} 이름`), {
    target: { value: name },
  });
  fireEvent.change(screen.getByLabelText(`팀원 ${index} 역할`), {
    target: { value: role },
  });
};

test("팀원 이름과 역할을 직접 입력해 저장한다", async () => {
  renderForm();

  enterMember(1, "김회원", "Server");
  fireEvent.click(screen.getByRole("button", { name: "팀원 추가" }));
  enterMember(2, "이회원", "PM");

  await submit();
  expect(projectApi.updateProject).toHaveBeenCalledTimes(1);
  expect(
    (await readProject(projectApi.updateProject.mock.calls[0][1])).teamMember,
  ).toEqual([
    { memberName: "김회원", memberRole: "Server" },
    { memberName: "이회원", memberRole: "PM" },
  ]);
});

test("이름 없이는 팀원을 추가할 수 없고 역할은 브라우저 검증으로 확인한다", async () => {
  renderForm();
  const addButton = screen.getByRole("button", { name: "팀원 추가" });
  expect(addButton.disabled).toBe(true);

  fireEvent.change(screen.getByLabelText("팀원 1 이름"), {
    target: { value: "   " },
  });
  expect(addButton.disabled).toBe(true);

  fireEvent.change(screen.getByLabelText("팀원 1 이름"), {
    target: { value: "김회원" },
  });
  const roleSelect = screen.getByLabelText("팀원 1 역할");
  const reportValidity = jest.spyOn(roleSelect, "reportValidity");
  fireEvent.click(addButton);

  expect(reportValidity).toHaveBeenCalledTimes(1);
  expect(roleSelect.validity.valueMissing).toBe(true);
  expect(screen.queryByLabelText("팀원 2 이름")).toBeNull();

  fireEvent.change(roleSelect, { target: { value: "PM" } });
  fireEvent.click(addButton);
  expect(screen.getByLabelText("팀원 2 이름")).toBeInTheDocument();
  expect(window.alert).not.toHaveBeenCalled();
});

test("같은 이름의 팀원도 각각 등록한다", async () => {
  renderForm();

  enterMember(1, "김회원", "PM");
  fireEvent.click(screen.getByRole("button", { name: "팀원 추가" }));
  enterMember(2, "김회원", "Server");

  await submit();
  expect(
    (await readProject(projectApi.updateProject.mock.calls[0][1])).teamMember,
  ).toEqual([
    { memberName: "김회원", memberRole: "PM" },
    { memberName: "김회원", memberRole: "Server" },
  ]);
});

test("기존 팀원 이름과 역할은 유지하고 계정 ID는 저장하지 않는다", async () => {
  renderForm([{ userId: 3, memberName: "이회원", memberRole: "AI" }]);

  expect(screen.getByLabelText("팀원 1 이름").value).toBe("이회원");
  expect(screen.getByLabelText("팀원 1 역할").value).toBe("AI");

  await submit();
  expect(
    (await readProject(projectApi.updateProject.mock.calls[0][1])).teamMember,
  ).toEqual([{ memberName: "이회원", memberRole: "AI" }]);
});

test("마지막 입력 행을 삭제하면 빈 행으로 초기화한다", async () => {
  renderForm();

  enterMember(1, "김회원", "PM");
  fireEvent.click(screen.getByRole("button", { name: "팀원 추가" }));
  enterMember(2, "이회원", "AI");
  fireEvent.click(screen.getByLabelText("팀원 2 삭제"));

  expect(screen.getByLabelText("팀원 2 이름").value).toBe("");
  expect(screen.getByLabelText("팀원 2 역할").value).toBe("");

  await submit();
  expect(
    (await readProject(projectApi.updateProject.mock.calls[0][1])).teamMember,
  ).toEqual([{ memberName: "김회원", memberRole: "PM" }]);
});

test("이름 없이 역할만 입력하면 제출하지 않는다", async () => {
  renderForm();

  fireEvent.change(screen.getByLabelText("팀원 1 이름"), {
    target: { value: "   " },
  });
  fireEvent.change(screen.getByLabelText("팀원 1 역할"), {
    target: { value: "PM" },
  });

  await submit();
  expect(window.alert).toHaveBeenCalledWith(
    "팀원 이름과 역할을 입력해 주세요.",
  );
  expect(projectApi.updateProject).not.toHaveBeenCalled();
});

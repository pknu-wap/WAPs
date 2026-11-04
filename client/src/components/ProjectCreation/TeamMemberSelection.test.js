import React from "react";
import "@testing-library/jest-dom";
import {
  createEvent,
  fireEvent,
  render,
  screen,
  waitFor,
} from "@testing-library/react";
import MemoryRouter from "../../testUtils/ProjectRouter";
import ProjectFormNew from "./ProjectFormNew";
import { projectApi } from "../../api/project";
import { userApi } from "../../api/user";

jest.mock("../../api/user", () => ({ userApi: { getMe: jest.fn() } }));

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
  userApi.getMe.mockResolvedValue({ userId: 1, userName: "김회원" });
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

const searchWithEnter = (query) => {
  const input = screen.getByLabelText("팀원 1 검색");
  fireEvent.change(input, { target: { value: query } });
  const event = createEvent.keyDown(input, {
    key: "Enter",
    bubbles: true,
    cancelable: true,
  });
  fireEvent(input, event);
  expect(event.defaultPrevented).toBe(true);
};

test("검색 후 엔터는 프로젝트를 제출하지 않고 유일한 회원을 선택한다", async () => {
  render(
    <MemoryRouter>
      <ProjectFormNew />
    </MemoryRouter>,
  );
  await screen.findByRole("option", { name: "이회원 (#3)" });
  searchWithEnter("이회원");
  expect(screen.getByLabelText("팀원 1 선택").value).toBe("3");
  expect(projectApi.createProject).not.toHaveBeenCalled();
  expect(window.alert).not.toHaveBeenCalled();
});

test("동명이인이면 엔터로 선택 목록을 펼친다", async () => {
  renderForm();
  await screen.findByRole("option", { name: "김회원 (#1)" });
  searchWithEnter("김회원");
  const picker = screen.getByRole("listbox", { name: "팀원 1 선택" });
  expect(picker.value).toBe("");
  expect(picker).toHaveFocus();
  fireEvent.change(picker, { target: { value: "2" } });
  expect(screen.getByRole("combobox", { name: "팀원 1 선택" }).value).toBe("2");
  expect(window.alert).not.toHaveBeenCalled();
});

test("기존 선택과 다른 이름을 검색하면 새 검색 결과 한 명을 선택한다", async () => {
  renderForm([{ userId: 1, memberName: "김회원", memberRole: "PM" }]);
  await waitFor(() =>
    expect(screen.getByLabelText("팀원 1 검색").disabled).toBe(false),
  );
  searchWithEnter("이회원");
  expect(screen.getByLabelText("팀원 1 선택").value).toBe("3");
});

test.each(["", "없는회원"])(
  "빈 검색어나 결과 없는 검색에서는 엔터로 제출하지 않는다: %s",
  async (query) => {
    renderForm();
    await screen.findByRole("option", { name: "김회원 (#1)" });
    searchWithEnter(query);
    expect(screen.getByLabelText("팀원 1 선택").value).toBe("");
    expect(window.alert).not.toHaveBeenCalled();
  },
);

test("한글 조합 확정 엔터는 선택하거나 제출하지 않는다", async () => {
  renderForm();
  await screen.findByRole("option", { name: "이회원 (#3)" });
  const input = screen.getByLabelText("팀원 1 검색");
  fireEvent.change(input, { target: { value: "이회원" } });
  const event = createEvent.keyDown(input, { key: "Enter", isComposing: true });
  fireEvent(input, event);
  expect(event.defaultPrevented).toBe(true);
  expect(screen.getByLabelText("팀원 1 선택").value).toBe("");
});

test("새 프로젝트는 로그인한 계정을 첫 번째 팀원으로 선택하며 역할은 직접 고른다", async () => {
  userApi.getMe.mockResolvedValue({ userId: 2, userName: "김회원" });
  render(
    <MemoryRouter>
      <ProjectFormNew />
    </MemoryRouter>,
  );
  await waitFor(() =>
    expect(screen.getByLabelText("팀원 1 선택").value).toBe("2"),
  );
  expect(screen.getByLabelText("팀원 1 역할").value).toBe("");
  const roleSelect = screen.getByLabelText("팀원 1 역할");
  const reportValidity = jest.spyOn(roleSelect, "reportValidity");
  fireEvent.click(screen.getByRole("button", { name: "등록" }));
  expect(reportValidity).toHaveBeenCalledTimes(1);
  expect(roleSelect.validity.valueMissing).toBe(true);
  expect(window.alert).not.toHaveBeenCalled();
  expect(screen.queryByLabelText("팀원 2 선택")).toBeNull();
  fireEvent.change(screen.getByLabelText("팀원 1 역할"), {
    target: { value: "PM" },
  });
  fireEvent.click(screen.getByRole("button", { name: "등록" }));
  expect(
    Array.from(screen.getByLabelText("팀원 2 선택").options).map(
      (option) => option.value,
    ),
  ).not.toContain("2");
});

test("수정 화면은 로그인 사용자 대신 기존 첫 번째 팀원을 유지한다", async () => {
  renderForm([{ userId: 3, memberName: "이회원", memberRole: "AI" }]);
  await waitFor(() =>
    expect(screen.getByLabelText("팀원 1 선택").disabled).toBe(false),
  );
  expect(screen.getByLabelText("팀원 1 선택").value).toBe("3");
  expect(userApi.getMe).not.toHaveBeenCalled();
});

test("내 정보 조회 실패 후 다시 시도하면 기본 팀원을 선택한다", async () => {
  userApi.getMe.mockRejectedValueOnce(new Error("offline"));
  render(
    <MemoryRouter>
      <ProjectFormNew />
    </MemoryRouter>,
  );
  fireEvent.click(await screen.findByRole("button", { name: "다시 시도" }));
  await waitFor(() =>
    expect(screen.getByLabelText("팀원 1 선택").value).toBe("1"),
  );
});

test("자동 선택된 팀원은 이탈 경고를 켜지 않고 역할 변경은 감지한다", async () => {
  render(
    <MemoryRouter>
      <ProjectFormNew />
    </MemoryRouter>,
  );
  await waitFor(() =>
    expect(screen.getByLabelText("팀원 1 선택").value).toBe("1"),
  );
  const beforeUnload = () => {
    const event = new Event("beforeunload", { cancelable: true });
    window.dispatchEvent(event);
    return event.defaultPrevented;
  };
  expect(beforeUnload()).toBe(false);
  fireEvent.change(screen.getByLabelText("팀원 1 역할"), {
    target: { value: "PM" },
  });
  expect(beforeUnload()).toBe(true);
  fireEvent.change(screen.getByLabelText("팀원 1 역할"), {
    target: { value: "" },
  });
  expect(beforeUnload()).toBe(false);
});

test("기존 프로젝트를 불러온 것만으로는 이탈 경고가 켜지지 않는다", async () => {
  renderForm([{ userId: 3, memberName: "이회원", memberRole: "AI" }]);
  await waitFor(() =>
    expect(screen.getByLabelText("팀원 1 선택").disabled).toBe(false),
  );
  const event = new Event("beforeunload", { cancelable: true });
  window.dispatchEvent(event);
  expect(event.defaultPrevented).toBe(false);
});

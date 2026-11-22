import {
  fireEvent,
  render,
  screen,
  within,
  waitFor,
} from "@testing-library/react";
import "@testing-library/jest-dom";
import ManagePermissionPage from "./ManagePermissionPage";
import { adminPermissonApi } from "../../api/admin";

jest.mock("../../api/admin", () => ({
  adminPermissonApi: {
    getUserRoleList: jest.fn(),
    updateUserAttributes: jest.fn(),
    deleteUsers: jest.fn(),
  },
}));

const user = {
  id: 1,
  name: "테스트회원",
  email: "member@example.invalid",
  role: "ROLE_MEMBER",
  memberType: "NEW",
};
const applyButton = () =>
  screen.getByRole("button", { name: "선택한 사용자에게 적용" });
const selectUser = async () =>
  fireEvent.click(await screen.findByText(user.name));
const chooseRole = (value) =>
  fireEvent.change(screen.getByLabelText("변경할 권한"), { target: { value } });
const chooseLevel = (value) =>
  fireEvent.change(screen.getByLabelText("변경할 회원 구분"), {
    target: { value },
  });

beforeEach(() => {
  jest.resetAllMocks();
  adminPermissonApi.getUserRoleList.mockResolvedValue({
    content: [user],
    hasNext: false,
  });
});

test("목록 조회 실패 후 같은 필터로 다시 불러올 수 있다", async () => {
  adminPermissonApi.getUserRoleList.mockRejectedValueOnce(new Error("offline"));
  render(<ManagePermissionPage />);
  expect(await screen.findByRole("alert")).toHaveTextContent("사용자 목록을 불러오지 못했습니다.");
  expect(screen.queryByText("해당하는 사용자가 없습니다.")).not.toBeInTheDocument();
  fireEvent.click(screen.getByRole("button", { name: "목록 다시 불러오기" }));
  await screen.findByText(user.name);
  expect(screen.queryByRole("alert")).not.toBeInTheDocument();
});

test.each([undefined, [], [{ ...user, role: "ROLE_GUEST" }]])(
  "저장 성공 응답을 확인할 수 없으면 실패로 오인하지 않고 재조회한다: %j",
  async (response) => {
    adminPermissonApi.updateUserAttributes.mockResolvedValue(response);
    render(<ManagePermissionPage />);
    await selectUser();
    chooseRole("ROLE_ADMIN");
    adminPermissonApi.getUserRoleList.mockResolvedValue({
      content: [{ ...user, role: "ROLE_ADMIN" }], hasNext: false,
    });
    fireEvent.click(applyButton());
    await screen.findByText(/변경 요청은 처리되었지만/);
    expect(await screen.findByText("임원", { selector: "td" })).toBeInTheDocument();
    expect(screen.queryByRole("alert")).not.toBeInTheDocument();
    expect(screen.queryByRole("table", { name: "선택한 사용자" })).not.toBeInTheDocument();
    expect(applyButton()).toBeDisabled();
    expect(adminPermissonApi.updateUserAttributes).toHaveBeenCalledTimes(1);
  },
);

test("선택한 사용자는 페이지가 바뀌어도 유지되고 키보드로 해제할 수 있다", async () => {
  adminPermissonApi.getUserRoleList.mockResolvedValueOnce({ content: [user], hasNext: true });
  render(<ManagePermissionPage />);
  await selectUser();
  adminPermissonApi.getUserRoleList.mockResolvedValue({
    content: [{ ...user, id: 2, name: "다른회원" }], hasNext: false,
  });
  fireEvent.click(screen.getByRole("button", { name: "다음 페이지" }));
  await screen.findByText("다른회원");
  const row = within(screen.getByRole("table", { name: "선택한 사용자" })).getByText(user.name).closest("tr");
  expect(row).toHaveAttribute("tabindex", "0");
  fireEvent.keyDown(row, { key: " " });
  expect(screen.queryByRole("table", { name: "선택한 사용자" })).not.toBeInTheDocument();
});

test.each([
  ["UNDECIDED", "미정"],
  ["NEW", "신입"],
  ["ASSOCIATE", "준회원"],
  ["REGULAR", "정회원"],
])(
  "LEVEL %s applies to both lists without changing ROLE",
  async (value, label) => {
    adminPermissonApi.updateUserAttributes.mockResolvedValue([
      { ...user, memberType: value },
    ]);
    render(<ManagePermissionPage />);
    await selectUser();
    chooseLevel(value);
    fireEvent.click(applyButton());
    await screen.findByRole("status");
    expect(adminPermissonApi.updateUserAttributes).toHaveBeenCalledTimes(1);
    expect(adminPermissonApi.updateUserAttributes).toHaveBeenCalledWith({
      userIds: [1],
      memberType: value,
    });
    expect(screen.getAllByText(label, { selector: "td" })).toHaveLength(2);
    expect(screen.getAllByText("회원", { selector: "td" })).toHaveLength(2);
    expect(
      within(screen.getByRole("table", { name: "사용자 목록" }))
        .getByText(user.name)
        .closest("tr"),
    ).toHaveAttribute("aria-selected", "true");
  },
);

test.each([
  ["ROLE_GUEST", "게스트"],
  ["ROLE_MEMBER", "회원"],
  ["ROLE_ADMIN", "임원"],
])(
  "ROLE %s applies to both lists without changing LEVEL",
  async (value, label) => {
    adminPermissonApi.updateUserAttributes.mockResolvedValue([
      { ...user, role: value },
    ]);
    render(<ManagePermissionPage />);
    await selectUser();
    chooseRole(value);
    fireEvent.click(applyButton());
    await screen.findByRole("status");
    expect(adminPermissonApi.updateUserAttributes).toHaveBeenCalledWith({
      userIds: [1],
      role: value,
    });
    expect(screen.getAllByText(label, { selector: "td" })).toHaveLength(2);
    expect(screen.getAllByText("신입", { selector: "td" })).toHaveLength(2);
  },
);

test("single button beneath LEVEL saves ROLE and LEVEL together in one request", async () => {
  adminPermissonApi.updateUserAttributes.mockResolvedValue([
    { ...user, role: "ROLE_GUEST", memberType: "UNDECIDED" },
  ]);
  render(<ManagePermissionPage />);
  await selectUser();
  chooseRole("ROLE_GUEST");
  chooseLevel("UNDECIDED");
  expect(screen.getAllByRole("button", { name: /적용/ })).toHaveLength(1);
  expect(
    screen
      .getByLabelText("변경할 회원 구분")
      .compareDocumentPosition(applyButton()) &
      Node.DOCUMENT_POSITION_FOLLOWING,
  ).toBeTruthy();
  fireEvent.click(applyButton());
  await screen.findByRole("status");
  expect(adminPermissonApi.updateUserAttributes).toHaveBeenCalledTimes(1);
  expect(adminPermissonApi.updateUserAttributes).toHaveBeenCalledWith({
    userIds: [1],
    role: "ROLE_GUEST",
    memberType: "UNDECIDED",
  });
  expect(screen.getAllByText("게스트", { selector: "td" })).toHaveLength(2);
  expect(screen.getAllByText("미정", { selector: "td" })).toHaveLength(2);
  expect(screen.getByLabelText("변경할 권한")).toHaveValue("");
  expect(screen.getByLabelText("변경할 회원 구분")).toHaveValue("");
  expect(applyButton()).toBeDisabled();
});

test("failed combined save keeps old ROLE, LEVEL, selections and draft choices", async () => {
  adminPermissonApi.updateUserAttributes.mockRejectedValue(
    new Error("offline"),
  );
  render(<ManagePermissionPage />);
  await selectUser();
  chooseRole("ROLE_ADMIN");
  chooseLevel("REGULAR");
  fireEvent.click(applyButton());
  await screen.findByRole("alert");
  expect(screen.getAllByText("회원", { selector: "td" })).toHaveLength(2);
  expect(screen.getAllByText("신입", { selector: "td" })).toHaveLength(2);
  expect(screen.queryByRole("status")).not.toBeInTheDocument();
  expect(screen.getByLabelText("변경할 권한")).toHaveValue("ROLE_ADMIN");
  expect(screen.getByLabelText("변경할 회원 구분")).toHaveValue("REGULAR");
});

test("selection and at least one change are required; unassigned LEVEL displays 미정", async () => {
  adminPermissonApi.getUserRoleList.mockResolvedValue({
    content: [{ ...user, memberType: null }],
    hasNext: false,
  });
  render(<ManagePermissionPage />);
  await screen.findByText(user.name);
  expect(screen.getByText("미정", { selector: "td" })).toBeInTheDocument();
  expect(applyButton()).toBeDisabled();
  chooseLevel("NEW");
  expect(applyButton()).toBeDisabled();
  await selectUser();
  expect(applyButton()).toBeEnabled();
  chooseLevel("");
  expect(applyButton()).toBeDisabled();
  const roleOptions = within(screen.getByLabelText("변경할 권한")).getAllByRole(
    "option",
  );
  expect(roleOptions.map((option) => option.textContent)).toEqual([
    "권한 선택",
    "게스트",
    "회원",
    "임원",
  ]);
});

test("combined ROLE and undecided LEVEL filters are requested from the server", async () => {
  render(<ManagePermissionPage />);
  await screen.findByText(user.name);
  fireEvent.change(screen.getByLabelText("ROLE 필터"), {
    target: { value: "ROLE_MEMBER" },
  });
  fireEvent.change(screen.getByLabelText("LEVEL 필터"), {
    target: { value: "UNDECIDED" },
  });
  await waitFor(() =>
    expect(adminPermissonApi.getUserRoleList).toHaveBeenLastCalledWith(
      0,
      12,
      "ROLE_MEMBER",
      "UNDECIDED",
    ),
  );
  await screen.findByRole("table", { name: "사용자 목록" });
});


test("page selection can be toggled without selecting unseen users", async () => {
  render(<ManagePermissionPage />);
  const selectAll = await screen.findByRole("button", { name: "현재 페이지 전체 선택" });
  await screen.findByText(user.name);
  fireEvent.click(selectAll);
  expect(within(screen.getByRole("table", { name: "선택한 사용자" })).getByText(user.name)).toBeInTheDocument();
  fireEvent.click(screen.getByRole("button", { name: "현재 페이지 전체 선택 해제" }));
  expect(screen.queryByRole("table", { name: "선택한 사용자" })).not.toBeInTheDocument();
});

test("account deletion requires confirmation and retains selection on failure", async () => {
  const confirm = jest.spyOn(window, "confirm").mockReturnValue(false);
  render(<ManagePermissionPage />);
  await selectUser();
  fireEvent.click(screen.getByRole("button", { name: "삭제", exact: true }));
  expect(adminPermissonApi.deleteUsers).not.toHaveBeenCalled();
  confirm.mockReturnValue(true);
  adminPermissonApi.deleteUsers.mockRejectedValue(new Error("failed"));
  fireEvent.click(screen.getByRole("button", { name: "삭제", exact: true }));
  await screen.findByRole("alert");
  expect(adminPermissonApi.deleteUsers).toHaveBeenCalledWith([1]);
  expect(screen.getByRole("table", { name: "선택한 사용자" })).toBeInTheDocument();
  confirm.mockRestore();
});

test("successful deletion clears selection and reloads the first page", async () => {
  const confirm = jest.spyOn(window, "confirm").mockReturnValue(true);
  render(<ManagePermissionPage />);
  await selectUser();
  adminPermissonApi.deleteUsers.mockResolvedValue(undefined);
  adminPermissonApi.getUserRoleList.mockResolvedValue({ content: [], hasNext: false });
  fireEvent.click(screen.getByRole("button", { name: "삭제", exact: true }));
  await screen.findByText("해당하는 사용자가 없습니다.");
  expect(screen.queryByRole("table", { name: "선택한 사용자" })).not.toBeInTheDocument();
  confirm.mockRestore();
});

test("changing a filtered member returns to the first page before reloading", async () => {
  adminPermissonApi.getUserRoleList.mockResolvedValue({ content: [user], hasNext: true });
  adminPermissonApi.updateUserAttributes.mockResolvedValue([{ ...user, memberType: "REGULAR" }]);
  render(<ManagePermissionPage />);
  await screen.findByText(user.name);
  fireEvent.change(screen.getByLabelText("LEVEL 필터"), { target: { value: "NEW" } });
  await waitFor(() => expect(adminPermissonApi.getUserRoleList).toHaveBeenLastCalledWith(0, 12, "", "NEW"));
  await screen.findByRole("table", { name: "사용자 목록" });
  fireEvent.click(screen.getByRole("button", { name: "다음 페이지" }));
  await waitFor(() => expect(adminPermissonApi.getUserRoleList).toHaveBeenLastCalledWith(1, 12, "", "NEW"));
  await selectUser();
  chooseLevel("REGULAR");
  fireEvent.click(applyButton());
  await waitFor(() => expect(adminPermissonApi.getUserRoleList).toHaveBeenLastCalledWith(0, 12, "", "NEW"));
  expect(screen.getByRole("table", { name: "선택한 사용자" })).toHaveTextContent("정회원");
});

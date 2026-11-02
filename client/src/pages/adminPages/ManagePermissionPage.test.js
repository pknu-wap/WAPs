import {
  act,
  fireEvent,
  render,
  screen,
  waitFor,
  within,
} from "@testing-library/react";
import ManagePermissionPage from "./ManagePermissionPage";
import { adminPermissonApi } from "../../api/admin";

jest.mock("../../api/admin", () => ({
  adminPermissonApi: {
    getUserRoleList: jest.fn(),
    updateMembershipLevel: jest.fn(),
    updateUserRole: jest.fn(),
  },
}));

test("filters by level on the server and updates selected users without changing roles", async () => {
  const member = {
    id: 1,
    name: "Alice",
    email: "alice@example.com",
    role: "ROLE_MEMBER",
    membershipLevel: "NEW",
  };
  adminPermissonApi.getUserRoleList.mockResolvedValue({
    content: [member],
    hasNext: true,
  });
  adminPermissonApi.updateMembershipLevel.mockResolvedValue({
    updatedUserCount: 1,
    changeTo: "REGULAR",
  });
  const alert = jest.spyOn(window, "alert").mockImplementation(() => {});
  render(<ManagePermissionPage />);
  await screen.findByText("Alice");
  expect(
    screen.getAllByRole("columnheader").map((cell) => cell.textContent),
  ).toContain("LEVEL");
  const selects = screen.getAllByRole("combobox");
  expect(
    within(selects[1])
      .getAllByRole("option")
      .map((option) => option.value),
  ).toEqual(["", "NONE", "NEW", "ASSOCIATE", "REGULAR"]);
  await act(async () => {
    fireEvent.change(selects[0], { target: { value: "ROLE_MEMBER" } });
  });
  await screen.findByText("Alice");
  await act(async () => {
    fireEvent.click(screen.getByRole("button", { name: ">>" }));
  });
  await waitFor(() =>
    expect(adminPermissonApi.getUserRoleList).toHaveBeenLastCalledWith(
      1,
      12,
      "ROLE_MEMBER",
      "",
    ),
  );
  await act(async () => {
    fireEvent.change(selects[1], { target: { value: "NEW" } });
  });
  await waitFor(() =>
    expect(adminPermissonApi.getUserRoleList).toHaveBeenLastCalledWith(
      0,
      12,
      "ROLE_MEMBER",
      "NEW",
    ),
  );
  fireEvent.click(await screen.findByText("Alice"));
  fireEvent.change(selects[3], { target: { value: "REGULAR" } });
  const buttons = screen.getAllByRole("button");
  await act(async () => {
    fireEvent.click(buttons[buttons.length - 1]);
  });
  await waitFor(() =>
    expect(adminPermissonApi.updateMembershipLevel).toHaveBeenCalledWith(
      "REGULAR",
      new Map([[1, member]]),
    ),
  );
  await waitFor(() =>
    expect(adminPermissonApi.getUserRoleList).toHaveBeenLastCalledWith(
      0,
      12,
      "ROLE_MEMBER",
      "NEW",
    ),
  );
  expect(adminPermissonApi.updateUserRole).not.toHaveBeenCalled();
  alert.mockRestore();
});

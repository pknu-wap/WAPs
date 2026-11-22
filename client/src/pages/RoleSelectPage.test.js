import React from "react";
import "@testing-library/jest-dom";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter, Routes, Route } from "react-router-dom";
import RoleSelectPage from "./RoleSelectPage";
import { userApi } from "../api/user";
import authStorage from "../utils/authStorage";

jest.mock("../api/user", () => ({ userApi: { getMe: jest.fn(), signup: jest.fn(), getRole: jest.fn() } }));
jest.mock("../utils/authStorage", () => ({ __esModule: true, default: { set: jest.fn() } }));
const pending = { signupCompleted: false, userName: "홍길동" };
const completed = { ...pending, signupCompleted: true };
beforeEach(() => {
  jest.clearAllMocks();
  userApi.getMe.mockResolvedValue(pending);
  userApi.signup.mockResolvedValue(completed);
  userApi.getRole.mockResolvedValue({ role: "ROLE_MEMBER" });
});
function mount() {
  render(<MemoryRouter initialEntries={["/select/role"]}><Routes>
    <Route path="/select/role" element={<RoleSelectPage />} />
    <Route path="/ProjectPage" element={<h1>Projects</h1>} />
  </Routes></MemoryRouter>);
}
async function choose(label) {
  await waitFor(() => expect(screen.getByRole("radio", { name: label })).toBeEnabled());
  fireEvent.click(screen.getByRole("radio", { name: label }));
}
test("member signup sends required fields and preserves leading zeros in student number", async () => {
  mount();
  await choose("예");
  fireEvent.change(screen.getByLabelText("학번"), { target: { value: "001234" } });
  fireEvent.change(screen.getByLabelText("회원 구분"), { target: { value: "ASSOCIATE" } });
  fireEvent.click(screen.getByRole("button", { name: "가입 완료" }));
  expect(await screen.findByText("Projects")).toBeInTheDocument();
  expect(userApi.signup).toHaveBeenCalledWith({ member: true, name: "홍길동", studentNumber: "001234", memberType: "ASSOCIATE" });
  expect(authStorage.set).toHaveBeenCalledWith("userRole", "ROLE_MEMBER", { expires: 7 });
});
test("guest signup omits member-only fields and can retry a failed save", async () => {
  userApi.signup.mockRejectedValueOnce(new Error("network"));
  mount();
  await choose("아니오");
  fireEvent.click(screen.getByRole("button", { name: "가입 완료" }));
  expect(await screen.findByRole("alert")).toBeInTheDocument();
  fireEvent.click(screen.getByRole("button", { name: "가입 완료" }));
  expect(await screen.findByText("Projects")).toBeInTheDocument();
  expect(userApi.signup).toHaveBeenNthCalledWith(2, { member: false });
});
test("already-completed conflict recovers using server profile", async () => {
  userApi.signup.mockRejectedValueOnce({ response: { status: 409 } });
  mount();
  await choose("아니오");
  userApi.getMe.mockResolvedValue(completed);
  fireEvent.click(screen.getByRole("button", { name: "가입 완료" }));
  expect(await screen.findByText("Projects")).toBeInTheDocument();
});
test("profile load failure blocks submission until retry succeeds", async () => {
  userApi.getMe.mockRejectedValueOnce(new Error("network"));
  mount();
  await screen.findByRole("alert");
  expect(screen.getByRole("radio", { name: "예" })).toBeDisabled();
  fireEvent.click(screen.getByRole("button", { name: "가입 상태 다시 확인" }));
  await choose("아니오");
  expect(userApi.signup).not.toHaveBeenCalled();
});

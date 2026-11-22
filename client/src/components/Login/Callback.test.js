import React, { StrictMode } from "react";
import "@testing-library/jest-dom";
import { render, screen } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import Callback from "./Callback";
import { userApi } from "../../api/user";
jest.mock("../../api/user", () => ({ userApi: { getMe: jest.fn(), getRole: jest.fn() } }));
jest.mock("../../utils/authStorage", () => ({ __esModule: true, default: { set: jest.fn(), remove: jest.fn() }, clearDevSession: jest.fn() }));
jest.mock("../LoadingPage", () => () => <div>Loading</div>);
beforeEach(() => {
  jest.clearAllMocks();
  window.history.replaceState({}, "", "/callback?token=test-token");
  userApi.getRole.mockResolvedValue({ role: "ROLE_GUEST", roleAssigned: true });
});
test.each([[false, "Signup"], [true, "Projects"]])("routes using signupCompleted=%s even when role is assigned", async (signupCompleted, destination) => {
  userApi.getMe.mockResolvedValue({ signupCompleted, userName: "guest" });
  render(<StrictMode><MemoryRouter initialEntries={["/callback"]}><Routes>
    <Route path="/callback" element={<Callback />} />
    <Route path="/select/role" element={<div>Signup</div>} />
    <Route path="/ProjectPage" element={<div>Projects</div>} />
  </Routes></MemoryRouter></StrictMode>);
  expect(await screen.findByText(destination)).toBeInTheDocument();
  expect(userApi.getMe).toHaveBeenCalledTimes(1);
});

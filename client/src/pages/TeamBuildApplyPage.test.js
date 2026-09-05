import React from "react";
import { fireEvent, render, screen, within } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import TeamBuildApplyPage from "./TeamBuildApplyPage";

jest.mock("../api/team-build", () => ({ teamBuildApi: {} }));

test.each([1, 2])("%i차 경력 자동 입력과 개별 수정, 자기소개 120자 제한", (round) => {
  render(<MemoryRouter><TeamBuildApplyPage round={round} /></MemoryRouter>);
  const open = () => {
    fireEvent.click(screen.getAllByRole("button", { name: "지원서 작성하기" })[0]);
    return within(screen.getByRole("dialog"));
  };
  let form = open();
  fireEvent.change(form.getByLabelText("지원 직무"), { target: { value: "BACKEND" } });
  fireEvent.change(form.getByLabelText("경력"), { target: { value: "웹 개발 경험" } });
  fireEvent.change(form.getByLabelText("간단 자기소개 및 PR 메시지"), { target: { value: "가".repeat(121) } });
  expect(form.getByLabelText("간단 자기소개 및 PR 메시지").value).toHaveLength(120);
  fireEvent.click(form.getByRole("button", { name: "지원서 저장하기" }));
  form = open();
  expect(form.getByLabelText("경력").value).toBe("웹 개발 경험");
  fireEvent.change(form.getByLabelText("지원 직무"), { target: { value: "APP" } });
  fireEvent.change(form.getByLabelText("경력"), { target: { value: "앱 개발 경험" } });
  fireEvent.change(form.getByLabelText("간단 자기소개 및 PR 메시지"), { target: { value: "함께하고 싶습니다" } });
  fireEvent.click(form.getByRole("button", { name: "지원서 저장하기" }));
  fireEvent.click(screen.getByRole("button", { name: "지원서 수정하기 (백엔드)" }));
  form = within(screen.getByRole("dialog"));
  expect(form.getByLabelText("경력").value).toBe("웹 개발 경험");
  fireEvent.click(form.getByRole("button", { name: "지원서 닫기" }));
  form = open();
  expect(form.getByLabelText("경력").value).toBe("앱 개발 경험");
});

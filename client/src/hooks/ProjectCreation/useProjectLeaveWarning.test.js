import React, { useState } from "react";
import "whatwg-fetch";
import "@testing-library/jest-dom";
import { act, fireEvent, render, screen } from "@testing-library/react";
import {
  createMemoryRouter,
  Link,
  RouterProvider,
  useNavigate,
} from "react-router-dom";
import useProjectLeaveWarning, {
  projectDraftSnapshot,
  LEAVE_PROJECT_MESSAGE,
} from "./useProjectLeaveWarning";

function Draft() {
  const [text, setText] = useState("");
  const markSaved = useProjectLeaveWarning(Boolean(text));
  const navigate = useNavigate();
  return (
    <>
      <input
        aria-label="작성 내용"
        value={text}
        onChange={(event) => setText(event.target.value)}
      />
      <Link to="/away">나가기</Link>
      <button
        onClick={() => {
          markSaved();
          navigate("/away");
        }}
      >
        저장 성공
      </button>
    </>
  );
}
function setup() {
  const router = createMemoryRouter(
    [
      { path: "/draft", element: <Draft /> },
      { path: "/away", element: <p>이동 완료</p> },
    ],
    { initialEntries: ["/away", "/draft"], initialIndex: 1 },
  );
  const view = render(<RouterProvider router={router} />);
  return { router, ...view };
}
beforeEach(() => jest.spyOn(window, "confirm").mockReturnValue(false));
afterEach(() => jest.restoreAllMocks());

const change = (value) =>
  fireEvent.change(screen.getByLabelText("작성 내용"), { target: { value } });
const unload = () => {
  const event = new Event("beforeunload", { cancelable: true });
  window.dispatchEvent(event);
  return event.defaultPrevented;
};

test("작성하지 않았거나 원래대로 되돌린 경우에는 이동을 막지 않는다", async () => {
  setup();
  expect(unload()).toBe(false);
  change("작성");
  expect(unload()).toBe(true);
  change("");
  expect(unload()).toBe(false);
  fireEvent.click(screen.getByRole("link", { name: "나가기" }));
  await screen.findByText("이동 완료");
  expect(window.confirm).not.toHaveBeenCalled();
});

test("이동 취소 시 내용을 유지하고 확인하면 이동한다", async () => {
  setup();
  change("작성 중인 내용");
  fireEvent.click(screen.getByRole("link", { name: "나가기" }));
  expect(window.confirm).toHaveBeenCalledWith(LEAVE_PROJECT_MESSAGE);
  expect(screen.getByLabelText("작성 내용")).toHaveValue("작성 중인 내용");
  window.confirm.mockReturnValue(true);
  fireEvent.click(screen.getByRole("link", { name: "나가기" }));
  await screen.findByText("이동 완료");
  expect(unload()).toBe(false);
});

test("브라우저 뒤로가기 취소 후에도 다음 뒤로가기를 정상 처리한다", async () => {
  const { router } = setup();
  change("작성 중");
  await act(async () => router.navigate(-1));
  expect(router.state.location.pathname).toBe("/draft");
  window.confirm.mockReturnValue(true);
  await act(async () => router.navigate(-1));
  expect(router.state.location.pathname).toBe("/away");
});

test("저장 성공 직후에는 렌더링을 기다리지 않아도 경고 없이 이동한다", async () => {
  setup();
  change("작성 중");
  fireEvent.click(screen.getByRole("button", { name: "저장 성공" }));
  await screen.findByText("이동 완료");
  expect(window.confirm).not.toHaveBeenCalled();
  expect(unload()).toBe(false);
});

test("기본 팀원과 빈 추가 행은 같은 상태로 비교한다", () => {
  const initial = { teamMembers: [{ userId: 1, memberName: "사용자" }] };
  expect(
    projectDraftSnapshot({
      teamMembers: [
        { userId: 1, memberName: "사용자", memberRole: "" },
        { memberName: "", memberRole: "" },
      ],
    }),
  ).toBe(projectDraftSnapshot(initial));
});

test.each([
  { title: "제목" },
  { summary: "요약" },
  { content: "**본문**" },
  { projectType: "WEB" },
  { password: "1234" },
  { thumbnail: new File(["image"], "a.png") },
  { images: [new File(["image"], "a.png")] },
  { teamMembers: [{ userId: 1, memberRole: "PM" }] },
  { techStacks: [{ techStackName: "React", techStackType: "FRONTEND" }] },
  { recruitmentPositions: [{ role: "백엔드", count: 1 }] },
])("저장 대상 변경을 감지한다: %p", (draft) => {
  expect(projectDraftSnapshot(draft)).not.toBe(projectDraftSnapshot({}));
});

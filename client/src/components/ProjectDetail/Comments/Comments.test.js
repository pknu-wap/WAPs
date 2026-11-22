import "@testing-library/jest-dom";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import Comments from "./Comments";
import apiClient from "../../../api/client";

jest.mock("../../../api/client", () => ({ post: jest.fn() }));
const originalLocation = window.location;
beforeAll(() => {
  delete window.location;
  window.location = { reload: jest.fn() };
});
afterAll(() => {
  window.location = originalLocation;
});
beforeEach(() => {
  jest.resetAllMocks();
  jest.spyOn(window, "alert").mockImplementation(() => {});
});
afterEach(() => jest.restoreAllMocks());

test.each(["", "   \n "])("빈 댓글(%j)은 전송하지 않는다", (value) => {
  render(<Comments projectId="10" />);
  fireEvent.change(screen.getByRole("textbox"), { target: { value } });
  fireEvent.click(screen.getByRole("button", { name: "댓글 달기" }));
  expect(apiClient.post).not.toHaveBeenCalled();
});

test("중복 작성을 막고 성공 후 입력을 비우고 목록을 새로고침한다", async () => {
  let complete;
  apiClient.post.mockImplementation(
    () =>
      new Promise((resolve) => {
        complete = resolve;
      }),
  );
  render(<Comments projectId="10" />);
  const input = screen.getByRole("textbox");
  fireEvent.change(input, { target: { value: " 좋은 프로젝트입니다. " } });
  const submit = screen.getByRole("button", { name: "댓글 달기" });
  fireEvent.click(submit);
  fireEvent.click(submit);
  expect(apiClient.post).toHaveBeenCalledTimes(1);
  expect(apiClient.post).toHaveBeenCalledWith("/comment/10", {
    commentContent: "좋은 프로젝트입니다.",
  });
  expect(input).toBeDisabled();
  expect(submit).toBeDisabled();
  complete();
  await waitFor(() => expect(window.location.reload).toHaveBeenCalledTimes(1));
  await waitFor(() => expect(input).toHaveValue(""));
});

test.each([
  [
    {
      response: {
        status: 403,
        data: { message: "댓글 작성 권한이 없습니다." },
      },
    },
    "댓글 작성 권한이 없습니다.",
  ],
  [
    {
      response: {
        status: 404,
        data: { message: "프로젝트를 찾을 수 없습니다." },
      },
    },
    "프로젝트를 찾을 수 없습니다.",
  ],
  [
    { response: { status: 500 } },
    "댓글 작성에 실패했습니다. 다시 시도해주세요.",
  ],
  [{ request: {} }, "댓글 작성에 실패했습니다. 다시 시도해주세요."],
])(
  "작성 실패 시 화면과 입력을 유지해 재시도한다 (%j)",
  async (failure, message) => {
    apiClient.post
      .mockRejectedValueOnce(failure)
      .mockResolvedValueOnce(undefined);
    render(<Comments projectId="10" />);
    const input = screen.getByRole("textbox");
    fireEvent.change(input, { target: { value: "댓글 내용" } });
    fireEvent.click(screen.getByRole("button", { name: "댓글 달기" }));
    await waitFor(() => expect(window.alert).toHaveBeenCalledWith(message));
    expect(input).toHaveValue("댓글 내용");
    expect(input).toBeEnabled();
    fireEvent.click(screen.getByRole("button", { name: "댓글 달기" }));
    await waitFor(() =>
      expect(window.location.reload).toHaveBeenCalledTimes(1),
    );
    expect(apiClient.post).toHaveBeenCalledTimes(2);
  },
);

test("401이면 로그인 필요를 안내한다", async () => {
  apiClient.post.mockRejectedValue({ response: { status: 401 } });
  render(<Comments projectId="10" />);
  fireEvent.change(screen.getByRole("textbox"), { target: { value: "댓글" } });
  fireEvent.click(screen.getByRole("button", { name: "댓글 달기" }));
  await waitFor(() =>
    expect(window.alert).toHaveBeenCalledWith(
      "댓글은 로그인 후에 작성 가능합니다.",
    ),
  );
  expect(window.location.reload).not.toHaveBeenCalled();
});

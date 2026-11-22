import "@testing-library/jest-dom";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import CommentsList from "./CommentsList";
import apiClient from "../../../api/client";

jest.mock("../../../api/client", () => ({ delete: jest.fn() }));
const comments = [
  { commentId: 42, commenter: "작성자", commentContent: "댓글 내용" },
];
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

test("키보드로 삭제하고 요청 중 중복 삭제를 막는다", async () => {
  let complete;
  apiClient.delete.mockImplementation(
    () =>
      new Promise((resolve) => {
        complete = resolve;
      }),
  );
  render(<CommentsList comments={comments} />);
  const button = screen.getByRole("button", { name: "작성자 댓글 삭제" });
  userEvent.tab();
  expect(button).toHaveFocus();
  userEvent.keyboard("{Enter}");
  fireEvent.click(button);
  expect(apiClient.delete).toHaveBeenCalledTimes(1);
  expect(apiClient.delete).toHaveBeenCalledWith("/comment/42");
  await waitFor(() => expect(button).toBeDisabled());
  complete();
  await waitFor(() => expect(window.location.reload).toHaveBeenCalledTimes(1));
});

test.each([
  [401, "댓글 삭제는 로그인 후에 가능합니다."],
  [403, "댓글 삭제 권한이 없습니다."],
  [404, "댓글을 찾을 수 없습니다. 새로고침해주세요."],
  [500, "댓글 삭제에 실패했습니다. 다시 시도해주세요."],
  [undefined, "댓글 삭제에 실패했습니다. 다시 시도해주세요."],
])("삭제 실패(%s)를 구분하고 재시도할 수 있다", async (status, message) => {
  apiClient.delete
    .mockRejectedValueOnce({ response: status ? { status } : undefined })
    .mockResolvedValueOnce(undefined);
  render(<CommentsList comments={comments} />);
  const button = screen.getByRole("button", { name: "작성자 댓글 삭제" });
  fireEvent.click(button);
  await waitFor(() => expect(window.alert).toHaveBeenCalledWith(message));
  expect(button).toBeEnabled();
  expect(screen.getByText("댓글 내용")).toBeInTheDocument();
  expect(window.location.reload).not.toHaveBeenCalled();
  fireEvent.click(button);
  await waitFor(() => expect(window.location.reload).toHaveBeenCalledTimes(1));
  expect(apiClient.delete).toHaveBeenCalledTimes(2);
});

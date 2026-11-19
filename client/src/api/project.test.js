import apiClient from "./client";
import { projectApi } from "./project";

jest.mock("./client", () => ({ post: jest.fn(), put: jest.fn() }));
beforeEach(() => jest.clearAllMocks());

test.each([false, true])(
  "프로젝트 업로드는 10초 제한과 진행률 콜백을 전달한다 (수정: %s)",
  (isEdit) => {
    const data = new FormData();
    const onProgress = jest.fn();
    if (isEdit) projectApi.updateProject(12, data, onProgress);
    else projectApi.createProject(data, onProgress);
    expect(isEdit ? apiClient.put : apiClient.post).toHaveBeenCalledWith(
      isEdit ? "/project/12" : "/project",
      data,
      {
        timeout: 10000,
        onUploadProgress: onProgress,
        headers: { "Content-Type": "multipart/form-data" },
      },
    );
  },
);

test("진행률 콜백 없는 기존 호출도 지원한다", () => {
  const data = new FormData();
  projectApi.createProject(data);
  projectApi.updateProject(12, data);
  expect(apiClient.post).toHaveBeenCalledWith(
    "/project",
    data,
    expect.objectContaining({ timeout: 10000 }),
  );
  expect(apiClient.put).toHaveBeenCalledWith(
    "/project/12",
    data,
    expect.objectContaining({ timeout: 10000 }),
  );
});

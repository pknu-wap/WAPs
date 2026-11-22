import { act, renderHook, waitFor } from "@testing-library/react";
import Cookies from "js-cookie";
import authStorage, { saveDevSession } from "../utils/authStorage";
import { userApi } from "../api/user";
import useCurrentUserName from "./useCurrentUserName";

jest.mock("js-cookie", () => ({ get: jest.fn(), set: jest.fn(), remove: jest.fn() }));
jest.mock("../api/user", () => ({ userApi: { getMe: jest.fn() } }));
let values;
beforeEach(() => {
  jest.clearAllMocks();
  sessionStorage.clear();
  localStorage.clear();
  values = { authToken: "token", userName: "이전 이름" };
  Cookies.get.mockImplementation((key) => values[key]);
  Cookies.set.mockImplementation((key, value) => { values[key] = value; });
  Cookies.remove.mockImplementation((key) => { delete values[key]; });
  userApi.getMe.mockResolvedValue({ userName: "현재 이름" });
});

test("서버 조회, 같은 탭 저장, 탭 복귀 및 다른 탭 변경을 반영한다", async () => {
  const { result } = renderHook(useCurrentUserName);
  await waitFor(() => expect(result.current).toBe("현재 이름"));
  expect(values.userName).toBe("현재 이름");
  act(() => authStorage.set("userName", "수정 이름"));
  expect(result.current).toBe("수정 이름");
  userApi.getMe.mockResolvedValue({ userName: "다른 기기 이름" });
  act(() => window.dispatchEvent(new Event("focus")));
  await waitFor(() => expect(result.current).toBe("다른 기기 이름"));
  userApi.getMe.mockResolvedValue({ userName: "다른 탭 이름" });
  act(() => window.dispatchEvent(new StorageEvent("storage", { key: "waps.profileChanged" })));
  await waitFor(() => expect(result.current).toBe("다른 탭 이름"));
});

test.each(["save", "logout", "account"])("늦은 조회 응답은 %s 이후 이름을 덮어쓰지 않는다", async (action) => {
  let resolve;
  userApi.getMe.mockReturnValue(new Promise((done) => { resolve = done; }));
  const { result } = renderHook(useCurrentUserName);
  act(() => {
    if (action === "logout") authStorage.remove("authToken");
    else {
      if (action === "account") authStorage.set("authToken", "another-token");
      authStorage.set("userName", "저장 이름");
    }
  });
  await act(async () => resolve({ userName: "늦은 이름" }));
  expect(result.current).toBe(action === "logout" ? "" : "저장 이름");
});

test("조회 실패 시 기존 이름을 유지하고 비로그인 상태에서는 조회하지 않는다", async () => {
  userApi.getMe.mockRejectedValue(new Error("offline"));
  const { result, unmount } = renderHook(useCurrentUserName);
  await act(async () => {});
  expect(result.current).toBe("이전 이름");
  unmount();
  delete values.authToken;
  userApi.getMe.mockClear();
  renderHook(useCurrentUserName);
  expect(userApi.getMe).not.toHaveBeenCalled();
});

test("개발 로그인은 이름을 탭에만 저장한다", async () => {
  const original = process.env.NODE_ENV;
  process.env.NODE_ENV = "development";
  try {
    saveDevSession({ accessToken: "dev-token", userName: "개발 이름", expiresAt: "2099-01-01T00:00:00Z" });
    const { result } = renderHook(useCurrentUserName);
    await waitFor(() => expect(result.current).toBe("현재 이름"));
    expect(authStorage.get("userName")).toBe("현재 이름");
    expect(Cookies.set).not.toHaveBeenCalled();
    expect(localStorage.getItem("waps.profileChanged")).toBeNull();
  } finally {
    process.env.NODE_ENV = original;
  }
});

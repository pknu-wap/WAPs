import axios from "axios";
import authStorage from "../utils/authStorage";
import { consumePendingLoginRedirect } from "../utils/pendingLoginRedirect";
import "./client";

jest.mock("axios", () => ({
  create: jest.fn(() => ({
    interceptors: {
      request: { use: jest.fn() },
      response: { use: jest.fn() },
    },
  })),
}));
jest.mock("../utils/authStorage", () => ({
  __esModule: true,
  default: { get: jest.fn(), remove: jest.fn() },
}));

const reject = axios.create.mock.results[0].value.interceptors.response.use.mock.calls[0][1];
const location = window.location;
beforeEach(() => {
  sessionStorage.clear();
  delete window.location;
  window.location = { pathname: "/vote", href: "/vote" };
});
afterEach(() => { window.location = location; });

test("투표 API의 401 응답은 전체 페이지 이동 전에 복귀 경로를 보관한다", async () => {
  const error = { response: { status: 401 } };
  await expect(reject(error)).rejects.toBe(error);
  expect(window.location.href).toBe("/login");
  expect(authStorage.remove).toHaveBeenCalledWith("authToken");
  expect(consumePendingLoginRedirect()).toBe("/vote");
});

test("다른 페이지의 401은 투표 복귀를 예약하지 않는다", async () => {
  window.location.pathname = "/ProjectPage";
  const error = { response: { status: 401 } };
  await expect(reject(error)).rejects.toBe(error);
  expect(consumePendingLoginRedirect()).toBe("/ProjectPage");
});

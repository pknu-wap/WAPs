import { createRoutesFromElements, matchRoutes } from "react-router-dom";
import attendancePreviewRoute from "./attendancePreviewRoute";

const originalEnv = process.env.NODE_ENV;
afterEach(() => { process.env.NODE_ENV = originalEnv; });

test.each(["production", "test"])("%s 환경에는 미리보기 경로를 등록하지 않는다", (environment) => {
  process.env.NODE_ENV = environment;
  expect(attendancePreviewRoute()).toBeNull();
});

test("development 환경에서 별도 미리보기 경로를 등록한다", () => {
  process.env.NODE_ENV = "development";
  const routes = createRoutesFromElements(attendancePreviewRoute());
  expect(matchRoutes(routes, "/preview/attendance")).not.toBeNull();
  expect(matchRoutes(routes, "/preview/attendance/check-in?preview=1&sequence=1")).not.toBeNull();
  expect(matchRoutes(routes, "/admin/attendance")).toBeNull();
});

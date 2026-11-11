import { lazy, Suspense } from "react";
import { Route } from "react-router-dom";
import AdminPageLayout from "../components/Admin/AdminPageLayout";

export default function attendancePreviewRoute() {
  if (process.env.NODE_ENV === "development") {
    const AttendancePreviewPage = lazy(
      () => import("../pages/preview/AttendancePreviewPage"),
    );
    const AttendanceMemberPreviewPage = lazy(
      () => import("../pages/preview/AttendanceMemberPreviewPage"),
    );
    return (
      <>
        <Route
          path="/preview/attendance/check-in"
          element={
            <Suspense fallback={<p>회원용 미리보기를 불러오는 중입니다.</p>}>
              <AttendanceMemberPreviewPage />
            </Suspense>
          }
        />
        <Route element={<AdminPageLayout />}>
          <Route
            path="/preview/attendance"
            element={
              <Suspense fallback={<p>미리보기를 불러오는 중입니다.</p>}>
                <AttendancePreviewPage />
              </Suspense>
            }
          />
        </Route>
      </>
    );
  }
  return null;
}

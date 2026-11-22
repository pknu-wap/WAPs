import { fireEvent, render, screen } from "@testing-library/react";
import "@testing-library/jest-dom";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import SplashPage from "./SplashPage";

test("PROJECTS를 누르면 타이머 대기 없이 프로젝트 화면으로 이동한다", () => {
  jest.useFakeTimers();
  try {
    render(
      <MemoryRouter>
        <Routes>
          <Route path="/" element={<SplashPage />} />
          <Route path="/ProjectPage" element={<h1>프로젝트 목록</h1>} />
        </Routes>
      </MemoryRouter>,
    );
    fireEvent.click(screen.getByRole("button", { name: "PROJECTS" }));
    expect(
      screen.getByRole("heading", { name: "프로젝트 목록" }),
    ).toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: "PROJECTS" }),
    ).not.toBeInTheDocument();
  } finally {
    jest.useRealTimers();
  }
});

import "@testing-library/jest-dom";
import { fireEvent, render, screen } from "@testing-library/react";
import { MemoryRouter, useLocation } from "react-router-dom";
import AdminPageLayout from "./AdminPageLayout";

const CurrentPath = () => <output>{useLocation().pathname}</output>;

test.each([
  ["투표 관리", "/admin/vote"],
  ["주요 행사 일정 관리", "/admin/plan"],
])(
  "모바일 메뉴에서 %s 선택 시 현재 페이지 여부와 관계없이 메뉴를 닫는다",
  (label, path) => {
    const { container } = render(
      <MemoryRouter initialEntries={["/admin/vote"]}>
        <AdminPageLayout />
        <CurrentPath />
      </MemoryRouter>,
    );
    fireEvent.click(container.querySelector(".hamburger"));
    const buttons = screen.getAllByRole("button", { name: label });
    expect(buttons).toHaveLength(2);
    fireEvent.click(buttons[1]);
    expect(
      container.querySelector(".mobileSidebarContent"),
    ).not.toBeInTheDocument();
    expect(
      container.querySelector(".mobileSidebarOverlay"),
    ).not.toBeInTheDocument();
    expect(screen.getByText(path)).toBeInTheDocument();
    expect(screen.getAllByRole("button", { name: label })).toHaveLength(1);
  },
);

import "@testing-library/jest-dom";
import { fireEvent, render, screen, within } from "@testing-library/react";
import { MemoryRouter, useLocation } from "react-router-dom";
import AdminPageLayout from "./AdminPageLayout";

const CurrentPath = () => <output>{useLocation().pathname}</output>;

test.each([
  ["투표 관리", "/admin/vote"],
  ["주요 행사 일정 관리", "/admin/plan"],
])(
  "모바일 메뉴에서 %s 선택 시 현재 페이지 여부와 관계없이 메뉴를 닫는다",
  (label, path) => {
    render(
      <MemoryRouter initialEntries={["/admin/vote"]}>
        <AdminPageLayout />
        <CurrentPath />
      </MemoryRouter>,
    );
    const toggle = screen.getByRole("button", { name: "관리자 메뉴" });
    fireEvent.click(toggle);
    const menu = screen.getByRole("navigation", { name: "모바일 관리자 메뉴" });
    expect(toggle).toHaveAttribute("aria-expanded", "true");
    fireEvent.click(within(menu).getByRole("button", { name: label }));
    expect(
      screen.queryByRole("navigation", { name: "모바일 관리자 메뉴" }),
    ).not.toBeInTheDocument();
    expect(toggle).toHaveAttribute("aria-expanded", "false");
    expect(screen.getByText(path)).toBeInTheDocument();
    expect(screen.getAllByRole("button", { name: label })).toHaveLength(1);
  },
);

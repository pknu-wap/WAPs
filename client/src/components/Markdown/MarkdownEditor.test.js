import React, { useState } from "react";
import "@testing-library/jest-dom";
import { fireEvent, render, screen } from "@testing-library/react";
import MarkdownEditor from "./MarkdownEditor";
import MarkdownContent from "./MarkdownContent";

function Editor({ initial = "", maxLength = 3000 }) {
  const [value, setValue] = useState(initial);
  return (
    <MarkdownEditor value={value} onChange={setValue} maxLength={maxLength} />
  );
}

test("선택한 글자에 서식을 넣고 미리보기와 Raw 전환 중 원문을 보존한다", () => {
  render(<Editor initial="프로젝트 소개" />);
  const input = screen.getByLabelText("상세 설명");
  input.setSelectionRange(0, 4);
  fireEvent.click(screen.getByRole("button", { name: "볼드" }));
  expect(input.value).toBe("**프로젝트** 소개");
  fireEvent.click(screen.getByRole("button", { name: "미리보기" }));
  expect(screen.getByText("프로젝트").tagName).toBe("STRONG");
  fireEvent.click(screen.getByRole("button", { name: "Raw" }));
  expect(screen.getByLabelText("상세 설명")).toHaveValue("**프로젝트** 소개");
});

test.each([
  ["이탤릭", "*문구*"],
  ["하이퍼링크", "[문구](https://example.com)"],
  ["제목", "## 문구"],
  ["목록", "- 문구"],
  ["인용", "> 문구"],
  ["코드", "`문구`"],
])("%s 버튼은 선택 영역에 마크다운을 적용한다", (name, expected) => {
  render(<Editor initial="문구" />);
  const input = screen.getByLabelText("상세 설명");
  input.setSelectionRange(0, 2);
  fireEvent.click(screen.getByRole("button", { name }));
  expect(input).toHaveValue(expected);
});

test("서식 삽입도 글자 수 제한을 지킨다", () => {
  render(<Editor initial="가나다라" maxLength={5} />);
  fireEvent.click(screen.getByRole("button", { name: "볼드" }));
  expect(screen.getByLabelText("상세 설명")).toHaveValue("가나다라");
  expect(screen.getByRole("alert")).toHaveTextContent("5자까지");
});

test("상세 보기에서 제목, 목록, 강조, 링크를 렌더링하고 Raw를 볼 수 있다", () => {
  const value =
    "## 소개\n\n**볼드** *이탤릭* [웹사이트](https://example.com)\n\n- 항목";
  render(<MarkdownContent value={value} allowRaw />);
  expect(screen.getByRole("heading", { name: "소개" })).toBeInTheDocument();
  expect(screen.getByText("볼드").tagName).toBe("STRONG");
  expect(screen.getByText("이탤릭").tagName).toBe("EM");
  expect(screen.getByRole("link", { name: "웹사이트" })).toHaveAttribute(
    "href",
    "https://example.com",
  );
  expect(screen.getByRole("listitem")).toHaveTextContent("항목");
  fireEvent.click(screen.getByRole("button", { name: "Raw" }));
  expect(screen.queryByRole("heading")).toBeNull();
  expect(screen.getByText(/## 소개/).textContent).toBe(value);
});

test("HTML은 실행하지 않고 위험한 링크는 제거한다", () => {
  render(
    <MarkdownContent
      value={
        '<iframe src="https://example.com"></iframe>\n\n<script>alert(1)</script>\n\n[위험](javascript:alert%281%29)'
      }
    />,
  );
  expect(screen.getByText(/<iframe/).tagName).not.toBe("IFRAME");
  expect(screen.getByText(/<script/).tagName).not.toBe("SCRIPT");
  expect(screen.getByText("위험")).not.toHaveAttribute(
    "href",
    expect.stringMatching(/^javascript:/),
  );
});

import React from "react";
import "@testing-library/jest-dom";
import { render, screen } from "@testing-library/react";
import MarkdownContent from "./MarkdownContent";

test.each([
  // eslint-disable-next-line no-script-url -- Intentionally unsafe input to verify rejection.
  "javascript:alert%281%29",
  "java&#x73;cript:alert%281%29",
  "vbscript:msgbox%281%29",
  "data:text/html;base64,PHNjcmlwdD48L3NjcmlwdD4=",
  "data:image/svg+xml;base64,PHN2ZyBvbmxvYWQ9YWxlcnQoMSk+PC9zdmc+",
  "d&#97;ta&#58;image/svg+xml;base64,PHN2Zz4=",
  "DaTa:image/png;base64,aGVsbG8=",
  "blob:https://example.com/example",
  "file:///etc/passwd",
  "ftp://example.com/file",
  "https://[invalid",
])("허용하지 않는 링크의 href를 제거한다: %s", (url) => {
  render(<MarkdownContent value={`[링크 문구](${url})`} />);
  expect(screen.getByText("링크 문구")).not.toHaveAttribute("href");
  expect(screen.queryByRole("link")).toBeNull();
});

test.each([
  "https://example.com/path?q=value#section",
  "http://example.com",
  "HTTPS://example.com",
  "mailto:member@example.com",
  "/project/123",
  "../project/123",
  "project/123",
  "#section",
  "?page=2",
  "//example.com/path",
])("안전한 링크와 상대 경로를 보존한다: %s", (url) => {
  render(<MarkdownContent value={`[링크 문구](${url})`} />);
  expect(screen.getByRole("link", { name: "링크 문구" })).toHaveAttribute(
    "href",
    url,
  );
});

test("참조 링크에도 프로토콜 제한을 적용한다", () => {
  render(
    <MarkdownContent
      value={
        "[위험한 참조][target]\n\n[target]: data:image/svg+xml;base64,PHN2Zz4="
      }
    />,
  );
  expect(screen.getByText("위험한 참조")).not.toHaveAttribute("href");
});

test("이미지에는 라이브러리의 기본 URL 검증을 유지한다", () => {
  render(
    <MarkdownContent
      value={
        "![안전한 이미지](https://example.com/image.png)\n\n![위험한 이미지](javascript:alert%281%29)"
      }
    />,
  );
  expect(screen.getByAltText("안전한 이미지")).toHaveAttribute(
    "src",
    "https://example.com/image.png",
  );
  expect(screen.getByAltText("위험한 이미지")).not.toHaveAttribute("src");
});

import React, { useRef, useState } from "react";
import MarkdownContent from "./MarkdownContent";
import styles from "./Markdown.module.css";

const formats = [
  {
    label: "볼드",
    text: "B",
    before: "**",
    after: "**",
    placeholder: "굵은 글씨",
  },
  {
    label: "이탤릭",
    text: "I",
    before: "*",
    after: "*",
    placeholder: "기울임 글씨",
  },
  {
    label: "하이퍼링크",
    text: "링크",
    before: "[",
    after: "](https://example.com)",
    placeholder: "링크 이름",
  },
  {
    label: "제목",
    text: "H",
    before: "## ",
    after: "",
    placeholder: "제목",
    block: true,
  },
  {
    label: "목록",
    text: "목록",
    before: "- ",
    after: "",
    placeholder: "목록 항목",
    block: true,
  },
  {
    label: "인용",
    text: "인용",
    before: "> ",
    after: "",
    placeholder: "인용문",
    block: true,
  },
  { label: "코드", text: "</>", before: "`", after: "`", placeholder: "코드" },
];

export default function MarkdownEditor({ value, onChange, maxLength, error }) {
  const [preview, setPreview] = useState(false);
  const [limitMessage, setLimitMessage] = useState("");
  const inputRef = useRef(null);

  const insertFormat = ({ before, after, placeholder, block }) => {
    const input = inputRef.current;
    const start = input.selectionStart;
    const end = input.selectionEnd;
    const selected = value.slice(start, end) || placeholder;
    const prefix =
      block && start > 0 && value[start - 1] !== "\n" ? `\n${before}` : before;
    const suffix =
      block && end < value.length && value[end] !== "\n" ? `${after}\n` : after;
    const next =
      value.slice(0, start) + prefix + selected + suffix + value.slice(end);
    if (next.length > maxLength) {
      setLimitMessage(`상세 설명은 ${maxLength}자까지 입력할 수 있습니다.`);
      return;
    }
    setLimitMessage("");
    onChange(next);
    requestAnimationFrame(() => {
      input.focus();
      input.setSelectionRange(
        start + prefix.length,
        start + prefix.length + selected.length,
      );
    });
  };

  return (
    <section className={styles.editor} aria-label="상세 설명 편집기">
      <div className={styles.header}>
        <label htmlFor="project-description">상세 설명</label>
        <div className={styles.controls} aria-label="상세 설명 편집 방식">
          <button
            type="button"
            aria-pressed={!preview}
            onClick={() => setPreview(false)}
          >
            Raw
          </button>
          <button
            type="button"
            aria-pressed={preview}
            onClick={() => setPreview(true)}
          >
            미리보기
          </button>
        </div>
      </div>
      {!preview && (
        <div className={styles.toolbar} role="group" aria-label="마크다운 서식">
          {formats.map((format) => (
            <button
              key={format.label}
              type="button"
              aria-label={format.label}
              title={format.label}
              onClick={() => insertFormat(format)}
            >
              {format.text}
            </button>
          ))}
        </div>
      )}
      {preview ? (
        <div className={styles.preview}>
          <MarkdownContent value={value} />
        </div>
      ) : (
        <textarea
          id="project-description"
          name="content"
          ref={inputRef}
          value={value}
          placeholder="마크다운으로 상세 설명을 작성해 주세요."
          maxLength={maxLength}
          onChange={(event) => {
            setLimitMessage("");
            onChange(event.target.value);
          }}
        />
      )}
      <div className={styles.count}>
        {value.length}/{maxLength}
      </div>
      {(limitMessage || error) && <p role="alert">{limitMessage || error}</p>}
    </section>
  );
}

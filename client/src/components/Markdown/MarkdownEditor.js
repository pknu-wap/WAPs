import React, { useEffect, useMemo, useRef, useState } from "react";
import { EditorContent, Extension, useEditor } from "@tiptap/react";
import { Plugin } from "@tiptap/pm/state";
import StarterKit from "@tiptap/starter-kit";
import { Markdown } from "@tiptap/markdown";
import { TableKit } from "@tiptap/extension-table";
import Image from "@tiptap/extension-image";
import { TaskList, TaskItem } from "@tiptap/extension-list";
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

export default function MarkdownEditor({
  value,
  onChange,
  maxLength,
  error,
  disabled = false,
}) {
  const [preview, setPreview] = useState(true);
  const [limitMessage, setLimitMessage] = useState("");
  const inputRef = useRef(null);
  const lastValue = useRef(value);
  const importing = useRef(false);
  const [linkUrl, setLinkUrl] = useState(null);
  const linkInput = useRef(null);
  const lengthLimit = useMemo(
    () =>
      Extension.create({
        name: "markdownLengthLimit",
        addProseMirrorPlugins() {
          return [
            new Plugin({
              filterTransaction: (transaction, state) => {
                if (!transaction.docChanged || importing.current) return true;
                const nextLength = this.editor.markdown.serialize(
                  transaction.doc.toJSON(),
                ).length;
                const previousLength = this.editor.markdown.serialize(
                  state.doc.toJSON(),
                ).length;
                if (nextLength > maxLength && nextLength > previousLength) {
                  setLimitMessage(
                    `상세 설명은 ${maxLength}자까지 입력할 수 있습니다.`,
                  );
                  return false;
                }
                return true;
              },
            }),
          ];
        },
      }),
    [maxLength],
  );
  const editor = useEditor({
    extensions: [
      StarterKit.configure({ underline: false, link: { openOnClick: false } }),
      Markdown.configure({ markedOptions: { breaks: true } }),
      TableKit,
      Image,
      TaskList,
      TaskItem.configure({ nested: true }),
      lengthLimit,
    ],
    content: value,
    contentType: "markdown",
    shouldRerenderOnTransaction: true,
    editorProps: {
      attributes: {
        role: "textbox",
        "aria-label": "상세 설명",
        "aria-multiline": "true",
        class: `${styles.richInput} ${styles.markdown}`,
      },
    },
    onUpdate: ({ editor: updated }) => {
      const markdown = updated.getMarkdown();
      lastValue.current = markdown;
      setLimitMessage("");
      onChange(markdown);
    },
  });
  useEffect(() => {
    if (!editor || value === lastValue.current) return;
    importing.current = true;
    editor.commands.setContent(value, {
      contentType: "markdown",
      emitUpdate: false,
    });
    importing.current = false;
    lastValue.current = value;
  }, [editor, value]);

  useEffect(() => {
    editor?.setEditable(!disabled, false);
  }, [editor, disabled]);

  const applyRichFormat = (format) => {
    if (!editor) return;
    if (format.label === "하이퍼링크") {
      setLinkUrl(editor.getAttributes("link").href || "https://");
      return;
    }
    const chain = editor.chain().focus();
    switch (format.label) {
      case "볼드":
        chain.toggleBold().run();
        break;
      case "이탤릭":
        chain.toggleItalic().run();
        break;
      case "제목":
        chain.toggleHeading({ level: 2 }).run();
        break;
      case "목록":
        chain.toggleBulletList().run();
        break;
      case "인용":
        chain.toggleBlockquote().run();
        break;
      case "코드":
        chain.toggleCode().run();
        break;
      default:
        break;
    }
  };
  const applyLink = () => {
    if (!linkInput.current.reportValidity()) return;
    const chain = editor.chain().focus().extendMarkRange("link");
    if (editor.state.selection.empty) {
      chain
        .insertContent({
          type: "text",
          text: linkUrl,
          marks: [{ type: "link", attrs: { href: linkUrl } }],
        })
        .run();
    } else {
      chain.setLink({ href: linkUrl }).run();
    }
    setLinkUrl(null);
  };

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
        <span>상세 설명</span>
        <div className={styles.controls} aria-label="상세 설명 편집 방식">
          <button
            type="button"
            aria-pressed={!preview}
            onClick={() => {
              setLinkUrl(null);
              setPreview(false);
            }}
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
      <div className={styles.toolbar} role="group" aria-label="마크다운 서식">
        {formats.map((format) => (
          <button
            key={format.label}
            type="button"
            aria-label={format.label}
            title={format.label}
            onClick={() =>
              preview ? applyRichFormat(format) : insertFormat(format)
            }
          >
            {format.text}
          </button>
        ))}
      </div>
      {linkUrl !== null && (
        <div className={styles.linkControls}>
          <input
            ref={linkInput}
            type="url"
            aria-label="링크 주소"
            required
            value={linkUrl}
            onChange={(event) => setLinkUrl(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === "Enter") {
                event.preventDefault();
                applyLink();
              }
              if (event.key === "Escape") setLinkUrl(null);
            }}
          />
          <button type="button" onClick={applyLink}>
            적용
          </button>
          <button type="button" onClick={() => setLinkUrl(null)}>
            취소
          </button>
        </div>
      )}
      <div hidden={!preview}>
        <EditorContent editor={editor} />
      </div>
      {!preview && (
        <textarea
          id="project-description"
          name="content"
          aria-label="상세 설명"
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

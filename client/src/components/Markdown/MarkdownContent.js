import React, { useState } from "react";
import Markdown from "markdown-to-jsx";
import styles from "./Markdown.module.css";

export default function MarkdownContent({ value, allowRaw = false }) {
  const [raw, setRaw] = useState(false);
  return (
    <div className={styles.viewer}>
      {allowRaw && (
        <div className={styles.controls} aria-label="상세 설명 보기 방식">
          <button
            type="button"
            aria-pressed={!raw}
            onClick={() => setRaw(false)}
          >
            미리보기
          </button>
          <button type="button" aria-pressed={raw} onClick={() => setRaw(true)}>
            Raw
          </button>
        </div>
      )}
      {raw ? (
        <pre className={styles.raw}>{value || "내용이 없습니다."}</pre>
      ) : (
        <Markdown
          className={styles.markdown}
          options={{
            forceBlock: true,
            wrapper: "div",
            disableParsingRawHTML: true,
            enforceAtxHeadings: true,
          }}
        >
          {value || "내용이 없습니다."}
        </Markdown>
      )}
    </div>
  );
}

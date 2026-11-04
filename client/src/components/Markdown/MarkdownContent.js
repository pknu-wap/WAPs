import React, { useState } from "react";
import Markdown, { sanitizer } from "markdown-to-jsx";
import styles from "./Markdown.module.css";

function sanitizeMarkdownUrl(value, tag, attribute) {
  const safeUrl = sanitizer(value, tag, attribute);
  if (safeUrl == null || tag !== "a" || attribute !== "href") return safeUrl;

  try {
    // A fixed HTTPS base allows relative URLs and fragments without trusting
    // additional schemes such as data: or blob: for clickable links.
    const { protocol } = new URL(safeUrl, "https://markdown.invalid/");
    return ["http:", "https:", "mailto:"].includes(protocol) ? safeUrl : null;
  } catch {
    return null;
  }
}

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
            sanitizer: sanitizeMarkdownUrl,
          }}
        >
          {value || "내용이 없습니다."}
        </Markdown>
      )}
    </div>
  );
}

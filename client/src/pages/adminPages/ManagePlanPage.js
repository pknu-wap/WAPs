import React, { useState } from "react";
import styles from "../../assets/Admin/ManagePlan.module.css";

const ManagePlanPage = () => {
  const [title, setTitle] = useState("");
  const [year, setYear] = useState("");
  const [monthDay, setMonthDay] = useState("");
  const [content, setContent] = useState("");
  const [target, setTarget] = useState("");

  const generatePreview = () => {
    const date = year && monthDay ? `${year}-${monthDay}` : "";
    return {
      date,
      title: title.trim(),
      content: content.trim(),
      target: target.trim(),
    };
  };

  const preview = generatePreview();
  const hasPreview =
    preview.date || preview.title || preview.content || preview.target;

  const handlePublish = async () => {
    const cleanedMonthDay = monthDay.replace(/[^0-9]/g, "").slice(0, 4);
    const fullDate =
      year && cleanedMonthDay ? `${year}-${cleanedMonthDay}` : "";

    if (!title || !fullDate || !content || !target) {
      alert("항목을 모두 입력해 주세요.");
      return;
    }

    const requestBody = {
      title,
      dateTime: fullDate,
      content,
      target,
    };

    try {
      const apiUrl = `${process.env.REACT_APP_API_BASE_URL}/admin/calendar/event`;

      const response = await fetch(apiUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(requestBody),
      });

      if (!response.ok) throw new Error("API 요청 실패");

      alert("일정이 성공적으로 발행되었습니다!");

      setTitle("");
      setYear("");
      setMonthDay("");
      setContent("");
      setTarget("");
    } catch (error) {
      console.error("일정 등록 실패:", error);
      alert("일정 등록 중 오류가 발생했습니다.");
    }
  };

  return (
    <div className={styles.container}>
      <div className={styles.title}>행사 일정</div>

      <div className={styles.pageContent}>
        {/* 입력 섹션 */}
        <div className={styles.inputSection}>
          <div className={styles.inputRow}>
            <label className={styles.label}>제목</label>
            <input
              className={styles.titleInput}
              type="text"
              placeholder="제목을 입력하세요"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
            />
          </div>

          <div className={styles.inputRow}>
            <label className={styles.label}>날짜</label>
            <div className={styles.dateInputs}>
              <input
                className={styles.dateInput}
                type="text"
                placeholder="연도"
                maxLength={4}
                value={year}
                onChange={(e) =>
                  setYear(e.target.value.replace(/[^0-9]/g, "").slice(0, 4))
                }
              />
              <input
                className={styles.dateInput}
                type="text"
                placeholder="월-일"
                value={monthDay}
                onChange={(e) => setMonthDay(e.target.value)}
              />
            </div>
          </div>

          <div className={styles.inputRow}>
            <label className={styles.label}>내용</label>
            <textarea
              className={styles.contentInput}
              placeholder="내용을 입력해주세요"
              value={content}
              onChange={(e) => setContent(e.target.value)}
            />
          </div>

          <div className={styles.targetBox}>
            <label className={styles.targetLabel}>필수 참여인원</label>
            <input
              className={styles.targetInput}
              type="text"
              value={target}
              onChange={(e) => setTarget(e.target.value)}
              placeholder="신입은 필수!"
            />
          </div>
        </div>

        {/* 미리보기 섹션 */}
        <div className={styles.previewSection}>
          <div className={styles.previewTitle}>게시글 미리보기</div>

          <div className={`${styles.scheduleBox} ${styles.previewFixedHeight}`}>
            {!hasPreview ? (
              <div className={styles.emptyPreview}></div>
            ) : (
              <>
                <div className={styles.scheduleDate}>{preview.date}</div>
                <div className={styles.scheduleTitle}>{preview.title}</div>
                <div className={styles.scheduleContent}>{preview.content}</div>
                <div className={styles.miniTarget}>#{preview.target}</div>
              </>
            )}
          </div>

          <button className={styles.publishButton} onClick={handlePublish}>
            발행
          </button>
        </div>
      </div>
    </div>
  );
};

export default ManagePlanPage;

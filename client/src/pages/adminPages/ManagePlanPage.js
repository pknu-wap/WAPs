import React, { useState } from "react";
import styles from "../../assets/Admin/ManagePlan.module.css";
import apiClient from "../../api/client";

const ManagePlanPage = () => {
  const [title, setTitle] = useState("");
  const [date, setDate] = useState("");
  const [content, setContent] = useState("");
  const [target, setTarget] = useState("");
  const [location, setLocation] = useState("");

  const generatePreview = () => {
    return {
      date: date,
      title: title.trim(),
      content: content.trim(),
      target: target.trim(),
      location: location.trim(),
    };
  };

  const preview = generatePreview();
  const hasPreview =
    preview.date || preview.title || preview.content || preview.location || preview.target;

  const handlePublish = async () => {
    if (!title || !date || !content || !target || !location) {
      alert("항목을 모두 입력해 주세요.");
      return;
    }

    // 날짜 형식: YYYY-MM-DD HH:mm
    const pattern = /^\d{4}-\d{2}-\d{2} \d{2}:\d{2}$/;
    if (!pattern.test(date)) {
      alert("날짜 형식을 지켜주세요! (예: 2025-11-20 18:30)");
      return;
    }

    // 프런트에서 ISO 타입으로 변환: 2025-11-20 18:30 → 2025-11-20T18:30:00
    const [datePart, timePart] = date.split(" ");
    const isoString = `${datePart}T${timePart}:00`;

    // 유효한 날짜인지 체크
    const dateObj = new Date(isoString);
    if (isNaN(dateObj.getTime())) {
      alert("유효한 날짜/시간을 입력해 주세요.");
      return;
    }

    const requestBody = {
      title,
      dateTime: isoString, // 서버가 인식하는 ISO 포맷
      content,
      target,
      location,
    };

    try {
      await apiClient.post("/admin/calendar/event", requestBody);
      alert("일정이 성공적으로 발행되었습니다!");

      // 입력 초기화
      setTitle("");
      setDate("");
      setContent("");
      setTarget("");
      setLocation("");
    } catch (error) {
      console.error("일정 등록 실패:", error);
      console.log("서버 응답 데이터:", error.response?.data);
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
            <input
              className={styles.dateInput}
              type="text"
              placeholder="YYYY-MM-DD HH:mm"
              value={date}
              onChange={(e) => setDate(e.target.value)}
            />
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

          <div className={styles.inputRow}>
            <label className={styles.label}>위치</label>
            <input
              className={styles.targetInput}
              type="text"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              placeholder="장소를 입력해주세요"
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
              <div className={styles.previewContent}>
                <div className={styles.scheduleDate}>{preview.date}</div>
                <div className={styles.scheduleTitle}>{preview.title}</div>
                <div className={styles.scheduleContent}>{preview.content}</div>
                {preview.location && (
                  <div className={styles.scheduleContent}>{preview.location}</div>
                )}
                <div className={styles.miniTarget}>#{preview.target}</div>
              </div>
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
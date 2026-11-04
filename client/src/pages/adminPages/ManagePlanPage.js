import React, { useState } from "react";
import styles from "../../assets/Admin/ManagePlan.module.css";
import { adminPlanApi } from "../../api/admin";

const getCurrentDateTime = () => {
  const now = new Date();
  const pad = (value) => String(value).padStart(2, "0");
  return {
    date: `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`,
    time: `${pad(now.getHours())}:${pad(now.getMinutes())}`,
  };
};

const ManagePlanPage = () => {
  const [title, setTitle] = useState("");
  const [{ date, time }, setSchedule] = useState(getCurrentDateTime);
  const [content, setContent] = useState("");
  const [target, setTarget] = useState("");
  const [location, setLocation] = useState("");

  const generatePreview = () => {
    return {
      date: [date, time].filter(Boolean).join(" "),
      title: title.trim(),
      content: content.trim(),
      target: target.trim(),
      location: location.trim(),
    };
  };

  const preview = generatePreview();
  const hasPreview =
    preview.date ||
    preview.title ||
    preview.content ||
    preview.location ||
    preview.target;

  const handlePublish = async () => {
    if (!title || !date || !time || !content || !target || !location) {
      alert("항목을 모두 입력해 주세요.");
      return;
    }

    const isoString = `${date}T${time}:00`;

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
      await adminPlanApi.createEvent(requestBody);
      alert("일정이 성공적으로 발행되었습니다!");

      // 입력 초기화
      setTitle("");
      setSchedule(getCurrentDateTime());
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
      <header>
        <h1 className={styles.title}>행사 일정 관리</h1>
        <p className={styles.description}>
          행사 정보를 입력하고 미리보기를 확인한 뒤 발행해주세요.
        </p>
      </header>

      <div className={styles.pageContent}>
        {/* 입력 섹션 */}
        <div className={styles.inputSection}>
          <div className={styles.inputRow}>
            <label className={styles.label} htmlFor="event-title">
              제목
            </label>
            <input
              className={styles.titleInput}
              type="text"
              placeholder="제목을 입력하세요"
              id="event-title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
            />
          </div>

          <fieldset className={styles.scheduleFields}>
            <legend className={styles.label}>일정</legend>
            <div className={styles.scheduleInputs}>
              <div className={styles.inputRow}>
                <input
                  className={styles.dateInput}
                  type="date"
                  id="event-date"
                  aria-label="날짜"
                  value={date}
                  onChange={(e) =>
                    setSchedule((prev) => ({ ...prev, date: e.target.value }))
                  }
                />
              </div>
              <div className={styles.timeInputs} role="group" aria-label="시각">
                <select
                  className={styles.dateInput}
                  aria-label="시"
                  value={time.split(":")[0]}
                  onChange={(e) =>
                    setSchedule((prev) => ({
                      ...prev,
                      time: `${e.target.value}:${prev.time.split(":")[1]}`,
                    }))
                  }
                >
                  {Array.from({ length: 24 }, (_, hour) => {
                    const value = String(hour).padStart(2, "0");
                    return (
                      <option key={value} value={value}>
                        {value}
                      </option>
                    );
                  })}
                </select>
                <span aria-hidden="true">:</span>
                <select
                  className={styles.dateInput}
                  aria-label="분"
                  value={time.split(":")[1]}
                  onChange={(e) =>
                    setSchedule((prev) => ({
                      ...prev,
                      time: `${prev.time.split(":")[0]}:${e.target.value}`,
                    }))
                  }
                >
                  {Array.from({ length: 60 }, (_, minute) => {
                    const value = String(minute).padStart(2, "0");
                    return (
                      <option key={value} value={value}>
                        {value}
                      </option>
                    );
                  })}
                </select>
              </div>
            </div>
          </fieldset>

          <div className={styles.inputRow}>
            <label className={styles.label} htmlFor="event-content">
              내용
            </label>
            <textarea
              className={styles.contentInput}
              placeholder="내용을 입력해주세요"
              id="event-content"
              value={content}
              onChange={(e) => setContent(e.target.value)}
            />
          </div>

          <div className={styles.targetBox}>
            <label className={styles.targetLabel} htmlFor="event-target">
              필수 참여인원
            </label>
            <input
              className={styles.targetInput}
              type="text"
              id="event-target"
              value={target}
              onChange={(e) => setTarget(e.target.value)}
              placeholder="신입은 필수!"
            />
          </div>

          <div className={styles.inputRow}>
            <label className={styles.label} htmlFor="event-location">
              위치
            </label>
            <input
              className={styles.targetInput}
              type="text"
              id="event-location"
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
              <div className={styles.emptyPreview}>
                입력한 행사 정보가 여기에 표시됩니다.
              </div>
            ) : (
              <div>
                <div className={styles.scheduleDate}>{preview.date}</div>
                <div className={styles.scheduleTitle}>{preview.title}</div>
                <div className={styles.scheduleContent}>{preview.content}</div>
                {preview.location && (
                  <div className={styles.scheduleContent}>
                    {preview.location}
                  </div>
                )}
                {preview.target && (
                  <div className={styles.miniTarget}>#{preview.target}</div>
                )}
              </div>
            )}
          </div>

          <button className={styles.publishButton} onClick={handlePublish}>
            일정 발행
          </button>
        </div>
      </div>
    </div>
  );
};

export default ManagePlanPage;

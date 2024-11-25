import React, { useRef, useEffect } from "react";
import styles from "../../assets/ProjectCreation/TextInputForm.module.css";

const TextInputForm = ({
  name,
  placeholder,
  maxLen,
  onChange,
  value,
  errorMessage = {}, // 기본값 설정
}) => {
  const textAreaRef = useRef(null); // textarea DOM 참조

  // 텍스트가 변경될 때 높이를 조정
  const handleTextAreaChange = (e) => {
    if (textAreaRef.current) {
      textAreaRef.current.style.height = "auto"; // 높이 초기화
      textAreaRef.current.style.height = `${textAreaRef.current.scrollHeight}px`; // 내용 크기에 맞게 조정
    }
    onChange(e); // 원래 onChange 호출
  };

  // 초기 렌더링 시 높이를 내용에 맞게 설정
  useEffect(() => {
    if (textAreaRef.current) {
      textAreaRef.current.style.height = "auto"; // 초기화
      textAreaRef.current.style.height = `${textAreaRef.current.scrollHeight}px`; // 내용 크기에 맞게 높이 설정
    }
  }, [value]); // value가 변경될 때마다 실행

  return (
    <div className={styles.text_input_form}>
      <div className={styles.text_input_field}>
        <div>
          <textarea
            ref={textAreaRef} // ref로 textarea 요소 참조
            name={name}
            className={styles.text_input_field}
            placeholder={placeholder}
            maxLength={maxLen}
            value={value}
            onChange={handleTextAreaChange} // 높이 조정 핸들러
            rows={1} // 최소 줄 수
            cols={32}
            spellCheck={false} // 스펠링 체크 끄기
            style={{ overflow: "hidden", resize: "none" }} // 스크롤 숨기고 크기 조정 비활성화
          />
        </div>
        <div>
          <span className="char-count">
            {value?.length || 0}/{maxLen}
          </span>
        </div>
      </div>

      {errorMessage?.[name] && ( // 오류 메시지 표시
        <p className="error-message">{errorMessage[name]}</p>
      )}
    </div>
  );
};

export default TextInputForm;

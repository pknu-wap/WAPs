// text input 파일
import React from "react";
import styles from "../../assets/ProjectCreation/TextInputForm.module.css";

// 매개변수로 받아야 하는 것
// placeholder, maxLen, value, onChange, errorMessage, name
const TextInputForm = ({
  name,
  placeholder,
  maxLen,
  onChange,
  value,
  errorMessage = {}, // 기본값 설정
}) => {
  return (
    <div className={styles.text_input_form}>
      <div className={styles.text_input_field}>
        <div>
          <input
            name={name} // 수정: name의 길이가 아닌 name 자체를 전달
            className={styles.text_input_field}
            type="text"
            placeholder={placeholder}
            maxLength={maxLen}
            value={value}
            onChange={onChange}
          />
        </div>
        <div>
          <span className="char-count">
            {value?.length || 0}/{maxLen}
          </span>
        </div>
      </div>

      {errorMessage?.[name] && ( // 옵셔널 체이닝 사용
        <p className="error-message">{errorMessage[name]}</p>
      )}
    </div>
  );
};

export default TextInputForm;

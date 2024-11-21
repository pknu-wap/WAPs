import React from "react";
import styles from "../../assets/ProjectCreation/InputPin.module.css";

const InputPin = ({ password, setPassword }) => {
  return (
    <div className={styles.input_pin_form}>
      <div className={styles.input_pin_box}>
        <label className={styles.input_pin_label}>인증번호</label>

        <input
          type="text"
          placeholder="인증번호를 입력해주세요."
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />
      </div>
    </div>
  );
};

export default InputPin;

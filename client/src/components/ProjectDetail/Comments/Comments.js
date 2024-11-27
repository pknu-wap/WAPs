import React, { useRef, useState } from "react";
import styles from "../../../assets/ProjectDetail/Comments/Comments.module.css";

const Comments = ({ projectId }) => {
  const [comments, setComments] = useState("");
  const textAreaRef = useRef(null); // textarea DOM 참조

  const handleCommentsChange = (e) => {
    setComments(e.target.value);
  };

  // 텍스트가 변경될 때 높이를 조정
  const handleTextAreaChange = (e) => {
    if (textAreaRef.current) {
      textAreaRef.current.style.height = "auto"; // 높이 초기화
      textAreaRef.current.style.height = `${textAreaRef.current.scrollHeight}px`; // 내용 크기에 맞게 조정
    }
    handleCommentsChange(e); // 원래 onChange 호출
  };
  return (
    <div>
      <hr
        style={{
          width: "100%",
          margin: "30px 0",
          border: "1px solid #363636",
        }}
      />

      <h4 className={styles.comments_title}>댓글</h4>

      <div className={styles.comments}>
        <div className={styles.comments_form}>
          <div className={styles.comments_icon}>
            <svg
              width="20"
              height="20"
              viewBox="0 0 50 50"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <mask
                id="mask0_654_57"
                maskUnits="userSpaceOnUse"
                x="0"
                y="0"
                width="34"
                height="34"
              >
                <circle cx="17.248" cy="16.9087" r="16.748" fill="#D9D9D9" />
              </mask>
              <g mask="url(#mask0_654_57)">
                <circle cx="17.248" cy="16.9087" r="16.748" fill="#333333" />
                <path
                  fill-rule="evenodd"
                  clip-rule="evenodd"
                  d="M13.2538 21.9252C12.1523 22.0546 11.1997 22.7863 10.7998 23.8412L8.24248 30.5869C7.49837 32.5498 8.94849 34.6504 11.0477 34.6504H23.4494C25.5223 34.6504 26.9706 32.5982 26.276 30.6452L23.877 23.8994C23.4551 22.7131 22.3379 21.9175 21.0809 21.9048C19.9271 22.5808 18.5837 22.9683 17.1498 22.9683C15.7304 22.9683 14.3997 22.5886 13.2538 21.9252Z"
                  fill="#707070"
                />
                <circle cx="17.2437" cy="15.1802" r="6.04395" fill="#707070" />
              </g>
            </svg>
          </div>

          <div className={styles.comments_input_form}>
            <textarea
              className={styles.comments_input}
              placeholder="댓글을 입력해주세요."
              onChange={handleTextAreaChange} // 높이 조정 핸들러
              rows={1} // 최소 줄 수
              cols={25}
              spellCheck={false} // 스펠링 체크 끄기
              style={{ overflow: "hidden", resize: "none" }} // 스크롤 숨기고 크기 조정 비활성화
              ref={textAreaRef} // ref 추가
            />

            <button className={styles.comments_button}>댓글 달기</button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Comments;

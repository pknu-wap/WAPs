import React from "react";
import axios from "axios";
import userImage from "../../../assets/img/WAP_white_NoBG.png";
import styles from "../../../assets/ProjectDetail/Comments/CommentsList.module.css";

// 코멘트 받아오기
const CommentsList = ({ comments }) => {
  // 댓글 삭제 버튼 핸들러
  const handleDelete = async (commentId) => {
    const userPasswordInput = prompt(
      "댓글 작성 시 입력한 비밀번호를 입력해주세요."
    );

    const apiUrl = `${process.env.REACT_APP_API_BASE_URL}/comment/${commentId}`;

    try {
      const response = await axios.delete(apiUrl, {
        data: {
          password: userPasswordInput,
        },
      });
      alert("댓글이 성공적으로 삭제되었습니다.");
      // console.log(response);
      window.location.reload();
    } catch (error) {
      alert("댓글 삭제에 실패했습니다.");
      // console.error("댓글 삭제 오류:", error);
    }
  };
  return (
    <div>
      {comments.map((comment) => (
        <div>
          <div className={styles.comment}>
            <img
              className={styles.comment_image}
              src={userImage}
              alt="profile"
            />
            <div className={styles.comment_info}>
              <div className={styles.user_info}>
                <div className={styles.commenter}>{comment.commenter}</div>
                <div className={styles.commentContent}>
                  {comment.commentContent}
                </div>
              </div>
              <div
                className={styles.close}
                onClick={() => handleDelete(comment.commentId)}
              ></div>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};
export default CommentsList;

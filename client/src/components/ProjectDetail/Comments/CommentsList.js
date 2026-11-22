import React, { useRef, useState } from "react";
import { commentApi } from "../../../api/comment";
import userImage from "../../../assets/img/WAP_white_NoBG.png";
import styles from "../../../assets/ProjectDetail/Comments/CommentsList.module.css";

// 코멘트 받아오기
const CommentsList = ({ comments }) => {
  const [deleting, setDeleting] = useState(false);
  const pending = useRef(false);
  // 댓글 삭제 버튼 핸들러
  const handleDelete = async (commentId) => {
    if (pending.current) return;
    pending.current = true;
    setDeleting(true);
    try {
      await commentApi.deleteComment(commentId);
      alert("댓글이 삭제되었습니다.");
      window.location.reload();
    } catch (error) {
      const status = error.response?.status;
      const messages = {
        401: "댓글 삭제는 로그인 후에 가능합니다.",
        403: "댓글 삭제 권한이 없습니다.",
        404: "댓글을 찾을 수 없습니다. 새로고침해주세요.",
      };
      alert(messages[status] || "댓글 삭제에 실패했습니다. 다시 시도해주세요.");
      pending.current = false;
      setDeleting(false);
    }
  };
  return (
    <div>
      {comments.map((comment) => (
        <div key={comment.commentId}>
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
              <button
                type="button"
                aria-label={`${comment.commenter} 댓글 삭제`}
                disabled={deleting}
                className={styles.close}
                onClick={() => handleDelete(comment.commentId)}
              />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};
export default CommentsList;

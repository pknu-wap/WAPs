import React from "react";
import userImage from "../../../assets/img/WAP_white_NoBG.png";
import styles from "../../../assets/ProjectDetail/Comments/CommentsList.module.css";

const CommentsList = ({ comments }) => {
  return (
    <div>
      {comments.map((comment) => (
        <div>
          <div className={styles.comments_info}>
            <img className={styles.user_image} src={userImage} alt="profile" />
            <div className={styles.user_info}>
              <div className={styles.commenter}>{comment.commenter}</div>
              <div className={styles.commentContent}>
                {comment.commentContent}
              </div>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};
export default CommentsList;

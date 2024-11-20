import React from "react";
import dogImage from "../../assets/img/dog.png";

const VoteForm = () => {
  return (
    <div>
      {
        <h4
          style={{
            color: "white",
            textAlign: "center",
          }}
        >
          투표 페이지로 사용될 예정입니다.
        </h4>
      }

      <img
        src={dogImage}
        alt="임시 이미지"
        style={{
          width: "100%", // 부모 요소의 너비에 맞게 이미지 크기 조정
          height: "auto", // 높이는 자동으로 비율 유지
          objectFit: "contain", // 이미지 비율을 유지하며 부모 요소에 맞게 이미지 크기 조정
        }}
      ></img>
    </div>
  );
};
export default VoteForm;

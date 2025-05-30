// src/components/ImageUploader.js
import React, { useRef } from "react";
import styles from "../../assets/ProjectCreation/ProjectForm.module.css";

const ImageUploader = ({
  index,
  imgText,
  imgName,
  errorMessage,
  handleImgUpload,
  handleRemoveImage,
}) => {
  const fileInputRef = useRef(null);

  const handleClick = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  const handleFileChange = (event) => {
    const file = event.target.files[0];
    if (file) {
      handleImgUpload(file);
      event.target.value = ""; // 초기화
    }
  };

  return (
    <div className={styles.image_uploader}>
      {!imgName && (
        <>
          <label style={{ marginBottom: "15px" }}>{imgText}</label>

          <svg
            id="custom_image_uploader"
            width="31"
            height="31"
            viewBox="0 0 31 31"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            onClick={handleClick}
            style={{ cursor: "pointer" }}
          >
            <path
              d="M15.5 0C6.93935 0 0 6.93935 0 15.5C0 24.0606 6.93935 31 15.5 31C24.0606 31 31 24.0606 31 15.5C31 6.93935 24.0606 0 15.5 0ZM21.7 17.05H17.05V21.7C17.05 22.5556 16.3556 23.25 15.5 23.25C14.6444 23.25 13.95 22.5556 13.95 21.7V17.05H9.3C8.4444 17.05 7.75 16.3556 7.75 15.5C7.75 14.6444 8.4444 13.95 9.3 13.95H13.95V9.3C13.95 8.4444 14.6444 7.75 15.5 7.75C16.3556 7.75 17.05 8.4444 17.05 9.3V13.95H21.7C22.5556 13.95 23.25 14.6444 23.25 15.5C23.25 16.3556 22.5556 17.05 21.7 17.05Z"
              fill="#EFEFEF"
            />
          </svg>

          <input
            ref={fileInputRef}
            className={styles.img_upload_btn}
            type="file"
            accept="image/*"
            onChange={handleFileChange}
            style={{ display: "none" }}
          />
        </>
      )}

      {imgName && (
        <div
          className={styles.image_preview}
          onClick={() => handleRemoveImage(index)}
          style={{ cursor: "pointer" }}
        >
          <div className={styles.preview_text}>
            이미지를 클릭하면 삭제됩니다.
          </div>
          <img
            src={
              imgName instanceof File ? URL.createObjectURL(imgName) : imgName
            }
            alt="Image Preview"
            style={{
              width: "100%",
              maxHeight: "282px",
              objectFit: "contain",
            }}
          />
        </div>
      )}

      {errorMessage && <p className="error-message">{errorMessage}</p>}
    </div>
  );
};

export default ImageUploader;

import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import Cookies from "js-cookie";
import axios from "axios";
import styles from "../../assets/ProjectDetail/ProjectDetailForm.module.css";
import dogImage from "../../assets/img/dog.png";
import useProjectDetailForm from "../../hooks/ProjectDetail/useProjectDetailForm";
import EditButton from "./EditButton";
import { useNavigate } from "react-router-dom";

const ProjectDetailForm = () => {
  const { projectId } = useParams();
  const navigate = useNavigate();

  const {
    thumnail_image,
    title,
    projectType,
    summary,
    content,
    semester,
    projectYear,
    teamMembers,
    techStacks,
    images,

    setThumnail_image,
    setTitle,
    setProjectType,
    setSummary,
    setContent,
    setSemester,
    setProjectYear,
    setTeamMembers,
    setTechStacks,
    setImages,
  } = useProjectDetailForm();

  // 서버경로
  const apiUrl = `${process.env.REACT_APP_API_BASE_URL_PROXY}/api/project/${projectId}`;

  useEffect(() => {
    const fetchProjectDetails = async () => {
      try {
        const response = await axios.get(apiUrl);
        const data = response.data;

        setThumnail_image(data.thumbnail);
        setTitle(data.title);
        setProjectType(data.projectType);
        setSummary(data.summary);
        setContent(data.content);
        setSemester(data.semester);
        setProjectYear(data.projectYear);
        setTeamMembers(data.teamMember);
        setTechStacks(data.techStack);
        setImages(data.images);
      } catch (error) {
        console.error("Failed to fetch project details", error);
        setThumnail_image();
        setTitle("");
        setProjectType("");
        setSummary("");
        setContent("");
        setSemester("");
        setProjectYear("");
        setTeamMembers([]);
        setTechStacks([]);
        setImages([null, null, null, null]);
      }
    };

    fetchProjectDetails();
  }, [
    apiUrl,
    setThumnail_image,
    setTitle,
    setProjectType,
    setSummary,
    setContent,
    setSemester,
    setProjectYear,
    setTeamMembers,
    setTechStacks,
    setImages,
  ]);

  return (
    <div className={styles.project_detail_form}>
      <img
        className={styles.thumnail_image}
        src={thumnail_image ? thumnail_image : null}
        alt={thumnail_image ? "Fetched content" : "Default content"}
      />
      <div className={styles.project_detail_box}>
        <div className={styles.project_detail_title}>
          <div className={styles.title}>{title ? title : "No title"}</div>
          <div className={styles.project_info}>
            <div className={styles.project_year_info}>
              <div className={styles.projectYear}>
                {projectYear ? projectYear : "No Year"}
              </div>
              <div>-</div>
              <div className={styles.semester}>{semester ? semester : "1"}</div>
            </div>
            <div className={styles.project_type_info}>
              {projectType ? projectType : "No type"}
            </div>
          </div>
        </div>
        <div className={styles.project_detail_content}>
          <div className={styles.summary}>
            {summary ? summary : "No Summary"}
          </div>
          <div className={styles.content}>
            {content ? content : "No Content"}
          </div>
        </div>
      </div>

      <div className={styles.images}>
        {images && images.length > 0 ? (
          images.map((image, index) => (
            <img
              key={index}
              className={styles.image}
              src={image ? image["imageFile"] : null} // image가 null이면 기본 이미지를 표시
              alt={`Fetched content ${index + 1}`}
            />
          ))
        ) : (
          <img className={styles.image} src={dogImage} alt="Default content" />
        )}
      </div>
      <div className={styles.projectListInfo}>
        <div className={styles.teamMembers}>
          <label>Team</label>
          <div className={styles.member}>
            {teamMembers && teamMembers.length > 0 ? (
              teamMembers.map((member, index) => (
                <div className={styles.memberInfo} key={index}>
                  <div className={styles.memberName}>{member.memberName}</div>
                  <div className={styles.memberRole}>{member.memberRole}</div>
                </div>
              ))
            ) : (
              <div className={styles.memberInfo}>
                <div className={styles.memberName}>No name</div>
                <div className={styles.memberRole}>No rule</div>
              </div>
            )}
          </div>
        </div>

        <div className={styles.techStacks}>
          <label>Stack</label>
          <div className={styles.techStack}>
            {techStacks && techStacks.length > 0 ? (
              techStacks.map((techStack, index) => (
                <div className={styles.techStackInfo} key={index}>
                  <div className={styles.techStackName}>
                    {techStack.techStackName}
                  </div>
                  <div className={styles.techStackType}>
                    {techStack.techStackType}
                  </div>
                </div>
              ))
            ) : (
              <div className={styles.techStackInfo}>
                <div className={styles.techStackName}>No TechStack</div>
                <div className={styles.techStackType}>No TechStackType</div>
              </div>
            )}
          </div>
        </div>
      </div>
      {/* 수정 버튼 */}
      <EditButton projectId={projectId} />
    </div>
  );
};

export default ProjectDetailForm;

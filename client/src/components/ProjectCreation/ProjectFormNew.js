import {
  MAX_PROJECT_TITLE_LENGTH,
  MAX_PROJECT_SUMMARY_LENGTH,
  MAX_PROJECT_CONTENT_LENGTH,
} from "../../constants/project";
import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";

import { projectApi } from "../../api/project";
import { userApi } from "../../api/user";
import styles from "../../assets/ProjectCreation/ProjectForm.module.css";
import useProjectForm from "../../hooks/ProjectCreation/useProjectForm";
import ImageUploader from "./ImageUploader";
import RadioButton from "./RadioButton";
import TextInputForm from "./TextInputForm";
import MarkdownEditor from "../Markdown/MarkdownEditor";
import TechStackSelector from "./TechStackSelector";
import TeamMemberInputForm from "./TeamMemberInputForm";
import InputPin from "./InputPin";
import RecruitmentPositionInput, {
  recruitmentPositionsError,
} from "./RecruitmentPositionInput";

// 사용성을 높인 버전의 프로젝트 생성 폼

const projectTypeOptions = ["WEB", "APP", "GAME", "기타"];
const roleOptions = [
  "PM",
  "Client",
  "Server",
  "Designer",
  "AI",
  "Game",
  "Hardware",
  "FullStack",
  "기타",
];

const formatSemester = (semester) => {
  if (!semester) {
    return "학기 정보 없음";
  }

  const [year, semesterValue] = semester.split("-");
  return `${year}년 ${Number(semesterValue)}학기`;
};

const ProjectFormNew = ({ isEdit = false, existingProject = null }) => {
  const { projectId } = useParams();
  const maxImageCount = 4; // 최대 이미지 업로드 개수
  const navigate = useNavigate(); // navigate 함수
  const [recruitmentPositions, setRecruitmentPositions] = useState([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(null);
  const [isSemesterLoading, setIsSemesterLoading] = useState(!isEdit);
  const [semesterError, setSemesterError] = useState("");
  const [memberOptions, setMemberOptions] = useState([]);
  const [membersLoading, setMembersLoading] = useState(true);
  const [membersError, setMembersError] = useState("");
  const [membersRetry, setMembersRetry] = useState(0);
  const {
    title,
    setTitle,
    projectType,
    setProjectType,
    content,
    setContent,
    summary,
    setSummary,
    semester,
    setSemester,
    teamMembers,
    setTeamMembers,
    thumbnail,
    setThumbnail,
    images,
    setImages,
    selectedTechStacks,
    setSelectedTechStacks,
    uploading,
    uploadError,
    errorMessage,
    password,
    handleImgUpload,
    handleRemoveImage,
    handleMemberSelect,
    handleRoleChange,
    addTeamMember,
    handleRemoveTeamMember,
    handleInputLimit,
    toggleTechStack,
    resetForm,
    setPassword,
    // validateForm,
    removalList,
    // setRemovalList,
  } = useProjectForm();

  useEffect(() => {
    if (isEdit) {
      return;
    }

    let ignore = false;

    const fetchCurrentSemester = async () => {
      setIsSemesterLoading(true);
      setSemesterError("");

      try {
        const data = await projectApi.getCurrentSemester();
        if (!ignore) {
          setSemester(data.semester);
        }
      } catch (error) {
        if (!ignore) {
          setSemester("");
          setSemesterError("현재 학기 정보를 불러오지 못했습니다.");
        }
      } finally {
        if (!ignore) {
          setIsSemesterLoading(false);
        }
      }
    };

    fetchCurrentSemester();

    return () => {
      ignore = true;
    };
  }, [isEdit, setSemester]);

  useEffect(() => {
    let ignore = false;
    setMembersLoading(true);
    setMembersError("");
    Promise.all([
      projectApi.getMemberOptions(),
      isEdit ? Promise.resolve(null) : userApi.getMe(),
    ])
      .then(([members, currentUser]) => {
        if (ignore) return;
        setMemberOptions(members);
        const defaultMember = members.find(
          (member) => member.userId === currentUser?.userId,
        );
        if (!isEdit && defaultMember) {
          setTeamMembers((previous) => {
            if (previous[0]?.userId || previous[0]?.memberName) return previous;
            return [{ ...previous[0], ...defaultMember }, ...previous.slice(1)];
          });
        }
      })
      .catch(() => {
        if (!ignore) setMembersError("회원 목록을 불러오지 못했습니다.");
      })
      .finally(() => {
        if (!ignore) setMembersLoading(false);
      });
    return () => {
      ignore = true;
    };
  }, [membersRetry, isEdit, setTeamMembers]);

  // 기존 데이터 초기화
  useEffect(() => {
    if (isEdit && existingProject) {
      setRecruitmentPositions(existingProject.recruitmentPositions || []);
      setThumbnail(existingProject.thumbnail || null);
      setSemester(existingProject.semester || "");
      setProjectType(existingProject.projectType || "");
      setTitle(existingProject.title || "");
      setSummary(existingProject.summary || "");
      setContent(existingProject.content || "");
      // 이미지 처리
      if (Array.isArray(existingProject.images)) {
        setImages(existingProject.images.map((img) => img.imageFile));
      }
      // 멤버가 존재하면 추가
      if (Array.isArray(existingProject.teamMember)) {
        setTeamMembers([
          ...existingProject.teamMember,
          { userId: null, memberName: "", memberRole: "" },
        ]);
      }
      setSelectedTechStacks(existingProject.techStack || []);
      setPassword("");
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isEdit, existingProject]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (isSubmitting) return;

    if (!semester) {
      alert("현재 학기 정보를 불러온 뒤 다시 시도해 주세요.");
      return;
    }

    if (!password) {
      alert("비밀번호를 입력해 주세요.");
      return;
    }

    const recruitmentError = recruitmentPositionsError(
      recruitmentPositions,
      !isEdit,
    );
    if (recruitmentError) {
      alert(recruitmentError);
      return;
    }

    const selectedMembers = teamMembers.filter(
      (member) => member.userId || member.memberName || member.memberRole,
    );
    if (
      selectedMembers.some((member) => !member.userId || !member.memberRole)
    ) {
      alert("등록된 회원과 역할을 선택해 주세요.");
      return;
    }
    if (
      new Set(selectedMembers.map((member) => member.userId)).size !==
      selectedMembers.length
    ) {
      alert("같은 회원을 중복 등록할 수 없습니다.");
      return;
    }

    setUploadProgress(null);
    setIsSubmitting(true);
    let requestActive = true;
    const onUploadProgress = ({ loaded, total }) => {
      if (!requestActive) return;
      setUploadProgress(
        Number.isFinite(total) && total > 0 && Number.isFinite(loaded)
          ? Math.min(100, Math.max(0, Math.floor((loaded / total) * 100)))
          : null,
      );
    };

    const formData = new FormData();
    const projectData = {
      recruitmentPositions: recruitmentPositions.map(({ role, count }) => ({
        role: role.trim(),
        count: Number(count),
      })),
      title,
      projectType,
      content,
      summary,
      teamMember: selectedMembers.map((member) => ({
        userId: member.userId,
        memberRole: member.memberRole,
      })),
      techStack: selectedTechStacks.map((stack) => ({
        techStackName: stack.techStackName,
        techStackType: stack.techStackType,
      })),
      password,
    };
    const editedProjectData = {
      ...projectData,
      removal: removalList,
    };
    const blob = new Blob(
      [JSON.stringify(isEdit ? editedProjectData : projectData)],
      { type: "application/json" },
    );
    formData.append("project", blob);
    if (thumbnail instanceof File) {
      formData.append("thumbnail", thumbnail);
    }
    images.forEach((image) => {
      if (image instanceof File) {
        formData.append("image", image);
      }
    });
    try {
      if (isEdit) {
        await projectApi.updateProject(projectId, formData, onUploadProgress);

        alert("프로젝트가 성공적으로 수정되었습니다.");
        navigate(`/project/${projectId}`);
      } else {
        await projectApi.createProject(formData, onUploadProgress);
        alert("프로젝트가 성공적으로 생성되었습니다.");
        navigate(`/ProjectPage`);
      }
      resetForm();
    } catch (error) {
      alert(
        error.response?.data?.code === "PROJECT_PASSWORD_INVALID"
          ? "올바른 인증번호를 입력해주세요."
          : error.code === "ECONNABORTED" || error.code === "ETIMEDOUT"
            ? "업로드 요청 시간이 초과되었습니다. 다시 시도해 주세요."
            : "프로젝트 요청에 실패했습니다. 다시 시도해 주세요.",
      );
    } finally {
      requestActive = false;
      setIsSubmitting(false);
      setUploadProgress(null);
    }
  };

  return (
    <form
      className={`${styles.project_form} ${styles.mount1}`}
      onSubmit={handleSubmit}
      aria-busy={isSubmitting}
    >
      <fieldset
        disabled={isSubmitting}
        style={{ border: 0, margin: 0, padding: 0, minInlineSize: 0 }}
      >
        <ImageUploader
          imgText={"메인 이미지 등록"}
          imgName={thumbnail}
          errorMessage={errorMessage.thumbnail}
          handleImgUpload={(file) => handleImgUpload(file, "thumbnail")}
          handleRemoveImage={() => handleRemoveImage("thumbnail", null)}
          type="thumbnail"
        />
        <div className={styles.semester_fixed_box}>
          <span className={styles.semester_label}>학기</span>
          <span className={styles.semester_value}>
            {isSemesterLoading
              ? "현재 학기 확인 중..."
              : formatSemester(semester)}
          </span>
        </div>
        {semesterError && (
          <p className={styles.semester_error}>{semesterError}</p>
        )}
        <RadioButton
          labelname={"프로젝트 타입"}
          name="projectType"
          options={projectTypeOptions}
          selected={projectType}
          setSelected={setProjectType}
        />
        <TextInputForm
          name="title"
          placeholder="프로젝트 명"
          maxLen={MAX_PROJECT_TITLE_LENGTH}
          value={title}
          onChange={(e) => {
            setTitle(e.target.value);
            handleInputLimit(e);
          }}
          errorMessage={errorMessage}
        />
        <TextInputForm
          name="summary"
          placeholder="한줄 소개"
          maxLen={MAX_PROJECT_SUMMARY_LENGTH}
          value={summary}
          onChange={(e) => {
            setSummary(e.target.value);
            handleInputLimit(e);
          }}
          errorMessage={errorMessage}
        />
        <MarkdownEditor
          disabled={isSubmitting}
          value={content}
          onChange={setContent}
          maxLength={MAX_PROJECT_CONTENT_LENGTH}
          error={errorMessage.content}
        />
        <div className={styles.images}>
          {Array.from({ length: maxImageCount }).map((_, index) => (
            <ImageUploader
              key={index}
              index={index} // 삭제용 index 전달
              imgText={`이미지 등록 ${index + 1}`}
              imgName={images[index] || null}
              errorMessage={errorMessage[`image${index}`]}
              handleImgUpload={(file) => handleImgUpload(file, "image", index)}
              handleRemoveImage={(i) => handleRemoveImage("image", i)}
              type="image"
            />
          ))}
        </div>
        <div className="form-group">
          {membersError && (
            <p role="alert">
              {membersError}{" "}
              <button
                type="button"
                onClick={() => setMembersRetry((retry) => retry + 1)}
              >
                다시 시도
              </button>
            </p>
          )}
          {teamMembers.map((member, index) => (
            <TeamMemberInputForm
              key={index}
              member={member}
              index={index}
              handleMemberSelect={handleMemberSelect}
              memberOptions={memberOptions}
              membersLoading={membersLoading}
              handleRoleChange={handleRoleChange}
              roleOptions={roleOptions}
              addTeamMember={addTeamMember}
              handleRemoveTeamMember={handleRemoveTeamMember}
              teamMembers={teamMembers}
            />
          ))}
        </div>

        <RecruitmentPositionInput
          required={!isEdit}
          positions={recruitmentPositions}
          onChange={setRecruitmentPositions}
        />
        <TechStackSelector
          selectedTechStacks={selectedTechStacks}
          toggleTechStack={toggleTechStack}
        />
        <InputPin password={password} setPassword={setPassword} />
        {uploadError && <p className="error-message">{uploadError}</p>}
        {isSubmitting && (
          <div className={styles.upload_progress}>
            <progress
              aria-label="프로젝트 업로드 진행률"
              max="100"
              value={uploadProgress ?? undefined}
            />
            <p role="status">
              {uploadProgress === 100
                ? "저장 처리 중…"
                : uploadProgress === null
                  ? "업로드 중…"
                  : `업로드 중… ${uploadProgress}%`}
            </p>
          </div>
        )}
        <button
          type="submit"
          className={styles.submit_button}
          disabled={uploading || isSubmitting || isSemesterLoading || !semester}
          style={{
            marginTop: "20px",
            marginBottom: "100px",
            cursor:
              isSubmitting || isSemesterLoading || !semester
                ? "not-allowed"
                : "pointer",
          }}
        >
          {isSubmitting
            ? uploadProgress === 100
              ? "저장 처리 중…"
              : "업로드 중..."
            : isEdit
              ? "프로젝트 수정"
              : "프로젝트 생성"}
        </button>
      </fieldset>
    </form>
  );
};

export default ProjectFormNew;

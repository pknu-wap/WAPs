import React, { useState } from "react";

const NameChange = ({
  currentName,
  onClose,
  onChangeName,
}) => {
  const [step, setStep] = useState(1);
  const [newName, setNewName] = useState("");

  // 1단계 → 2단계
  const handleNext = () => {
    const trimmedName = newName.trim();

    if (!trimmedName) {
      alert("변경할 이름을 입력해주세요.");
      return;
    }

    if (trimmedName === currentName) {
      alert("현재 이름과 동일합니다.");
      return;
    }

    setNewName(trimmedName);
    setStep(2);
  };

  // 최종 변경
  const handleConfirm = () => {
    onChangeName(newName);
  };

  return (
    <div
      className="name-modal-overlay"
      onClick={onClose}
    >
      <div
        className="name-modal"
        onClick={(e) => e.stopPropagation()}
      >
        {/* 닫기 버튼 */}
        <button
          type="button"
          className="name-modal-close"
          onClick={onClose}
        >
          <span></span>
          <span></span>
        </button>

        {step === 1 && (
          <>
            <h2 className="name-modal-title">
              이름 변경
            </h2>

            <p className="name-modal-description">
              WAPs에 쓰일 이름은 반드시 본명으로 설정해주세요!
            </p>

            <label
              htmlFor="new-name"
              className="name-modal-label"
            >
              변경할 이름
            </label>

            <input
              id="new-name"
              type="text"
              className="name-modal-input"
              placeholder="변경할 이름을 입력해주세요."
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  handleNext();
                }
              }}
              autoFocus
            />

            <button
              type="button"
              className="name-modal-button"
              onClick={handleNext}
            >
              이름 변경하기
            </button>
          </>
        )}

        {step === 2 && (
          <div className="name-confirm-content">

            <h2 className="name-confirm-title">
              '{newName}'으로 이름 변경을
              <br />
              진행하시겠습니까?
            </h2>

            <p className="name-modal-description">
              다시 한번 확인해주시기 바랍니다.
            </p>

            <button
              type="button"
              className="name-modal-button confirm-name-button"
              onClick={handleConfirm}
            >
              이름 변경하기
            </button>

          </div>
        )}
      </div>
    </div>
  );
};

export default NameChange;
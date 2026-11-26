import React, { useEffect, useRef, useState } from "react";

const NameChange = ({
  currentName,
  onClose,
  onChangeName,
  isSaving = false,
}) => {
  const [step, setStep] = useState(1);
  const [newName, setNewName] = useState("");
  const dialogRef = useRef(null);
  const returnFocus = useRef(document.activeElement);

  useEffect(() => {
    const trigger = returnFocus.current;
    return () => trigger?.focus();
  }, []);

  useEffect(() => {
    const dialog = dialogRef.current;
    const target = dialog.querySelector(
      "input, .confirm-name-button:not(:disabled)",
    );
    (target || dialog).focus();
  }, [step, isSaving]);

  const handleDialogKeyDown = (event) => {
    if (event.nativeEvent.isComposing || event.keyCode === 229) return;
    if (event.key === "Escape") {
      event.preventDefault();
      event.stopPropagation();
      if (!isSaving) onClose();
    }
    if (event.key === "Tab") {
      const controls = [
        ...dialogRef.current.querySelectorAll(
          "button:not(:disabled), input:not(:disabled)",
        ),
      ];
      const first = controls[0];
      const last = controls[controls.length - 1];
      if (!first) {
        event.preventDefault();
        dialogRef.current.focus();
      } else if (
        event.shiftKey &&
        (document.activeElement === first ||
          document.activeElement === dialogRef.current)
      ) {
        event.preventDefault();
        last.focus();
      } else if (
        !event.shiftKey &&
        (document.activeElement === last ||
          document.activeElement === dialogRef.current)
      ) {
        event.preventDefault();
        first.focus();
      }
    }
  };
  const handleNext = () => {
    const trimmedName = newName.trim();

    if (!trimmedName) {
      alert("변경할 이름을 입력해주세요.");
      return;
    }
    if (trimmedName.length > 4) {
      alert("이름은 4자 이내로 입력해주세요.");
      return;
    }

    if (trimmedName === currentName) {
      alert("현재 이름과 동일합니다.");
      return;
    }

    setNewName(trimmedName);
    setStep(2);
  };

  const handleConfirm = () => {
    onChangeName(newName);
  };

  return (
    <div
      className="name-modal-overlay"
      onClick={() => {
        if (!isSaving) onClose();
      }}
    >
      <div
        className="name-modal"
        ref={dialogRef}
        tabIndex={-1}
        onKeyDown={handleDialogKeyDown}
        role="dialog"
        aria-modal="true"
        aria-label="이름 변경"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          type="button"
          className="name-modal-close"
          aria-label="이름 변경 닫기"
          onClick={onClose}
          disabled={isSaving}
        >
          <span></span>
          <span></span>
        </button>

        {step === 1 && (
          <>
            <h2 className="name-modal-title">이름 변경</h2>

            <p className="name-modal-description">
              WAPs에 쓰일 이름은 반드시 본명으로 설정해주세요!
            </p>

            <label htmlFor="new-name" className="name-modal-label">
              변경할 이름
            </label>

            <input
              id="new-name"
              type="text"
              className="name-modal-input"
              placeholder="변경할 이름을 입력해주세요."
              maxLength={4}
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              onKeyDown={(e) => {
                if (e.nativeEvent.isComposing || e.keyCode === 229) return;
                if (e.key === "Enter") {
                  handleNext();
                }
              }}
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
              ‘{newName}’으로 이름 변경을
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
              disabled={isSaving}
            >
              {isSaving ? "저장 중..." : "이름 변경하기"}
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default NameChange;

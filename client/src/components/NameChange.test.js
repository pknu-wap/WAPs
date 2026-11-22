import { fireEvent, render, screen } from "@testing-library/react";
import "@testing-library/jest-dom";
import NameChange from "./NameChange";
import userEvent from "@testing-library/user-event";

test("모달에서 포커스를 순환하고 Escape 취소 후 원래 버튼으로 복귀한다", () => {
  const trigger = document.createElement("button");
  document.body.appendChild(trigger);
  trigger.focus();
  const close = jest.fn();
  const { unmount } = render(
    <NameChange currentName="기존" onClose={close} onChangeName={jest.fn()} />,
  );
  expect(screen.getByLabelText("변경할 이름")).toHaveFocus();
  userEvent.tab();
  expect(screen.getByRole("button", { name: "이름 변경하기" })).toHaveFocus();
  userEvent.tab();
  expect(screen.getByRole("button", { name: "이름 변경 닫기" })).toHaveFocus();
  userEvent.tab({ shift: true });
  expect(screen.getByRole("button", { name: "이름 변경하기" })).toHaveFocus();
  userEvent.keyboard("{Escape}");
  expect(close).toHaveBeenCalledTimes(1);
  unmount();
  expect(trigger).toHaveFocus();
  trigger.remove();
});

test("확인 단계에 포커스를 옮기고 저장 중 Escape 취소를 막는다", () => {
  const close = jest.fn();
  const props = {
    currentName: "기존",
    onClose: close,
    onChangeName: jest.fn(),
  };
  const { rerender } = render(<NameChange {...props} />);
  fireEvent.change(screen.getByLabelText("변경할 이름"), {
    target: { value: "새이름" },
  });
  userEvent.click(screen.getByRole("button", { name: "이름 변경하기" }));
  expect(screen.getByRole("button", { name: "이름 변경하기" })).toHaveFocus();
  rerender(<NameChange {...props} isSaving />);
  userEvent.keyboard("{Escape}");
  userEvent.tab();
  expect(close).not.toHaveBeenCalled();
  expect(screen.getByRole("dialog")).toHaveFocus();
});

test.each([{ isComposing: true }, { keyCode: 229 }])(
  "한글 조합 확정 Enter는 확인 단계로 이동하지 않는다: %j",
  (composition) => {
    const save = jest.fn();
    render(
      <NameChange currentName="기존" onClose={jest.fn()} onChangeName={save} />,
    );
    const input = screen.getByLabelText("변경할 이름");
    fireEvent.change(input, { target: { value: "홍길동" } });
    fireEvent.keyDown(input, { key: "Enter", ...composition });
    expect(screen.getByLabelText("변경할 이름")).toHaveValue("홍길동");
    expect(save).not.toHaveBeenCalled();
    fireEvent.keyDown(input, { key: "Enter", isComposing: false, keyCode: 13 });
    expect(screen.queryByLabelText("변경할 이름")).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "이름 변경하기" }));
    expect(save).toHaveBeenCalledWith("홍길동");
  },
);

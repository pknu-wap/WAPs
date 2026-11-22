import { fireEvent, render, screen } from "@testing-library/react";
import "@testing-library/jest-dom";
import NameChange from "./NameChange";

test.each([
  { isComposing: true },
  { keyCode: 229 },
])("한글 조합 확정 Enter는 확인 단계로 이동하지 않는다: %j", (composition) => {
  const save = jest.fn();
  render(<NameChange currentName="기존" onClose={jest.fn()} onChangeName={save} />);
  const input = screen.getByLabelText("변경할 이름");
  fireEvent.change(input, { target: { value: "홍길동" } });
  fireEvent.keyDown(input, { key: "Enter", ...composition });
  expect(screen.getByLabelText("변경할 이름")).toHaveValue("홍길동");
  expect(save).not.toHaveBeenCalled();
  fireEvent.keyDown(input, { key: "Enter", isComposing: false, keyCode: 13 });
  expect(screen.queryByLabelText("변경할 이름")).not.toBeInTheDocument();
  fireEvent.click(screen.getByRole("button", { name: "이름 변경하기" }));
  expect(save).toHaveBeenCalledWith("홍길동");
});

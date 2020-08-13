import { Input, Notice } from "uc_components";

const { InputWithTip, Number } = Input;
const { Test } = Notice;
export default () => (
  <div>
    <InputWithTip size="md" type="text" value={text} tip="tip" />
    <Input.Number
      min={1}
      max={12}
      size="sm"
      onChange={(value) => {
        console.log("onChange: ", value);
      }}
    />
    <Number min={1} max={12} />
  </div>
);

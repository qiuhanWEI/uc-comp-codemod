import { Input } from "uc_components";
export default () => (
  <div>
    <Input size="md" type="text" tip="tip" />
    <Input.Number
      min={1}
      max={12}
      size="sm"
      onChange={(value) => {
        console.log("onChange: ", value);
      }}
    />
    <NumberInput min={1} max={12} />
  </div>
);

import { Checkbox } from "uc_components";

const { Group } = Checkbox;

const size = "sm";
const value = "xxx";

export default () => (
  <div>
    <Group
      className="u-mt8"
      size="medium"
      values={value}
      onChange={this.onDaysChange.bind(this)}
    >
      <Checkbox value="MONDAY">1</Checkbox>
      <Checkbox value="2">2</Checkbox>
    </Group>

    <Checkbox.Group
      className="u-mt8"
      size={size}
      values={value}
      onChange={this.onStrategyChange}
    >
      <Checkbox value="7Days" disabled></Checkbox>
    </Checkbox.Group>
  </div>
);

import { Slider } from "uc_components";

const width = 100;
const size = "sm";
const value = "xxx";

export default () => (
  <div>
    <Slider
      value={value}
      unit="G"
      size="sm"
      limit={10}
      min={1}
      max={200}
      onLastChange={this._handleChangeDisk.bind(this)}
    />
    <Slider
      width={width}
      unit="G"
      size={size}
      limit={10}
      min={1}
      max={200}
      onLastChange={this._handleChangeDisk.bind(this)}
    />
  </div>
);

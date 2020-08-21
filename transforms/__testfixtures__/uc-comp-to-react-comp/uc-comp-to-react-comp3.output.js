import { Slider } from "react_components";

const width = 100;
const size = "sm";
const value = "xxx";

export default () => (
  <div>
    <Slider
      value={value}
      size="sm"
      step={10}
      min={1}
      max={200}
      onChange={this._handleChangeDisk.bind(this)}
      numberInput={{
        suffix: "G"
      }}
    />
    <Slider
      size={size}
      step={10}
      min={1}
      max={200}
      onLastChange={this._handleChangeDisk.bind(this)}
      sliderStyle={{
        width: width
      }}
      numberInput={{
        suffix: "G"
      }}
    />
  </div>
);

"use strict";

module.exports = function (j, root) {
  const Btn = require("./Button.js")(j, root);
  const Notice = require("./Notice.js")(j, root);
  const Input = require("./Input.js")(j, root);
  const Tip = require("./Tip.js")(j, root);
  const Loading = require("./Loading.js")(j, root);
  const Radio = require("./Radio.js")(j, root);
  const Select = require("./Select.js")(j, root);
  const Icon = require("./Icon.js")(j, root);
  const Checkbox = require("./Checkbox.js")(j, root);
  const Switch = require("./Switch.js")(j, root);
  const Slider = require("./Slider.js")(j, root);

  return {
    ...Btn,
    ...Input,
    ...Checkbox,
    Notice,
    Tip,
    Radio,
    Loading,
    Select,
    Icon,
    Switch,
    Slider,
  };
};

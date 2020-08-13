"use strict";

module.exports = function (j, root) {
  const Btn = require("./Button.js")(j, root);
  const Notice = require("./Notice.js")(j, root);
  const Input = require("./Input.js")(j, root);
  const Tip = require("./Tip.js")(j, root);
  const Loading = require("./Loading.js")(j, root);
  const Radio = require("./Radio.js")(j, root);

  return { ...Btn, ...Input, Notice, Tip, Radio, Loading };
};

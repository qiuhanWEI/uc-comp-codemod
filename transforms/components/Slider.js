"use strict";

module.exports = function (j, root) {
  const utils = require("../utils")(j, root);
  const { modifyAttributes, getAttribute } = utils;

  return {
    old: "Slider",
    transAttribute: (attributes) => {
      let modifyAttr = [
        { oldAttr: "limit", newAttr: "step" },
        { oldAttr: "unit", newAttr: null },
        { oldAttr: "width", newAttr: null },
      ];

      let newAttr = [];
      const width = getAttribute(attributes, "width");
      if (width) {
        const widthProperty = j.property(
          "init",
          j.identifier("width"),
          typeof width === "number"
            ? j.numericLiteral(width)
            : j.identifier(width)
        );
        newAttr.push({
          label: "sliderStyle",
          value: j.objectExpression([widthProperty]),
        });
      }

      const unit = getAttribute(attributes, "unit");
      if (unit) {
        const unitProperty = j.property(
          "init",
          j.identifier("suffix"),
          typeof unit === "string" ? j.stringLiteral(unit) : j.identifier(unit)
        );
        newAttr.push({
          label: "numberInput",
          value: j.objectExpression([unitProperty]),
        });
      }

      const value = getAttribute(attributes, "value");
      if (value) {
        // 新组件中 value 和onChange 搭配使用
        modifyAttr.push({ oldAttr: "onLastChange", newAttr: "onChange" });
      }

      return modifyAttributes(attributes, modifyAttr, newAttr);
    },
  };
};

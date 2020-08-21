"use strict";

module.exports = function (j, root) {
  const utils = require("../utils")(j, root);
  const { modifyAttributes } = utils;

  const dealWithAttr = (attributes) => {
    const changeSize = (s) => {
      const typeMap = { small: "sm", medium: "md", large: "lg" };
      return typeMap[s] || "md";
    };

    const modifyAttr = [
      { oldAttr: "onClick", newAttr: "onChange" },
      { oldAttr: "values", newAttr: "value" },
      {
        oldAttr: "size",
        newAttr: "size",
        modifyValue: (value) => changeSize(value),
      },
    ];

    return modifyAttributes(attributes, modifyAttr);
  };

  const Checkbox = {
    old: "Checkbox",
    property: [{ Group: { newPropertyName: "Group", newKeyName: "Checkbox" } }],
    transAttribute: (attributes) => {
      return dealWithAttr(attributes);
    },
  };

  const CheckboxGroup = {
    old: "CheckboxGroup",
    new: "Group",
    ignoreAdd: true,
    transAttribute: (attributes) => {
      return dealWithAttr(attributes);
    },
  };

  return {
    Checkbox,
    CheckboxGroup,
  };
};

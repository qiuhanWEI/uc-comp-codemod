"use strict";

module.exports = function (j, root) {
  const utils = require("../utils")(j, root);
  const { modifyAttributes, addNewCompImport, changeCompName } = utils;

  const Input = {
    old: "Input",
    property: [
      { Number: { newKeyName: "Input" } }, // 处理 const { Number } = Input;
      { InputWithTip: { newKeyName: "Input" } }, // 处理 const { InputWithTip } = Input;
    ],
    transMemExpress: (node) => {
      const memExpressName = node.openingElement.name;
      if (
        memExpressName.object.name === "Input" &&
        memExpressName.property.name === "InputWithTip"
      ) {
        addNewCompImport("Input");
        // 新组件不支持Input.InputWithTip。先改为Input
        changeCompName(node, {
          old: "Input",
          newName: "Input",
        });
      }
    },
    transAttribute: (attributes) => {
      const modifyAttr = [
        { oldAttr: "unit", newAttr: "suffix" },
        { oldAttr: "limit", newAttr: "step" },
      ];

      return modifyAttributes(attributes, modifyAttr);
    },
  };

  const InputInputWithTip = {
    old: "InputInputWithTip",
    new: "Input",
    ignoreAdd: true,
  };
  const InputNumber = {
    old: "InputNumber",
    new: "NumberInput",
    transAttribute: (attributes) => {
      const modifyAttr = [
        { oldAttr: "unit", newAttr: "suffix" },
        { oldAttr: "limit", newAttr: "step" },
      ];

      return modifyAttributes(attributes, modifyAttr);
    },
  };

  return {
    Input,
    InputInputWithTip,
    InputNumber,
  };
};

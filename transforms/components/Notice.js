"use strict";

module.exports = function (j, root) {
  const utils = require("../utils")(j, root);
  const { modifyAttributes } = utils;
  
  return {
    old: "Notice",
    transAttribute: (attributes) => {
      const changeNoticeType = (t) => {
        const typeMap = { red: "error", yellow: "warning" };
        return typeMap[t] || "default";
      };
      const modifyAttr = [
        {
          oldAttr: "type",
          newAttr: "styleType",
          modifyValue: (value) => changeNoticeType(value),
        },
        {
          oldAttr: "message",
          newAttr: null,
        },
        { oldAttr: "closeable", newAttr: "closable" },
      ];
      const newAttr = [{ label: "styleType", value: j.literal("default") }];

      return modifyAttributes(attributes, modifyAttr, newAttr);
    },
    transChildren: (children, isJSXMemberExpression, node) => {
      const message = node.openingElement.attributes.find(
        (attr) => attr.name.name === "message"
      );
      if (message) {
        children.push(message.value);
        if (node.openingElement.selfClosing) {
          node.openingElement.selfClosing = false;
          node.closingElement = j.jsxClosingElement(j.jsxIdentifier("Notice"));
        }
      }
      return children;
    },
  };
};

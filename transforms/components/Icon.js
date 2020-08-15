"use strict";

module.exports = function (j, root) {
  const utils = require("../utils")(j, root);
  const { modifyAttributes, getAttribute } = utils;

  return {
    old: "Icon",
    transAttribute: (attributes) => {
      const changeSize = (t) => {
        const typeMap = { xxs: 12, xs: 14, xsm: 16, sm: 18, md: 20, lg: 24 };
        return typeMap[t] || 12;
      };

      const oldSize = changeSize(getAttribute(attributes, "size"));
      const oldStyle = getAttribute(attributes, "style") || [];
      const oldColor = getAttribute(attributes, "color") || "";
      const oldClassName = getAttribute(attributes, "className") || "";

      let modifyAttr = [
        { oldAttr: "prefixType", newAttr: "prefix" },
        { oldAttr: "style", newAttr: null },
        { oldAttr: "size", newAttr: null },
        { oldAttr: "color", newAttr: null },
      ];

      const property = j.property(
        "init",
        j.identifier("fontSize"),
        j.numericLiteral(oldSize)
      );

      const newClassName = oldColor ? `u-${oldColor} ${oldClassName}` : "";
      newClassName && modifyAttr.push({ oldAttr: "className", newAttr: null });

      let newAttr = [
        {
          label: "style",
          value: j.objectExpression([property, ...oldStyle]),
        },
      ];

      newClassName &&
        newAttr.push({
          label: "className",
          value: j.stringLiteral(newClassName),
        });

      return modifyAttributes(attributes, modifyAttr, newAttr);
    },
  };
};

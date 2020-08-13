"use strict";

module.exports = function (j, root) {
  const utils = require("../utils")(j, root);
  const { modifyAttributes } = utils;

  return {
    old: "Tip",
    new: "Tooltip",
    transAttribute: (attributes) => {
      const modifyAttr = [
        { oldAttr: "t_title", newAttr: "popup" },
        { oldAttr: "t_zIndex", newAttr: "zIndex" },
      ];
      const newAttr = [{ label: "arrow", value: j.booleanLiteral(false) }];

      return modifyAttributes(attributes, modifyAttr, newAttr);
    },
    transChildren: (children) => {
      const wrapper = j.jsxElement(
        j.jsxOpeningElement(j.jsxIdentifier("div")),
        j.jsxClosingElement(j.jsxIdentifier("div")),
        children
      );
      const paddedChildren = j.jsxText("\n");
      return [paddedChildren, wrapper, paddedChildren];
    },
  };
};

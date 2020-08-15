"use strict";

module.exports = function (j, root) {
  const utils = require("../utils")(j, root);
  const { modifyAttributes } = utils;

  return {
    old: "Select",
    transAttribute: (attributes) => {
      const modifyAttr = [{ oldAttr: "onSelect", newAttr: "onChange" }];

      return modifyAttributes(attributes, modifyAttr);
    },
  };
};

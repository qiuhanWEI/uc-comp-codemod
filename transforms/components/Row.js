"use strict";

module.exports = function (j, root) {
  const utils = require("../utils")(j, root);
  const { modifyAttributes, addNewCompImport, changeCompName } = utils;

  const findPathAfterImport = () => {
    let target;
    root.find(j.ImportDeclaration).forEach((path) => (target = path));
    return target;
  };

  const getGridDefinitions = () => {
    const rowProperty = j.objectProperty(
      j.identifier("Row"),
      j.identifier("Row")
    );
    const colProperty = j.objectProperty(
      j.identifier("Col"),
      j.identifier("Col")
    );
    return j.variableDeclaration("const", [
      j.variableDeclarator(
        j.objectPattern([rowProperty, colProperty]),
        j.identifier("Grid")
      ),
    ]);
  };

  const findDefinition = () => {
    const def = root
      .find(j.VariableDeclarator, {
        id: { type: "ObjectPattern" },
        init: { type: "Identifier" },
      })
      .filter((path) => {
        const components = path.node.id.properties.map((p) => p.key.name);

        return (
          path.node.init.name === "Grid" &&
          components.includes("Row") &&
          components.includes("Col")
        );
      });
    return !!def.length;
  };

  const Row = {
    old: "Row",
    ignoreAdd: true,
    property: [{ Col: {} }],
    preProcess: (node) => {
      if (node.openingElement.name.name === "Row") {
        const hasDefinition = findDefinition();
        if (hasDefinition) return;

        // 从新组件中引入Grid
        addNewCompImport("Grid");
        // 新增 const { Row, Col } = Grid;
        const path = findPathAfterImport();
        const gridDefinitions = getGridDefinitions();
        path && j(path).insertAfter(gridDefinitions);
      }
    },
    transMemExpress: (node) => {
      // 改名
      changeCompName(node, {
        old: "Row",
        newName: "Col",
      });
    },
    transAttribute: (attributes, isJSXMemberExpression, node) => {
      if (node.openingElement.name.name === "Row") {
        const modifyAttr = [{ oldAttr: "gap", newAttr: "gutter" }];
        const newAttr = [{ label: "type", value: j.literal("flex") }];

        return modifyAttributes(attributes, modifyAttr, newAttr);
      }
      return attributes;
    },
  };
  const RowCol = {
    old: "RowCol",
    new: "Col",
    ignoreAdd: true,
  };

  return { Row, RowCol };
};

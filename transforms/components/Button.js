"use strict";

module.exports = function (j, root) {
  const utils = require("../utils")(j, root);

  const {
    getAttribute,
    modifyAttributes,
    isCertainMemberExpression,
    addNewCompImport,
    changeCompName,
  } = utils;

  const dealWithBtGroupAttr = (attributes) => {
    // 若是Button.Group 形式，新增属性sharedProps
    const sizeProperty = getAttribute(attributes, "size");

    if (sizeProperty) {
      const property = j.property(
        "init",
        j.identifier("size"),
        j.stringLiteral(sizeProperty)
      );

      const newAttr = [
        {
          label: "sharedProps",
          value: j.objectExpression([property]),
        },
      ];

      return modifyAttributes(
        attributes,
        [{ oldAttr: "size", newAttr: null }],
        newAttr
      );
    }
    return attributes;
  };

  const dealWithBtChildren = (children) => {
    children
      .filter((child) => child.type === "JSXElement")
      .forEach((jsxChild) => {
        changeCompName(jsxChild, {
          old: "Button",
          newName: "Radio",
        });
      });
    children.map((path) =>
      j(path)
        .find(j.JSXElement)
        .forEach((jsxChild) => {
          changeCompName(jsxChild.node, {
            old: "Button",
            newName: "Radio",
          });
        })
    );
  };

  const Button = {
    old: "Button",
    property: [
      { Radio: { newPropertyName: "Group", newKeyName: "Radio" } },
      { Group: { newKeyName: "Combine" } },
    ], // const { Radio } = Button; ---》const { Group } = Radio;
    transAttribute: (attributes, isJSXMemberExpression, node) => {
      if (isJSXMemberExpression) {
        if (isCertainMemberExpression(node, "Radio", "Group")) {
          // 若是Radio.Groupo 形式，新增属性styleType
          const modifyAttr = [{ oldAttr: "active", newAttr: "value" }];
          const newAttr = [{ label: "styleType", value: j.literal("button") }];

          return modifyAttributes(attributes, modifyAttr, newAttr);
        }
        if (node.openingElement.name.name === "Combine") {
          return dealWithBtGroupAttr(attributes);
        }
      } else {
        // 若是Button，且有type，替换type =》 styleType；若无type，添加 styleType: primary
        const modifyAttr = [{ oldAttr: "type", newAttr: "styleType" }];
        const newAttr = [{ label: "styleType", value: j.literal("primary") }];

        return modifyAttributes(attributes, modifyAttr, newAttr);
      }
    },
    transMemExpress: (node) => {
      // <Button.Radio> 转换成 <Radio.Group>
      if (isCertainMemberExpression(node, "Button", "Radio")) {
        // 从新组件中引入Radio
        addNewCompImport("Radio");
        // 改名
        changeCompName(node, {
          old: "Button",
          newName: "Radio",
          newPropertyName: "Group",
        });
      }
      if (isCertainMemberExpression(node, "Button", "Group")) {
        // 从新组件中引入Combine
        addNewCompImport("Combine");
        // 改名
        changeCompName(node, {
          old: "Button",
          newName: "Combine",
        });
      }
    },
    transChildren: (children, isJSXMemberExpression, node) => {
      if (
        isJSXMemberExpression &&
        isCertainMemberExpression(node, "Radio", "Group")
      ) {
        dealWithBtChildren(children);
      }
      return children;
    },
  };

  const ButtonRadio = {
    old: "ButtonRadio",
    new: "Group",
    ignoreAdd: true,
    transAttribute: (attributes) => {
      const modifyAttr = [{ oldAttr: "active", newAttr: "value" }];
      const newAttr = [{ label: "styleType", value: j.literal("button") }];

      return modifyAttributes(attributes, modifyAttr, newAttr);
    },
    transChildren: (children) => {
      dealWithBtChildren(children);

      return children;
    },
  };
  const ButtonGroup = {
    old: "ButtonGroup",
    new: "Combine",
    ignoreAdd: true,
    transAttribute: (attributes) => {
      return dealWithBtGroupAttr(attributes);
    },
  };
  return { Button, ButtonRadio, ButtonGroup };
};

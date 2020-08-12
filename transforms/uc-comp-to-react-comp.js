/**
 * 1. 获取从 uc_components 中引入的组件
 * 2. 遍历组件，检验是否有对应的新组件
 * - 2.1 有新组件，将该组件从uc_components 中的引入删除，新增从 react_components 中的引入
 * - - 2.1.1 检测是否改名，若是，则引用中使用新名称，并修改render 中组件名称
 * - - 2.1.2 检测是否有api 修改，若是，则修改对应api。
 * - 2.2 无对应新组件，不动。
 */

/**
 * { Button, Loading, Tip, Notice, Input, Select, Icon, Slider }
 */

module.exports = function (file, api, options) {
  const j = api.jscodeshift;
  const root = j(file.source); // 将字符串源文件转换为一个可遍历/操作的Collection

  const NEW_IMPORT_NAME = "react_components";
  const OLD_IMPORT_NAME = "uc_components";

  // 从旧组件库中引入的组件
  let oldCompsArray = [];

  const changeAttributeName = (attributes, attrMap = []) => {
    if (!attrMap.length) {
      return attributes;
    }

    attributes.forEach((attribute) => {
      const changedAttr =
        attrMap.find((attr) => attr.oldAttr === attribute.name.name) || null;
      if (!changedAttr) {
        return;
      }

      if (changedAttr.newAttr) {
        attribute.name.name = changedAttr.newAttr;
      } else {
        attribute.isRemoved = true;
      }

      if (changedAttr.modifyValue) {
        if (attribute.value.type === "JSXExpressionContainer") {
          attribute.value.expression.value = changedAttr.modifyValue(
            attribute.value.expression.value
          );
        } else {
          attribute.value.value = changedAttr.modifyValue(
            attribute.value.value
          );
        }
      }
    });
    return attributes.filter((attr) => !attr.isRemoved);
  };

  // Find alpha-sorted import that would follow react
  function findImportAfterReact(j, root) {
    let target, targetName;

    root.find(j.ImportDeclaration).forEach((path) => {
      const name = path.value.source.value.toLowerCase();
      if (name > NEW_IMPORT_NAME && (!target || name < targetName)) {
        targetName = name;
        target = path;
      }
    });

    return target;
  }

  // Program uses ES import syntax
  function useImportSyntax(j, root) {
    return (
      root.find(j.ImportDeclaration, {
        importKind: "value",
      }).length > 0
    );
  }

  const addNewCompImport = (importName) => {
    if (useImportSyntax(j, root)) {
      // Handle cases where 'react_components' already exists;
      const importDecs = root.find(j.ImportDeclaration, {
        source: { value: NEW_IMPORT_NAME },
      });
      if (importDecs.length > 0) {
        importDecs.forEach((path) => {
          const specifierNames = path.node.specifiers.map(
            (specifier) => specifier.imported.name
          );
          if (specifierNames.indexOf(importName) > -1) {
            return;
          }

          path.node.specifiers.push(
            j.importSpecifier(j.identifier(importName))
          );
        });
        return;
      }

      const path = findImportAfterReact(j, root);
      if (path) {
        const importStatement = j.importDeclaration(
          [j.importSpecifier(j.identifier(importName))],
          j.literal(NEW_IMPORT_NAME)
        );

        const firstNode = root.find(j.Program).get("body", 0).node;
        const { comments } = firstNode;
        if (comments) {
          delete firstNode.comments;
          importStatement.comments = comments;
        }

        j(path).insertBefore(importStatement);
        return;
      }
    }
  };

  const addAttributes = (label, value) => {
    return j.jsxAttribute(
      j.jsxIdentifier(label),
      j.jsxExpressionContainer(value)
    );
  };

  const changeMemberExpressionToIdentifier = (
    nodeElement,
    name,
    type = "open"
  ) => {
    const jsxEle = type === "open" ? "jsxOpeningElement" : "jsxClosingElement";
    return {
      ...nodeElement,
      name: j[jsxEle](j.jsxIdentifier(name)).name,
    };
  };

  // 修改组件名称
  const changeCompName = (node, { old, newName, newPropertyName }) => {
    function changeEleName(ele, type = "open") {
      if (ele.name.name === old) {
        ele.name.name = newName;
      } else if (ele.name.object && ele.name.object.name === old) {
        if (newPropertyName) {
          ele.name.object.name = newName;
          ele.name.property.name = newPropertyName;
        } else {
          ele = changeMemberExpressionToIdentifier(ele, newName, type);
        }
      }
      return ele;
    }

    if (node.openingElement) {
      node.openingElement = changeEleName(node.openingElement);

      if (!node.openingElement.selfClosing) {
        node.closingElement = changeEleName(node.closingElement, "close");
      }
    }
  };

  // 修改或新增属性
  const modifyAttributes = (attributes, modifyAttr, newAttr = []) => {
    attributes = changeAttributeName(attributes, modifyAttr);
    newAttr.forEach(({ label, value }) => {
      if (!attributes.find((attribute) => attribute.name.name === label)) {
        attributes.push(addAttributes(label, value));
      }
    });
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

  const isCertainMemberExpression = (node, object, property) => {
    const memExpressName = node.openingElement.name;
    return (
      memExpressName.object &&
      memExpressName.object.name === object &&
      memExpressName.property.name === property
    );
  };

  const getAttribute = (attributes, key) => {
    const attribute = attributes.find((attr) => attr.name.name === key);
    if (attribute) {
      return attribute.value.type === "Literal" ? attribute.value.value : null;
    }
  };

  // 新旧组件转换方法数组
  // 可转换旧组件：Tip，Loading，Button，Radio，Notice，Input，Input.Number，Button.Radio, Button.Group
  // 不处理：Table，Form，Modal，Input.InputWithTip
  const oldCompTransMapArr = [
    {
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
    },
    { old: "Loading" },
    { old: "Radio" },
    {
      old: "Button",
      property: [{ Radio: "Group" }], // 旧组件支持 Button.Radio, 替换时将 Radio->Group
      propertyChangedName: "Radio", // 如果替换了Radio->Group，则需要将Button -> Radio.
      transAttribute: (attributes, isJSXMemberExpression, node) => {
        if (isJSXMemberExpression) {
          if (isCertainMemberExpression(node, "Radio", "Group")) {
            // 若是Radio.Groupo 形式，新增属性styleType
            const modifyAttr = [{ oldAttr: "active", newAttr: "value" }];
            const newAttr = [
              { label: "styleType", value: j.literal("button") },
            ];

            return modifyAttributes(attributes, modifyAttr, newAttr);
          }
          if (node.openingElement.name.name === "Combine") {
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
    },
    {
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
    },
    {
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
            node.closingElement = j.jsxClosingElement(
              j.jsxIdentifier("Notice")
            );
          }
        }
        return children;
      },
    },
    {
      old: "Input",
      property: [{ Number: "Number" }], // 处理 const { Number } = Input;
      transMemExpress: (node) => {
        const memExpressName = node.openingElement.name;
        if (
          memExpressName.object.name === "Input" &&
          memExpressName.property.name === "InputWithTip"
        ) {
          addNewCompImport("Input");
          // 新组件不支持InputWithTip。改为Input
          node.openingElement = {
            ...node.openingElement,
            name: j.jsxOpeningElement(j.jsxIdentifier("Input")).name,
          };
          if (!node.openingElement.selfClosing) {
            node.closingElement = {
              ...node.closingElement,
              name: j.jsxClosingElement(j.jsxIdentifier("Input")).name,
            };
          }
        }
      },
      transAttribute: (attributes) => {
        const modifyAttr = [
          { oldAttr: "unit", newAttr: "suffix" },
          { oldAttr: "limit", newAttr: "step" },
        ];

        return modifyAttributes(attributes, modifyAttr);
      },
    },
    {
      old: "InputNumber",
      new: "NumberInput",
      transAttribute: (attributes) => {
        const modifyAttr = [
          { oldAttr: "unit", newAttr: "suffix" },
          { oldAttr: "limit", newAttr: "step" },
        ];

        return modifyAttributes(attributes, modifyAttr);
      },
    },
  ];

  // 组件是否支持转换
  const findCompInMap = (name) =>
    oldCompTransMapArr.find((comp) => comp.old === name);

  // 组件是否为旧组件中引入，且支持转换
  const findOldCompToBeTransformed = (name) => {
    if (oldCompsArray.indexOf(name) < 0) {
      return null;
    }
    return findCompInMap(name);
  };

  const changeOldCompName = (oldName, newName) => {
    root
      .find(j.JSXIdentifier, { name: oldName })
      .filter((identify) => identify.parent.node.type !== "JSXMemberExpression")
      .forEach((path) => {
        path.node.name = newName;
      });
  };

  // 1. 找到import 中的旧组件，判断是否需要替换
  root
    .find(j.ImportDeclaration, {
      source: {
        value: OLD_IMPORT_NAME,
      },
    })
    .forEach((path) => {
      let { specifiers = [] } = path.node;
      // 保存从旧组件库中引入的组件
      oldCompsArray = specifiers.map((specifier) => specifier.imported.name);

      // 过滤掉可转换的组件
      path.node.specifiers = specifiers.filter(
        (specifier) =>
          oldCompTransMapArr
            .map((c) => c.old)
            .indexOf(specifier.imported.name) < 0
      );
    });

  // 2. 找到形如 const { Radio } = Button; 判断是否可替换
  root
    .find(j.VariableDeclarator, {
      id: { type: "ObjectPattern" },
      init: { type: "Identifier" },
    })
    .filter((path) => {
      const key = path.node.init.name; // Button
      const oldCompToTrans = findOldCompToBeTransformed(key);
      if (!oldCompToTrans) {
        return;
      }

      const { properties } = path.node.id;
      properties.forEach((prop) => {
        const oldPropertyName = prop.key.name; // Radio

        (oldCompToTrans.property || []).forEach((p) => {
          if (p[oldPropertyName]) {
            const joinOldCompName = path.node.init.name + oldPropertyName; // ButtonRadio
            oldCompsArray.push(joinOldCompName);
            // 修改旧引用
            const { propertyChangedName } = oldCompToTrans;
            propertyChangedName && (path.node.init.name = propertyChangedName);
            prop.key.name = p[oldPropertyName];
            // 新增新组件引用
            propertyChangedName && addNewCompImport(propertyChangedName);
            // 修改Radio 使用时的名称，以免与新组件发生混淆
            changeOldCompName(oldPropertyName, joinOldCompName);
          }
        });
      });
    });

  // 3. 找到组件的调用代码并判断是否替换
  root.find(j.JSXElement).forEach((path) => {
    let { openingElement, children } = path.node;
    let transEle = {};
    let isJSXMemberExpression = false;

    if (openingElement.name.name) {
      transEle = findOldCompToBeTransformed(openingElement.name.name);
    } else if (openingElement.name.type === "JSXMemberExpression") {
      // 处理 <Comp.xxx></Comp.xxx> 情况
      isJSXMemberExpression = true;
      const memExpressionName = openingElement.name.object.name;
      memExpressionName &&
        (transEle = findOldCompToBeTransformed(memExpressionName));
    }

    // 该组件不在可替换名单中
    if (!transEle) {
      return;
    }

    if (isJSXMemberExpression) {
      // 处理 <Comp.xxx></Comp.xxx> 情况
      transEle.transMemExpress && transEle.transMemExpress(path.node);
    } else {
      // 该组件是从老组件中引入，且在可替换名单中
      const transEleName = transEle.new || transEle.old;
      !transEle.ignoreAdd && addNewCompImport(transEleName);
      changeCompName(path.node, { old: transEle.old, newName: transEleName });
    }

    if (transEle.transChildren) {
      path.node.children = transEle.transChildren(
        children,
        isJSXMemberExpression,
        path.node
      );
    }

    if (transEle.transAttribute) {
      path.node.openingElement.attributes = transEle.transAttribute(
        openingElement.attributes,
        isJSXMemberExpression,
        path.node
      );
    }
  });

  // 4. 若全部替换，则删除空import
  root
    .find(j.ImportDeclaration)
    .filter(
      (path) =>
        path.node.specifiers.length === 0 &&
        path.node.source.value === OLD_IMPORT_NAME
    )
    .replaceWith();

  return root.toSource();
};

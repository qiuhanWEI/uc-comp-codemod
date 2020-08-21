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

  const utils = require("./utils")(j, root);
  const components = require("./components")(j, root);

  const OLD_IMPORT_NAME = "uc_components";

  // 从旧组件库中引入的组件
  let oldCompsArray = [];

  const { addNewCompImport, changeCompName } = utils;

  // 新旧组件转换方法数组
  // 可转换旧组件：Tip，Loading，Button，Radio，Notice，Input，Input.Number，Button.Radio, Button.Group
  // 不处理：Table，Form，Modal，Input.InputWithTip
  const oldCompTransMapArr = Object.values(components);

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

  // 2. 找到形如 const { Group } = Button; 判断是否可替换。若可被替换为Combine，则删除该行。
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
          const oldPropertyTransMap = p[oldPropertyName]; //{ newPropertyName: "Group", newKeyName: "Radio" }
          if (oldPropertyTransMap) {
            const joinOldCompName = path.node.init.name + oldPropertyName; // ButtonRadio
            oldCompsArray.push(joinOldCompName);
            // 修改旧引用
            const { newPropertyName, newKeyName } = oldPropertyTransMap;
            newKeyName && (path.node.init.name = newKeyName);
            prop.key.name = newPropertyName;
            // 新增新组件引用
            newKeyName && addNewCompImport(newKeyName);
            // 修改Radio 使用时的名称，以免与新组件发生混淆
            changeOldCompName(oldPropertyName, joinOldCompName);
          }
        });
      });
      path.node.id.properties = properties.filter((p) => p.key.name);
      return !path.node.id.properties.length;
    })
    .forEach((path2) => j(path2.parentPath.parentPath).remove());

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

    // 预处理
    transEle.preProcess && transEle.preProcess(path.node);

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

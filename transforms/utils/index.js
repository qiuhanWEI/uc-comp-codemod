"use strict";

module.exports = function (j, root) {
  const NEW_IMPORT_NAME = "react_components";

  const isCertainMemberExpression = (node, object, property) => {
    const memExpressName = node.openingElement.name;
    return (
      memExpressName.object &&
      memExpressName.object.name === object &&
      memExpressName.property.name === property
    );
  };

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

  const addAttributes = (label, value) => {
    return j.jsxAttribute(
      j.jsxIdentifier(label),
      j.jsxExpressionContainer(value)
    );
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

  // Program uses ES import syntax
  function useImportSyntax(j, root) {
    return (
      root.find(j.ImportDeclaration, {
        importKind: "value",
      }).length > 0
    );
  }

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

  const getAttribute = (attributes, key) => {
    const attribute = attributes.find((attr) => attr.name.name === key);
    if (attribute) {
      return attribute.value.type === "Literal" ? attribute.value.value : null;
    }
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

  return {
    isCertainMemberExpression,
    modifyAttributes,
    addNewCompImport,
    getAttribute,
    changeCompName,
  };
};

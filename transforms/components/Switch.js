'use strict';

module.exports = function (j, root) {
    const utils = require('../utils')(j, root);
    const { modifyAttributes } = utils;

    return {
        old: 'Switch',
        transAttribute: attributes => {
            const changeSize = s => {
                const typeMap = { small: 'sm', big: 'lg' };
                return typeMap[s] || 'md';
            };
            const modifyAttr = [
                {
                    oldAttr: 'size',
                    newAttr: 'size',
                    modifyValue: value => changeSize(value)
                }
            ];

            return modifyAttributes(attributes, modifyAttr);
        }
    };
};

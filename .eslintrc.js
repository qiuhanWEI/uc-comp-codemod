module.exports = {
  parser: "babel-eslint",

  extends: ["./node_modules/fbjs-scripts/eslint/.eslintrc.js"],

  plugins: ["react"],

  rules: {
    "no-use-before-define": 2,
    "max-len": "off",
    quotes: "off",
  },
  parserOptions: {
    ecmaVersion: 7,
  },

  env: {
    es6: true,
    browser: true,
    node: true,
  },
};

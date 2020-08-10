const meow = require("meow");
const path = require("path");
const execa = require("execa");
const chalk = require("chalk");
const isGitClean = require("is-git-clean");

const transformerDirectory = path.join(__dirname, "../", "transforms");
const jscodeshiftExecutable = require.resolve(".bin/jscodeshift");

function runTransform({ files, flags, parser }) {
  const transformerPath = path.join(
    transformerDirectory,
    "uc-comp-to-react-comp.js"
  );

  let args = [];

  const { dry, print, explicitRequire } = flags;

  if (dry) {
    args.push("--dry");
  }
  if (print) {
    args.push("--print");
  }

  if (explicitRequire === "false") {
    args.push("--explicit-require=false");
  }

  args.push("--ignore-pattern=**/node_modules/**");

  args.push("--parser", parser || "babel");

  if (parser === "tsx") {
    args.push("--extensions=tsx,ts,jsx,js");
  } else {
    args.push("--extensions=jsx,js");
  }

  args = args.concat(["--transform", transformerPath]);

  if (flags.jscodeshift) {
    args = args.concat(flags.jscodeshift);
  }

  args = args.concat(files);

  console.log(`Executing command: jscodeshift ${args.join(" ")}`);

  const result = execa.sync(jscodeshiftExecutable, args, {
    stdio: "inherit",
    stripEof: false,
  });

  if (result.error) {
    throw result.error;
  }
}

function checkGitStatus(force) {
  let clean = false;
  let errorMessage = "Unable to determine if git directory is clean";
  try {
    clean = isGitClean.sync(process.cwd());
    errorMessage = "Git directory is not clean";
  } catch (err) {
    if (err && err.stderr && err.stderr.indexOf("Not a git repository") >= 0) {
      clean = true;
    }
  }

  if (!clean) {
    if (force) {
      console.log(`WARNING: ${errorMessage}. Forcibly continuing.`);
    } else {
      console.log("Thank you for using react-codemods!");
      console.log(
        chalk.yellow(
          "\nBut before we continue, please stash or commit your git changes."
        )
      );
      console.log(
        "\nYou may use the --force flag to override this safety check."
      );
      process.exit(1);
    }
  }
}

function run() {
  const cli = meow(
    {
      description: "Codemods for updating uc_componnets to react_components.",
      help: `
      Usage
        $ npx uc-comp-codemod <path> <...options>
  
          path         Files or directory to transform. Can be a glob like src/**.test.js
  
      Options
        --force            Bypass Git safety checks and forcibly run codemods
        --dry              Dry run (no changes are made to files)
        --print            Print transformed files to your terminal
        --explicit-require Transform only if React is imported in the file (default: true)
  
        --jscodeshift  (Advanced) Pass options directly to jscodeshift
      `,
    },
    {
      boolean: ["force", "dry", "print", "explicit-require", "help"],
      string: ["_"],
      alias: {
        h: "help",
      },
    }
  );

  if (!cli.flags.dry) {
    checkGitStatus(cli.flags.force);
  }

  return runTransform({
    files: cli.input[0],
    flags: cli.flags,
    parser: cli.flags.parser,
  });
}

module.exports = {
  run: run,
};

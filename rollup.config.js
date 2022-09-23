import { nodeResolve } from "@rollup/plugin-node-resolve";
import commonjs from "@rollup/plugin-commonjs";
import { uglify } from "rollup-plugin-uglify";
const plugins = [
  commonjs({
    exclude: ["node_modules/**"],
    extensions: [".js", ".ts"],
    ignoreDynamicRequires: true,
  }),
  nodeResolve({
    extensions: [".js", ".ts"],
  }),
  uglify({
    output: {
      comments: function () {
        return false;
      },
    },
  }),
];

export default [
  {
    input: "es/index.js",
    output: {
      file: "index.js",
      format: "cjs",
      name: "resolver",
    },
    external: ["chalk", "fs-extra", "minimist", "cross-spawn"],
    plugins,
  },
];

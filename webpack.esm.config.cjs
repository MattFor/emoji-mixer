const path = require("path");
const TerserPlugin = require("terser-webpack-plugin");

module.exports = {
  mode: "production",
  entry: "./index.js",
  output: {
    filename: "index.mjs",
    path: path.resolve(__dirname, "dist"),
    libraryTarget: "module"
  },
  experiments: {
    outputModule: true,
  },
  optimization: {
    minimizer: [
      new TerserPlugin({})
    ],
  }
};
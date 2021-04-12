const path = require("path");
const HtmlWebpackPlugin = require("html-webpack-plugin");

module.exports = {
  mode: "development",
  context: process.cwd(),
  entry: "./src/index.js",
  output: {
    path: path.resolve(__dirname, "dist"),
    filename: "monitor.js"
  },
  devServer: {
    contentBase: path.resolve(__dirname, "dist"),
    before(router) {
      router.get("/success", (req, res) => {
        res.json({ id: 1 });
      })
      router.post("/error", (req, res) => {
        res.sendStatus(500)
      })
    }
  },
  plugins: [
    new HtmlWebpackPlugin({
      template: "./src/index.html",
      inject: "head"
    })
  ]

}

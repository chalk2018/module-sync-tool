/**
 * 最大化config项目
 */
const path = require("path");
// const { configCreate, resolver, descResolver } = require("module-sync-tool");
module.exports = configCreate({
  // 同步映射关系, 基于工程下相对路径
  mapping: [
    resolver("src", null, false),
  ],
  // 记录描述信息
  description: [
    descResolver(
      "package.json",
      `{
       // 变更明细
     }`
    ),
  ],
  workspaces: [
    // 目标工程绝对路径，第二个参数代表是否做gitpush同步
    [path.resolve("../test"), false],
  ],
});

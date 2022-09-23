const path = require("path");
module.exports = configCreate({
  // 备份的文件或文件夹
  mapping: [resolver("./index.js", null, true)],
  // 记录描述信息
  description: [
    descResolver(
      "history",
      `
1. The first sync.
2. The second sync.
`
    ),
    // mdResolver("description", "- ***2022-09-24***", "---"),
    // mdResolver("description", "- ***2022-09-24***"),
    // mdResolver("description", "", "---")
    mdResolver("description", `- ***${require("moment")().format("YYYY-MM-DD")}***`, "---"),
  ],
  workspaces: [
    // 目标工程绝对路径，第二个参数代表是否做gitpush同步
    [path.resolve("../module-sync-test"), false],
  ],
});

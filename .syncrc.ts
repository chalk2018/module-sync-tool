import * as path from "path";
import { configCreate, resolver, descResolver } from "./index";
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
  ],
  workspaces: [
    // 目标工程绝对路径，第二个参数代表是否做gitpush同步
    [path.resolve("../project1"), false],
  ],
});

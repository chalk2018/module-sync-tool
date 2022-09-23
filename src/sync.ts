/**
 * 多项目共通文件同步工具
 */
import * as fs from "fs";
import * as path from "path";
import * as minimist from "minimist";
import {
  globalInject,
  override,
  Action,
  configCreate,
  FileType,
  command,
} from "./utils";
const fsExtra = require("fs-extra");
export const run = async () => {
  // 全局注入resolver，配置文件可不用加载resolver
  globalInject();
  // 重写console追加样式
  await override();
  // 获取参数
  const argv = minimist(process.argv.slice(2));
  let config: ReturnType<typeof configCreate> = null as any;
  if (argv["c"]) {
    // 参数c指定配置文件
    config = require(path.resolve(argv["c"]));
  } else {
    // 默认配置文件
    config = require(path.resolve(".syncrc.js"));
  }
  // console.log("config", config);
  if (!config) {
    const errorContent = "The config file not exist.";
    console.log("Error", errorContent);
    throw Error(errorContent);
  }
  for (let i in config.mapping) {
    if (config.mapping[i].action === Action.CREATE) {
      // 创建文件，并写入文本内容，origin：文本内容，target：文件路径
      console.log(
        config.mapping[i].action,
        config.mapping[i].origin,
        `${config.mapping[i].target}.desc`
      );
      await new Promise((resolve, reject) =>
        fs.writeFile(
          `${config.mapping[i].target}.desc`,
          config.mapping[i].origin,
          (err) => {
            err ? reject(err) : resolve(null);
          }
        )
      );
    } else if (config.mapping[i].action === Action.COPY) {
      // 拷贝文件或文件夹，origin：原文件路径，target：目标文件路径
      console.log(
        `${config.mapping[i].action} - Compare:${config.mapping[i].changedCheckAndBackup}`,
        config.mapping[i].origin,
        config.mapping[i].target
      );
      // Compare files
      // 判断文件类型，filetype="FILE"|"FOLDER"
      const originFiletype: FileType = await new Promise((resolve, reject) => {
        fs.stat(config.mapping[i].origin, (err, data) => {
          if (err) {
            console.error("ERROR", err);
            resolve(null);
          } else {
            if (data.isFile()) {
              resolve(FileType.FILE);
            } else if (data.isDirectory()) {
              resolve(FileType.FOLDER);
            } else {
              reject("not file and not folder");
            }
          }
        });
      });
      const targetFiletype: FileType = await new Promise((resolve, reject) => {
        fs.stat(config.mapping[i].target, (err, data) => {
          if (err) {
            console.error("ERROR", err);
            resolve(null);
          } else {
            if (data.isFile()) {
              resolve(FileType.FILE);
            } else if (data.isDirectory()) {
              resolve(FileType.FOLDER);
            } else {
              reject("not file and not folder");
            }
          }
        });
      });
      // 比较源文件和目标文件，changedCheckAndBackup=true 的时候才做比较
      if (
        originFiletype === FileType.FILE &&
        targetFiletype === FileType.FILE &&
        config.mapping[i].changedCheckAndBackup
      ) {
        const textOrigin = await new Promise((resolve, reject) =>
          fs.readFile(config.mapping[i].origin, (err, data) => {
            err ? reject(err) : resolve(data);
          })
        );
        const textTarget = await new Promise((resolve, reject) =>
          fs.readFile(config.mapping[i].target, (err, data) => {
            err ? reject(err) : resolve(data);
          })
        );
        if (String(textOrigin).trim() == String(textTarget).trim()) {
          // 一致的时候不做操作
          console.log("Same", true);
          console.log("Backup", false);
        } else {
          // 如果不一致，备份目标文件
          console.log("Same", false);
          await new Promise((resolve, reject) =>
            fs.rename(
              config.mapping[i].target,
              `${config.mapping[i].target}.backup`,
              (err) => {
                err ? reject(err) : resolve(null);
              }
            )
          );
          console.log("Backup", `${config.mapping[i].target}.backup`);
        }
      }
      // Copy files
      await fsExtra.copy(config.mapping[i].origin, config.mapping[i].target);
    } else if (config.mapping[i].action === Action.REMOVE) {
      // 删除文件，target：要删除的目标文件路径
      console.log(
        config.mapping[i].action,
        config.mapping[i].origin,
        config.mapping[i].target
      );
      await fsExtra.remove(config.mapping[i].target);
    }
  }
  //
  // 推送代码
  const gitPush = async (
    dir,
    gitOption?: {
      origin: string;
      comments: string;
    }
  ) => {
    await command({
      cmd: [
        "sh",
        path.join(__dirname, "gitpush.sh"),
        dir,
        gitOption?.origin || "master",
        gitOption?.comments || "Common Module Sync",
      ],
    });
  };
  for (const i in config.workspaces) {
    const [projectDir, isGitPush] = config.workspaces[i];
    if (isGitPush) {
      if (config.gitPushHook) {
        if (typeof config.gitPushHook === "string") {
          await command({
            cmd: [
              "sh",
              path.resolve(config.gitPushHook),
              projectDir,
              config.gitPushOptions?.origin || "master",
              config.gitPushOptions?.comments || "Auto sync module",
            ],
          });
        } else if (typeof config.gitPushHook === "function") {
          await config.gitPushHook(
            config.workspaces[i],
            command,
            globalThis.__console
          );
        }
      } else {
        await gitPush(projectDir);
      }
    }
  }
};

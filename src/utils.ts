import * as path from "path";
import * as chalk from "chalk";
export type Origin = string | null;
export type Target = string | null;
export enum Action {
  COPY = "COPY",
  REMOVE = "REMOVE",
  CREATE = "CREATE",
}
export enum FileType {
  FILE = "FILE",
  FOLDER = "FOLDER",
}
export type Workspace = [string, boolean] | [string];
interface MappingType {
  action: Action;
  origin: Origin;
  target: Target;
  changedCheckAndBackup?: boolean;
}
/**
 *
 * @param {*} origin
 * @param {*} target
 * @param {*} changedCheckAndBackup
 * @returns
 * 格式说明：
 *  resolver(路径,null,false) : 同名文件/文件夹拷贝 (不检查文件是否一致和备份)
 *  resolver(路径,路径2,false) : 文件/文件夹拷贝到另一个路径中
 *  resolver(null,路径,false) : 删除文件/文件夹
 *  resolver(路径,null,true) : 同名文件/文件夹拷贝（检查文件是否一致并备份，只作用于文件和拷贝操作）
 */
export const resolver = (
  origin: Origin,
  target: Target,
  changedCheckAndBackup?: boolean
) => {
  // 如果 target == null , origin 同步到 target 上
  // 如果 origin == null , target != null , 则删除 target 上的文件
  return (workspaces: Array<Workspace>): Array<MappingType> => {
    return workspaces.map(([workspace]): MappingType => {
      return {
        action: origin ? Action.COPY : Action.REMOVE,
        origin: origin ? path.resolve(origin) : null,
        target: target
          ? path.join(workspace, target)
          : path.join(workspace, origin),
        changedCheckAndBackup,
      };
    });
  };
};
// 创建描述信息文件
export const descResolver = (fileName, text) => {
  return (workspaces: Array<Workspace>): Array<MappingType> => {
    return workspaces.map(([workspace]): MappingType => {
      return {
        action: Action.CREATE,
        origin: text, // origin是要写入的文本文字
        target: path.join(workspace, fileName),
        changedCheckAndBackup: false,
      };
    });
  };
};
export interface Config {
  mapping: Array<ReturnType<typeof resolver>>;
  description: Array<ReturnType<typeof descResolver>>;
  workspaces: Array<Workspace>;
}
// 创建配置
export const configCreate = (config: Config) => {
  let mapping: MappingType[] = [];
  for (const subMapping of config.mapping) {
    mapping = [...mapping, ...subMapping(config.workspaces)];
  }
  for (const subMapping of config.description) {
    mapping = [...mapping, ...subMapping(config.workspaces)];
  }
  return {
    workspaces: config.workspaces,
    mapping,
  };
};
// 日志重写
export const override = async () => {
  globalThis.__console = globalThis.console;
  globalThis.console = <any>new Proxy(
    {},
    {
      get(_, p, r) {
        if (p === "log") {
          return (...args) => {
            globalThis.__console.log(
              ...args.map((arg, idx) => {
                if (idx === 0) {
                  return chalk.underline(
                    chalk.bgGreen(
                      chalk.white(` [${String(arg)}] `)
                    )
                  );
                } else {
                  return (
                    chalk.green("[") +
                    String(arg) +
                    chalk.green("]")
                  );
                }
              })
            );
          };
        }
        if (p === "error") {
          return (...args) => {
            globalThis.__console.log(
              ...args.map((arg, idx) => {
                if (idx === 0) {
                  return chalk.underline(
                    chalk.bgRed(
                      chalk.white(` [${String(arg)}] `)
                    )
                  );
                } else {
                  return chalk.red(String(arg));
                }
              })
            );
          };
        } else {
          Reflect.get(_, p, r);
        }
      },
    }
  );
};
// 执行linux命令
export const command = ({
  cmd = [],
  onOut = (res) => res,
  onErr = (err) => err,
}: {
  cmd: string[];
  onOut?: (res: string) => any;
  onErr?: (err: string) => any;
}): Promise<boolean> => {
  const spawn = require("child_process").spawn;
  return new Promise((resolve, reject) => {
    if (cmd.length === 0) {
      reject(Error("没输入命令"));
    }
    const args = cmd.slice(1);
    const handle = spawn(cmd[0], args);
    // 捕获标准输出并将其打印到控制台
    handle.stdout.on("data", function (data) {
      // console.log(...args, data);
      onOut(data);
    });
    // 捕获标准错误输出并将其打印到控制台
    handle.stderr.on("data", function (data) {
      // console.error(...args, data);
      onErr(data);
    });
    // 注册子进程关闭事件
    handle.on("exit", function (code, signal) {
      // console.log(args[0] + "|END", ...args);
      if (code === 0) {
        resolve(code);
      } else {
        reject(code);
      }
    });
  });
};
// 推送代码
export const gitPush = async (
  dir,
  onStdout = (out) => out,
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
    onOut(out) {
      onStdout(out);
    },
    onErr(out) {
      onStdout(out);
    },
  });
};
// 全局注入配置方法
export const globalInject = () => {
  globalThis.resolver = resolver;
  globalThis.descResolver = descResolver;
  globalThis.configCreate = configCreate;
};
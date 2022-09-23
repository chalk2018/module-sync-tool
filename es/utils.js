"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.globalInject = exports.override = exports.configCreate = exports.mdResolver = exports.descResolver = exports.resolver = exports.command = exports.FileType = exports.Action = void 0;
const path = require("path");
const chalk = require("chalk");
var Action;
(function (Action) {
    Action["COPY"] = "COPY";
    Action["REMOVE"] = "REMOVE";
    Action["CREATE"] = "CREATE";
    Action["EXTRACT"] = "EXTRACT";
    Action["PICK"] = "PICK";
})(Action = exports.Action || (exports.Action = {}));
var FileType;
(function (FileType) {
    FileType["FILE"] = "FILE";
    FileType["FOLDER"] = "FOLDER";
})(FileType = exports.FileType || (exports.FileType = {}));
// 执行linux命令
const command = ({ cmd = [] }) => {
    const spawn = require("cross-spawn");
    return new Promise((resolve, reject) => {
        if (cmd.length === 0) {
            reject(Error("没输入命令"));
        }
        const args = cmd.slice(1);
        const handle = spawn(cmd[0], args, { stdio: "inherit" });
        handle.on("close", (res) => {
            console.log("close", res);
            resolve(res);
        });
    });
};
exports.command = command;
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
const resolver = (origin, target, changedCheckAndBackup) => {
    // 如果 target == null , origin 同步到 target 上
    // 如果 origin == null , target != null , 则删除 target 上的文件
    return (workspaces) => {
        return workspaces.map(([workspace]) => {
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
exports.resolver = resolver;
// 创建描述信息文件
const descResolver = (fileName, text, ext = "desc") => {
    return (workspaces) => {
        return workspaces.map(([workspace]) => {
            return {
                action: Action.CREATE,
                origin: text,
                target: path.join(workspace, fileName + "." + ext),
                changedCheckAndBackup: false,
            };
        });
    };
};
exports.descResolver = descResolver;
// 创建描述信息文件
const mdResolver = (fileName, startWith, endWith) => {
    return (workspaces) => {
        return workspaces.map(([workspace]) => {
            return {
                action: Action.PICK,
                origin: path.resolve(fileName + ".md"),
                target: path.join(workspace, fileName + ".md"),
                changedCheckAndBackup: false,
                startWith,
                endWith,
            };
        });
    };
};
exports.mdResolver = mdResolver;
// 创建配置
const configCreate = (config) => {
    let mapping = [];
    for (const subMapping of config.mapping || []) {
        mapping = [...mapping, ...subMapping(config.workspaces)];
    }
    for (const subMapping of config.description || []) {
        mapping = [...mapping, ...subMapping(config.workspaces)];
    }
    return {
        gitPushHook: config.gitPushHook,
        gitPushOptions: config.gitPushOptions,
        workspaces: config.workspaces,
        mapping,
    };
};
exports.configCreate = configCreate;
// 日志重写
const override = async () => {
    globalThis.__console = globalThis.console;
    globalThis.console = new Proxy({}, {
        get(_, p, r) {
            if (p === "log") {
                return (...args) => {
                    globalThis.__console.log(...args.map((arg, idx) => {
                        if (idx === 0) {
                            return chalk.underline(chalk.bgGreen(chalk.white(` [${String(arg)}] `)));
                        }
                        else {
                            return chalk.green("[") + String(arg) + chalk.green("]");
                        }
                    }));
                };
            }
            if (p === "error") {
                return (...args) => {
                    globalThis.__console.log(...args.map((arg, idx) => {
                        if (idx === 0) {
                            return chalk.underline(chalk.bgRed(chalk.white(` [${String(arg)}] `)));
                        }
                        else {
                            return chalk.red(String(arg));
                        }
                    }));
                };
            }
            else {
                Reflect.get(_, p, r);
            }
        },
    });
};
exports.override = override;
// 全局注入配置方法
const globalInject = () => {
    globalThis.resolver = exports.resolver;
    globalThis.descResolver = exports.descResolver;
    globalThis.configCreate = exports.configCreate;
    globalThis.mdResolver = exports.mdResolver;
};
exports.globalInject = globalInject;
//# sourceMappingURL=utils.js.map
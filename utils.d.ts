export declare type Origin = string | null;
export declare type Target = string | null;
export declare enum Action {
    COPY = "COPY",
    REMOVE = "REMOVE",
    CREATE = "CREATE"
}
export declare enum FileType {
    FILE = "FILE",
    FOLDER = "FOLDER"
}
export declare type Workspace = [string, boolean] | [string];
export interface MappingType {
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
export declare const resolver: (origin: Origin, target: Target, changedCheckAndBackup?: boolean) => (workspaces: Array<Workspace>) => Array<MappingType>;
export declare const descResolver: (fileName: any, text: any) => (workspaces: Array<Workspace>) => Array<MappingType>;
export interface Config {
    mapping?: Array<ReturnType<typeof resolver>>;
    description?: Array<ReturnType<typeof descResolver>>;
    workspaces: Array<Workspace>;
    gitPushHook?: string | ((command: any, console: any) => Promise<any>) | boolean;
}
export declare const configCreate: (config: Config) => {
    workspaces: Workspace[];
    mapping: MappingType[];
};
export declare const override: () => Promise<void>;
export declare const command: ({ cmd }: {
    cmd: string[];
}) => Promise<boolean>;
export declare const gitPush: (dir: any, gitOption?: {
    origin: string;
    comments: string;
}) => Promise<void>;
export declare const globalInject: () => void;

import { BuildConfig, Loader, PathLike } from "bun";

/* ------------ BunBuild.ts ------------ */
export interface BunBuildAdvancedConfig {
    clearOutputDirIfPresent?: boolean;
    copyPublicDir?: boolean;
    publicDirPath?: string;
    injectScriptTag?: boolean;
    filesToInject?: string[][];
    handleAliases?: boolean;
    aliasesRecords?: Record<string, string>;
}

export interface BunBuildConfig extends BuildConfig {
    entrypoints: string[];
    outdir: string;
    target?: "browser" | "node" | "bun";
    format?: "esm" | "cjs" | "iife";
    naming?:
    | string
    | {
        chunk?: string;
        entry?: string;
        asset?: string;
    };
    root?: string;
    splitting?: boolean;
    plugins?: any[];
    external?: string[];
    packages?: "bundle" | "external";
    publicPath: string;
    define?: Record<string, string>;
    loader?: { [k in string]: Loader };
    sourcemap?: "none" | "linked" | "inline" | "external" | boolean;
    conditions?: string | string[];
    env?: "inline" | "disable" | `${string}*`;
    minify?:
    | boolean
    | {
        whitespace?: boolean;
        syntax?: boolean;
        identifiers?: boolean;
    };
    ignoreDCEAnnotations?: boolean;
    emitDCEAnnotations?: boolean;
    bytecode?: boolean;
    banner?: string;
    footer?: string;
    drop?: string[];
    throw?: boolean;
}

/* ------------ asset-manifest.ts ------------ */

export interface BuildFileMappings {
    [key: string]: string
}

export interface AssetManifestGeneratorResult {
    assetManifest: string,
    buildFileMappings: BuildFileMappings
}

/* ------------ sandboxInit.ts ------------ */

export type createSandboxOptsTypes = {
    exists?: "cleanup" | "suffix" | "throw";
    enableRandSuffix?: boolean;
    useTempDirInstead?: boolean;
}

export type createSandboxReturnType = { data: string; error: null } | { data: null; error: Error }

/* ------------ sandboxUse.ts ------------ */

export type SandboxImportExportPromise = { data: PathLike; error: null } | { data: null; error: Error }
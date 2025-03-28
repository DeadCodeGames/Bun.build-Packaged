
import fs, { PathLike } from 'fs';
import { join, basename } from 'path';
import { tmpdir } from 'os';
import tryCatch from 'trycatch';
import { createSandboxOptsTypes, createSandboxReturnType } from './types';

const defaultCreateSandboxOpts: createSandboxOptsTypes = {
    exists: "cleanup",
    enableRandSuffix: false,
    useTempDirInstead: false
}

export async function createSandbox(path: string, opts: createSandboxOptsTypes = defaultCreateSandboxOpts): Promise<createSandboxReturnType> {
    let usedPath = path;
    if (fs.existsSync(path)) {
        if (opts.exists === "cleanup") {
            const cleanUpRes = await destroySandbox(path);
            if (cleanUpRes.error) {
                return { data: null, error: cleanUpRes.error } as { data: null; error: Error };
            }
        } else if (opts.exists === "suffix") {
            let usedPath = path;
            let suffix = 2;
            while (fs.existsSync(usedPath)) {
                usedPath = `${usedPath}${suffix}`;
                suffix++;
                if (suffix > 1000) {
                    return { data: null, error: new Error('Could not find a non-existent path after many suffix attempts.') };
                }
            }
        } else {
            return { data: null, error: new Error('Path already exists.') } as { data: null; error: Error };
        }
    }
    const { data, error } = await tryCatch(new Promise((resolve) => {
        let resPath = usedPath;
        if (opts.useTempDirInstead) {
            const lastPartOfPath = basename(usedPath)
            resPath = opts.enableRandSuffix
                ? join(tmpdir(), lastPartOfPath + '-')
                : join(tmpdir(), lastPartOfPath);
            const finalDir = opts.enableRandSuffix ? fs.mkdtempSync(resPath) : (() => { fs.mkdirSync(resPath, { recursive: true }); return resPath })();
            resolve(finalDir);
        } else {
            resPath = opts.enableRandSuffix
                ? usedPath + '-'
                : usedPath;
            const finalDir = opts.enableRandSuffix ? fs.mkdtempSync(resPath) : (() => { fs.mkdirSync(resPath, { recursive: true }); return resPath })();
            resolve(finalDir);
        }
    }));
    if (error) {
        return { data: null, error } as { data: null; error: Error };
    } else {
        return { data, error: null } as { data: string; error: null };
    }
}

export async function destroySandbox(path: PathLike): Promise<{ data: true, error: null } | { data: false, error: Error }> {
    const { error } = await tryCatch(new Promise((resolve) => {
        fs.rmSync(path, { recursive: true, force: true });
        resolve(true);
    })
    );
    if (error) {
        return { data: false, error };
    } else {
        return { data: true, error: null };
    }
}
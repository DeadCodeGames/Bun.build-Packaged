import fs, { PathLike } from 'fs';
import { join } from 'path';
import tryCatch from 'trycatch';
import { SandboxImportExportPromise } from './types';

export async function importToSandbox(pathFrom: string, sandboxPath: string, pathInSandbox: string): Promise<SandboxImportExportPromise> {
    if (!fs.existsSync(pathFrom)) {
        return { data: null, error: new Error('Source path does not exist.') } as { data: null; error: Error };
    } else if (!fs.existsSync(sandboxPath)) {
        return { data: null, error: new Error(`Sandbox at path ${sandboxPath} does not exist.`) } as { data: null; error: Error };
    };

    const { data, error } = await tryCatch(new Promise((resolve) => {
        fs.cpSync(pathFrom, join(sandboxPath, pathInSandbox), { recursive: true });
        resolve(join(sandboxPath, pathInSandbox));
    }))

    if (error) {
        return { data: null, error } as { data: null; error: Error };
    } else {
        return { data, error: null } as { data: PathLike; error: null };
    }
}

export async function exportFromSandbox(sandboxPath: string, pathInSandbox: string, pathTo: string) {
    if (!fs.existsSync(sandboxPath)) {
        return { data: null, error: new Error(`Sandbox at path ${sandboxPath} does not exist.`) } as { data: null; error: Error };
    } else if (!fs.existsSync(join(sandboxPath, pathInSandbox))) {
        return { data: null, error: new Error(`Path ${pathInSandbox} does not exist in sandbox ${sandboxPath}.`) } as { data: null; error: Error };
    }

    const { data, error } = await tryCatch(new Promise((resolve) => {
        fs.cpSync(join(sandboxPath, pathInSandbox), pathTo, { recursive: true });
        resolve(pathTo);
    }))

    if (error) {
        return { data: null, error };
    } else {
        return { data, error: null };
    }
}
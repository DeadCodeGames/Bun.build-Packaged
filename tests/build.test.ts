import { BunBuild, createSandbox, destroySandbox, createSandboxReturnType, importToSandbox, exportFromSandbox } from '../dist' /*'@dead404code/bun.build-packaged'*/
import path from 'path';
import fs from 'fs';

const sandbox: createSandboxReturnType = await createSandbox(path.resolve(__dirname, "test_project", 'bun.build sandbox'), { exists: "cleanup" });

if (sandbox.error) { throw sandbox.error; } else { console.log("sandbox path:", sandbox.data); };
const sandboxPath = (...pathArgs: string[]) => path.join(sandbox.data, ...pathArgs);

await importToSandbox(path.resolve(__dirname, "test_project", "public"), sandbox.data, "public");
await importToSandbox(path.resolve(__dirname, "test_project", "src"), sandbox.data, "src");

const buildOutput = await BunBuild({
    publicPath: "/",
    entrypoints: [sandboxPath("src", "index.tsx"), sandboxPath("src", "index2.tsx")],
    outdir: sandboxPath('build'),
    minify: true,
    sourcemap: "linked",
    format: 'iife',
    define: {
        'process.env.NODE_ENV': '"production"',
        'process.env.PUBLIC_URL': "."
    },
}, {
    clearOutputDirIfPresent: true,
    copyPublicDir: true,    
    publicDirPath: sandboxPath("public"),
    injectScriptTag: true,
    filesToInject: [[sandboxPath("build", "one", "index.html"), sandboxPath("build", "both", "index.html")], [sandboxPath("build", "two", "index.html"), sandboxPath("build", "both", "index.html")]],
    handleAliases: true,
    aliasesRecords: {
        "@/": sandboxPath("src")
    }
})

fs.rmSync(path.join(__dirname, "test_project", "build"), { recursive: true, force: true });

const buildCopyRes = await exportFromSandbox(sandbox.data, "build", path.resolve(__dirname, "test_project", "build"));
if (buildCopyRes.error) { throw buildCopyRes.error; } else { console.log("build copy res:", buildCopyRes.data); };

const destroyRes = await destroySandbox(sandbox.data);
if (destroyRes.error) { throw destroyRes.error; } else { console.log("destroyed sandbox", sandbox.data); };

// project finished at 27/03/2025, 8:54PM CET
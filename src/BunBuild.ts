import fs from 'fs';
import { build } from 'bun';
import { relative, resolve as pathResolve } from 'path';
import generateAssetManifest from './asset-manifest';
import { copyPublicFolder, injectScriptTags, makeOutDir, replaceAliases } from './helpers';
import { BunBuildConfig, BunBuildAdvancedConfig } from './types';

export default async function BunBuild(opts: BunBuildConfig, advanced?: BunBuildAdvancedConfig) {
    return new Promise(async (resolve, reject) => {
        makeOutDir(advanced?.clearOutputDirIfPresent || false, opts.outdir)

        copyPublicFolder(advanced?.copyPublicDir || false, advanced?.publicDirPath || "", opts.outdir, opts.publicPath)

        replaceAliases(advanced?.handleAliases || false, advanced?.aliasesRecords || {}, opts.entrypoints)

        const conversionResults = await build({ target: "browser", format: "iife",...opts, define: {'process.env.NODE_ENV': 'production', 'process.env.PUBLIC_URL': opts.publicPath, ...opts.define }, publicPath: opts.publicPath.endsWith("/") ? opts.publicPath : opts.publicPath + "/", outdir: undefined });
        
        const htmlFiles = fs.globSync(`${opts.outdir}/**/*.html`).map(p => relative(opts.outdir, p).replaceAll("\\", "/"));
        const { assetManifest, buildFileMappings } = await generateAssetManifest(conversionResults, opts.naming, htmlFiles);
        fs.writeFileSync(`${opts.outdir}/asset-manifest.json`, JSON.stringify(assetManifest, null, 2).replaceAll("\\n", "\n").replaceAll("\\\"", "\"").replace(/^"/, "").replace(/"$/, ""), { encoding: "utf-8" });
        
        const scriptsToInject = Object.entries(buildFileMappings).filter(([k, v]) => k.endsWith(".js"));

        injectScriptTags(advanced?.injectScriptTag || false, scriptsToInject, advanced?.filesToInject || [], opts.outdir, opts.publicPath);

        Object.entries(buildFileMappings).forEach(async (m) => { const [k, v] = m; const out = await conversionResults.outputs.find(o => o.path === k)!; const raw = out.type.startsWith("text") ? await out.text() : Buffer.from(await out.arrayBuffer()); fs.writeFileSync(pathResolve(opts.outdir, v), raw, {}); }); 
        
        resolve(conversionResults)
    })
}
import { rmSync, mkdirSync, readdirSync, existsSync, cpSync, readFileSync, writeFileSync } from 'fs';
import { basename, dirname, join, relative, sep } from 'path';
import { sync as globSync } from 'glob';

export function makeOutDir(clean: boolean, outDir: string) {
    if (clean && existsSync(outDir)) {
        rmSync(outDir);
        mkdirSync(outDir);
    } else if (!clean && existsSync(outDir) && readdirSync(outDir).length > 0) {
        console.warn(`Output directory ${outDir} already exists, and is not empty. If you want to overwrite it, set clearOutputDirIfPresent to true. Proceeding.`);
    } else if (!existsSync(outDir)) {
        mkdirSync(outDir);
    }
}

export function copyPublicFolder(shouldCopy: boolean, publicDirPath: string, outDir: string, publicURL: string) {
    if (shouldCopy && publicDirPath && existsSync(publicDirPath)) {
        cpSync(publicDirPath, outDir, { recursive: true });

        const files = globSync("**/*.html", { cwd: outDir });
        for (const file of files) {
            const filePath = join(outDir, file);
            if (existsSync(filePath)) {
                let content = readFileSync(filePath, 'utf-8');
                content = content.replace(/%PUBLIC_URL%/g, publicURL.replace(/\/*$/, ''));
                writeFileSync(filePath, content, 'utf-8');
                console.log(`Replaced %PUBLIC_URL% in: ${filePath}`);
            }
        }
    }
}

export function injectScriptTags(shouldInject: boolean, scriptsToInject: [string, string][], filesToInject: string[][], outDir: string, publicPath: string) {
    if (shouldInject) {
        for (let i = 0; i < scriptsToInject.length; i++) {
            const entrypointBasename = basename(scriptsToInject[i][0]).split(".")[0];
            const finalPublicUrl = publicPath.replace(/\/*$/, '');
            const indexScriptTagRegex = new RegExp(`<script\\s+defer\\s*=\\s*["']defer["']\\s+src\\s*=\\s*["']${finalPublicUrl}/${entrypointBasename}\\.js["']\\s*>\\s*</script>`);

            for (const filePath of (filesToInject || [])[i] || []) {
                try {
                    let fileContent = readFileSync(filePath, 'utf-8');
                    let relativePathToScript = relative(dirname(filePath), join(outDir, scriptsToInject[i][1])).replaceAll("\\", "/");

                    if (!indexScriptTagRegex.test(fileContent)) {
                        const headMatch = fileContent.match(/(.*)(<\/head>)/i);
                        const headIndentMatch = fileContent.match(/<head>.*?(\s*?)<\/head>/is)?.[1] || "";
                        if (headMatch) {
                            const indent = headMatch[1].match(/^\s*/)?.[0] || '';
                            const scriptTag = `${indent}<script defer="defer" src="${relativePathToScript}"></script>${headIndentMatch}`;
                            fileContent = fileContent.replace(/<\/head>/i, scriptTag + '</head>');
                            writeFileSync(filePath, fileContent, 'utf-8');
                            console.log(`Injected script tag into: ${filePath}`);
                        } else {
                            console.warn(`Could not find </head> tag in: ${filePath}. Skipping injection.`);
                        }
                    } else {
                        const headMatch = fileContent.match(/(.*)(<\/head>)/i);
                        if (headMatch) {
                            const scriptTagRegex = new RegExp(`(<script\\s+defer\\s*=\\s*["']defer["']\\s+src\\s*=\\s*["'])${finalPublicUrl}/${entrypointBasename}\\.js(["']\\s*>\\s*</script>)`);
                            fileContent = fileContent.replace(scriptTagRegex, `$1${relativePathToScript}$2`);
                            writeFileSync(filePath, fileContent, 'utf-8');
                            console.log(`Replaced script tag in: ${filePath}`);
                        } else {
                            console.warn(`Could not find </head> tag in: ${filePath}. Skipping injection.`);
                        }
                    }
                } catch (error) {
                    console.error(`Error processing file ${filePath}: ${(error as Error).message}`);
                }
            }
        }
    }
}

export function replaceAliases(shouldReplaceAliases: boolean, aliasesRecords: Record<string, string>, srcFiles: string[]) {
    if (!shouldReplaceAliases) return;

    const commonAncestor = findCommonAncestor(srcFiles);
    if (!commonAncestor) throw new Error("Could not determine a common ancestor directory.");

    const files = globSync("**/*.{js,ts,jsx,tsx}", { cwd: commonAncestor, absolute: true });

    const sortedAliases = Object.entries(aliasesRecords)
        .sort(([a], [b]) => b.length - a.length);

    files.forEach(file => {
        let content = readFileSync(file, 'utf8');
        let modified = false;

        for (const [alias, targetPath] of sortedAliases) {
            const regex = new RegExp(`import\\s+(?:(?:\\S+|{[^}]+})?\\s+from\\s+)*['"](${escapeRegex(alias)}.*?)['"]`, 'gm');
            
            content = content.replace(regex, (match, importPath) => {
                const absoluteImportPath = join(targetPath, importPath.replace(alias, ''));
                const relativeImportPath = relative(dirname(file), absoluteImportPath).replace(sep, '/');
                
                modified = true;
                return match.replace(importPath, relativeImportPath.startsWith('.') ? relativeImportPath : `./${relativeImportPath}`);
            });
        }

        if (modified) {
            writeFileSync(file, content, 'utf8');
            console.log(`Replaced import aliases in: ${file}`);
        }
    });
}

function findCommonAncestor(paths: string[]) {
    if (paths.length === 0) return null;
    let commonPath = paths[0].split(sep);
    
    for (let i = 1; i < paths.length; i++) {
        const parts = paths[i].split(sep);
        let j = 0;
        while (j < commonPath.length && j < parts.length && commonPath[j] === parts[j]) {
            j++;
        }
        commonPath = commonPath.slice(0, j);
    }
    return commonPath.length ? commonPath.join(sep) : null;
}

function escapeRegex(str: string) {
    return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

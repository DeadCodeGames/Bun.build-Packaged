import path from "path";
import { BuildConfig, BuildOutput } from "bun";
import { BuildFileMappings, AssetManifestGeneratorResult } from "./types";

export default async function generateAssetManifest(conversionResults: BuildOutput, naming?: BuildConfig["naming"], htmlFiles?: string[]): Promise<AssetManifestGeneratorResult> {
    if (!htmlFiles) htmlFiles = []
    const renameStyle: BuildConfig["naming"] = {};
    if (typeof naming === "string") {
        renameStyle.chunk = '[name]-[hash].[ext]';
        renameStyle.entry = naming;
        renameStyle.asset = '[name]-[hash].[ext]';
    } else if (typeof naming === "object") {
        renameStyle.chunk = naming.chunk ?? '[name]-[hash].[ext]';
        renameStyle.entry = naming.entry ?? '[dir]/[name]-[hash].[ext]';
        renameStyle.asset = naming.asset ?? '[name]-[hash].[ext]';
    } else {
        renameStyle.chunk = '[name]-[hash].[ext]';
        renameStyle.entry = '[dir]/[name]-[hash].[ext]';
        renameStyle.asset = '[name]-[hash].[ext]';
    }

    let manifest: { files: Record<string, string>; entrypoints: string[] } = {
        files: {},
        entrypoints: []
    }, buildFileMappings: BuildFileMappings = {}

    for (let file of htmlFiles) {
        manifest.files[file] = `/${file}`
    }

    for (const output of conversionResults.outputs) {
        if (output.kind === "sourcemap") continue;

        const normalizedPath = path.relative(".", output.path).replace(/\\/g, "/");
        const fileExtension = path.extname(normalizedPath).replace(/^\./, "");
        const dirPath = path.dirname(normalizedPath);
        const fileName = path.basename(normalizedPath, "." + fileExtension).replaceAll(`-${output.hash}`, "");
        let renamedPath = normalizedPath;

        if (output.hash) {
            renamedPath = renameStyle[output.kind === "asset" ? "asset" : output.kind === "entry-point" ? "entry" : "chunk"]!
                .replaceAll("[dir]", dirPath)
                .replaceAll("[name]", fileName)
                .replaceAll("[hash]", output.hash)
                .replaceAll("[ext]", fileExtension)
                .replaceAll(/^[.\/]+/g, "");
        }

        if (output.kind === "entry-point" || (output.kind === "asset" && output.type.startsWith("text/css"))) {
            manifest.entrypoints.push(renamedPath);
        }

        manifest.files[normalizedPath] = `/${renamedPath}`;
        buildFileMappings[output.path] = renamedPath;

        if (output.sourcemap) {
            const mapFileName = path.basename(renamedPath) + ".map";
            const mapRenamedPath = renameStyle.entry!
                .replaceAll("[dir]", dirPath)
                .replaceAll("[name]", fileName)
                .replaceAll("[hash]", output.hash || output.sourcemap.hash || "")
                .replaceAll("[ext]", fileExtension + ".map")
                .replaceAll(/^[.\/]+/g, "");
            
            manifest.files[mapFileName] = `/${mapRenamedPath.replace(/\\/g, "/")}`;
            buildFileMappings[output.sourcemap.path] = mapRenamedPath.replace(/\\/g, "/");
        }
    }

    return { assetManifest: JSON.stringify(manifest, null, 2), buildFileMappings }
}

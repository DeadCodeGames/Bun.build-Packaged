# Bun.build() Packaged **××**
###### Version 1.0.1
This is more than just a Bun.build wrapper, it is a comprehensive build solution for web projects, and a (very hopeful) replacement for react-scripts / react-app-rewired.

## 🌟 Why Bun.build Packaged?

Bun.build is cool. It can compile your code in a tiny fraction of what it takes for react-scripts or react-app-rewired. However, I think it is missing some core features, and requires some extra steps to get everything set up.
So here is what I added!
### 🗂️ Automatic Public Folder Handling
Bun.build leaves copying public assets to you. The advanced config's `publicDirPath` option automatically copies your public folder to the output directory.

```typescript
await BunBuild(
  { entrypoints: ['./src/index.js'], outdir: './dist' },
  { 
    copyPublicDir: true, 
    publicDirPath: './public' 
  }
)
```

### 🧹 Automatic Output Directory Management
Prevent build artifact accumulation with automatic output directory cleaning:

```typescript
await BunBuild(
  { entrypoints: ['./src/index.js'], outdir: './dist' },
  { clearOutputDirIfPresent: true }
)
```

### 🏷️ Automatic Script Tag Injection
Manually adding script tags is tedious. Automatically inject script tags into multiple HTML files:

```typescript
await BunBuild(
  { entrypoints: ['./src/index.js', './src/admin.js'], outdir: './dist' },
  { 
    injectScriptTag: true, 
    filesToInject: [
      [['./dist/index.html'], ['./dist/admin.html']] // one array per entrypoint, if you ever need to inject multiple scripts into one HTML file for... whatever reason, I am not here to judge. I demonstrated this in the tests folder :)
    ] 
  }
)
```

### 🔗 Path Alias Resolution
react-app-rewired lets you define path aliases, which get automatically resolved during dev runtime, and build time. Bun.build does not like those.

```typescript
await BunBuild(
  { entrypoints: ['./src/index.js'], outdir: './dist' },
  { 
    handleAliases: true, 
    aliasesRecords: {
      '@/': './src/',
      '@components/': './src/components/'
    } 
  }
)
```

### 🏖️ Sandboxing Utility
The nature of the path alias replacement is... *kinda destructive*. I mean, it ***literally*** rewrites the paths in the code. I am sure you see how this could be annoying.

```typescript
const { data: sandboxPath } = await createSandbox('./build-temp');
const sandboxPath = (...pathArgs: string[]) => path.join(data, ...pathArgs); // helper function for constructing sandbox paths
await importToSandbox(path.resolve(__dirname, "src"), sandboxPath, 'src');
await importToSandbox(path.resolve(__dirname, "public"), sandboxPath, 'public');
await BunBuild(
  { 
    entrypoints: [sandboxPath('src', 'index.tsx')], 
    outdir: sandboxPath('build') 
  },
  {
    handleAliases: true,
    aliasesRecords: {
      '@/': sandboxPath('src'),
      '@components/': sandboxPath('src', 'components')
    } 
   }
);
await exportFromSandbox(sandboxPath, 'build', path.resolve(__dirname, "final-build"));
await destroySandbox(sandboxPath);
```

This way, you can have your path aliases, the performance of Bun.build, *and* your code intact.

## 📦 Installation

```bash
bun add @dead404code/bun.build-packaged
```

## 🔧 Configuration Reference

### Main Build Configuration (`BunBuildConfig`)

These options are passed as the first argument to `BunBuild()` and directly control the build process:

#### Required Options
- `entrypoints`: `string[]`
  - List of entry point files to be bundled
  - Example: `['path/to/entry1.js', 'path/to/entry2.js']`

- `outdir`: `string` (required for full functionality of Bun.build Packaged)
  - Output directory for built files
  - Example: `'./dist'`

- `publicPath`: `string` (required for full functionality of Bun.build Packaged)
  - Base path for all assets in the build
  - Example: `'/'` or `'/app/'`

#### Build Target Options
- `target`: `"browser" | "node" | "bun"`
  - Specifies the runtime environment
  - Default: `"browser"`

- `format`: `"esm" | "cjs" | "iife"`
  - Module system format for output
  - Default: `"iife"` (Immediately Invoked Function Expression) (from my experience, this seems to work the best for React apps)

#### Naming Conventions
- `naming`: `string | { chunk?: string, entry?: string, asset?: string }`
  - Customize output file naming
  - Supports placeholders `[dir]`, `[name]`, `[hash]`, and `[ext]`
  - Example: 
    ```typescript
    naming: {
      chunk: '[name]-[hash].[ext]',
      entry: '[dir]/[name]-[hash].[ext]',
      asset: '[name]-[hash].[ext]'
    }
    ```

#### Advanced Build Options
- `splitting`: `boolean`
  - Enable code splitting
  - Default: `false`

- `external`: `string[]`
  - Specify modules to be treated as external dependencies, and left out from the final bundle

- `packages`: `"bundle" | "external"`
  - Control how dependencies are handled
  - `"bundle"`: Include dependencies in the build
  - `"external"`: Keep dependencies separate

- `minify`: `boolean | { whitespace?: boolean, syntax?: boolean, identifiers?: boolean }`
  - Control code minification
  - Can fine-tune specific minification aspects

- `sourcemap`: `"none" | "linked" | "inline" | "external" | boolean`
  - Configure source map generation

### Advanced Configuration (`BunBuildAdvancedConfig`)

These options are unique to Bun.build Packaged and enhance the build workflow:

- `clearOutputDirIfPresent`: `boolean`
  - Automatically clean the output directory before each build
  - Prevents accumulation of old build artifacts
  - Example: `true`

- `copyPublicDir`: `boolean`
  - Copy contents of a public directory to the output
  - Useful for static assets like `index.html`, images, etc.
  - Example: `true`

- `publicDirPath`: `string`
  - Path to the public directory to be copied
  - Example: `'./public'`

- `injectScriptTag`: `boolean`
  - Automatically inject script tags into HTML files
  - Makes managing script references easier
  - Example: `true`

- `filesToInject`: `string[][]`
  - Specify which HTML files should receive script tags
  - Supports multiple entrypoints with different injection targets
  - First array correspons to first entrypoint, second array corresponds to second entrypoint, etc.
  - Example: 
    ```typescript
    [
      ['./dist/index.html', './dist/admin.html'],
      ['./dist/dashboard.html']
    ]
    ```

- `handleAliases`: `boolean`
  - Automatically resolve import path aliases
  - Simplifies import statements
  - Example: `true`

- `aliasesRecords`: `Record<string, string>`
  - Define path aliases to be resolved
  - Example:
    ```typescript
    {
      '@/': './src/',
      '@components/': './src/components/',
      '@img': './src/images/'
    }
    ```

## Contributing and Issues

Contributions are welcome! If you have suggestions for improvements or new utilities, feel free to [open an issue](https://github.com/DeadCodeGames/Bun.build-Packaged/issues) or [submit a pull request](https://github.com/DeadCodeGames/Bun.build-Packaged/pulls).


If you encounter any bugs or have feature requests, please report them in the [issues section](https://github.com/DeadCodeGames/Bun.build-Packaged/issues).


## License


This project is licensed under the [WTFPL](https://en.wikipedia.org/wiki/WTFPL) (Do What The Fuck You Want To Public License). You are free to copy, modify, and distribute this package as you wish.



### Final acknowledgements
This README was officially approved by Hoshty from Team DeadCode.
> "Approved!" - Hoshty, 28/03/2025, 09:10AM CET
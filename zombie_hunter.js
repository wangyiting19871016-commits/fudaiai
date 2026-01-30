const fs = require('fs');
const path = require('path');

// Configuration
const ROOT_DIR = path.resolve(__dirname);
const SRC_DIR = path.join(ROOT_DIR, 'src');
const ENTRY_POINTS = [
    path.join(SRC_DIR, 'main.tsx'),
    path.join(SRC_DIR, 'index.css'), // Usually imported by main, but good to be explicit
];
const ALIAS_CONFIG = {
    '@/': path.join(SRC_DIR) + path.sep
};
const EXTENSIONS = ['.ts', '.tsx', '.js', '.jsx', '.json', '.css', '.scss', '.less'];
const IGNORE_DIRS = ['node_modules', '.git', 'dist', 'build', 'coverage', '_legacy_archive_20251226'];

// Stats
const visitedFiles = new Set();
const allFiles = new Set();
const missingImports = new Set();

/**
 * Helper to check if a file exists
 */
function fileExists(filePath) {
    return fs.existsSync(filePath) && fs.statSync(filePath).isFile();
}

/**
 * Resolve import path to absolute file path
 */
function resolvePath(currentFile, importPath) {
    let absolutePath = '';

    // Handle Aliases
    let isAlias = false;
    for (const [alias, target] of Object.entries(ALIAS_CONFIG)) {
        if (importPath.startsWith(alias.replace(/\/$/, ''))) {
            absolutePath = importPath.replace(alias.replace(/\/$/, ''), target);
            // Fix double separators if any
            absolutePath = path.normalize(absolutePath);
            isAlias = true;
            break;
        }
    }

    if (!isAlias) {
        if (importPath.startsWith('.')) {
            absolutePath = path.resolve(path.dirname(currentFile), importPath);
        } else {
            // Node modules or absolute system paths (ignore node_modules)
            return null;
        }
    }

    // Try exact match
    if (fileExists(absolutePath)) return absolutePath;

    // Try extensions
    for (const ext of EXTENSIONS) {
        if (fileExists(absolutePath + ext)) return absolutePath + ext;
    }

    // Try directory index
    const indexBase = path.join(absolutePath, 'index');
    for (const ext of EXTENSIONS) {
        if (fileExists(indexBase + ext)) return indexBase + ext;
    }

    return null; // Could not resolve (maybe a library or missing file)
}

/**
 * Extract imports from content
 */
function extractImports(content) {
    const imports = [];
    
    // Regex for: import ... from '...'
    const importRegex = /import\s+(?:[\w\s{},*]+from\s+)?['"]([^'"]+)['"]/g;
    let match;
    while ((match = importRegex.exec(content)) !== null) {
        imports.push(match[1]);
    }

    // Regex for: import('...') (Dynamic imports)
    const dynamicImportRegex = /import\(['"]([^'"]+)['"]\)/g;
    while ((match = dynamicImportRegex.exec(content)) !== null) {
        imports.push(match[1]);
    }

    // Regex for: require('...')
    const requireRegex = /require\(['"]([^'"]+)['"]\)/g;
    while ((match = requireRegex.exec(content)) !== null) {
        imports.push(match[1]);
    }

    // Regex for: url('...') (CSS/SCSS)
    const urlRegex = /url\(['"]?([^'"()]+)['"]?\)/g;
    while ((match = urlRegex.exec(content)) !== null) {
        imports.push(match[1]);
    }
    
    return imports;
}

/**
 * BFS Traversal
 */
function traverse(entryPoints) {
    const queue = [...entryPoints];
    
    entryPoints.forEach(ep => {
        if (fileExists(ep)) visitedFiles.add(ep);
    });

    while (queue.length > 0) {
        const currentFile = queue.shift();
        
        if (!fileExists(currentFile)) continue;

        try {
            const content = fs.readFileSync(currentFile, 'utf-8');
            const imports = extractImports(content);

            imports.forEach(imp => {
                // Ignore node_modules imports (non-relative, non-alias)
                if (!imp.startsWith('.') && !imp.startsWith('@/')) return;

                const resolved = resolvePath(currentFile, imp);
                
                if (resolved) {
                    if (!visitedFiles.has(resolved)) {
                        visitedFiles.add(resolved);
                        // Only recurse if it's a source file we want to parse
                        const ext = path.extname(resolved);
                        if (EXTENSIONS.includes(ext) && !resolved.includes('node_modules')) {
                            queue.push(resolved);
                        }
                    }
                } else {
                    // Log potential missing files or unhandled resolution
                    if (imp.startsWith('.') || imp.startsWith('@/')) {
                       missingImports.add(`${path.basename(currentFile)} -> ${imp}`);
                    }
                }
            });
        } catch (err) {
            console.error(`Error parsing ${currentFile}:`, err.message);
        }
    }
}

/**
 * Scan all files in SRC
 */
function scanDir(dir) {
    const files = fs.readdirSync(dir);
    
    files.forEach(file => {
        const fullPath = path.join(dir, file);
        if (IGNORE_DIRS.includes(file)) return;

        if (fs.statSync(fullPath).isDirectory()) {
            scanDir(fullPath);
        } else {
            allFiles.add(fullPath);
        }
    });
}

// --- Main Execution ---

console.log('🧟 Starting Zombie Hunter Scan...');
console.log(`🎯 Entry Points: ${ENTRY_POINTS.map(p => path.basename(p)).join(', ')}`);

// 1. Traverse Dependency Graph
traverse(ENTRY_POINTS);

// 2. Scan All Files
scanDir(SRC_DIR);

// 3. Calculate Zombies
const zombies = [];
const alive = [];

allFiles.forEach(file => {
    if (visitedFiles.has(file)) {
        alive.push(file);
    } else {
        zombies.push(file);
    }
});

// 4. Output Report
console.log('\n📊 Scan Results:');
console.log(`Total Files in src/: ${allFiles.size}`);
console.log(`Alive Files (Reachable): ${alive.size}`);
console.log(`Zombie Files (Unreachable): ${zombies.size}`);

if (missingImports.size > 0) {
    console.log('\n⚠️  Potential Broken Links (Could not resolve):');
    Array.from(missingImports).slice(0, 10).forEach(imp => console.log(`  - ${imp}`));
    if (missingImports.size > 10) console.log(`  ... and ${missingImports.size - 10} more.`);
}

console.log('\n💀 Zombie List (Potential Candidates for Deletion):');
zombies.sort().forEach(z => {
    // Print relative path for readability
    console.log(path.relative(ROOT_DIR, z));
});

console.log('\n✅ Scan Complete.');

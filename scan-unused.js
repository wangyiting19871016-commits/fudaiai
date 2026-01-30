const fs = require('fs');
const path = require('path');

// 扫描目录，获取所有.tsx和.ts文件
function getAllFiles(dirPath, arrayOfFiles = []) {
  const files = fs.readdirSync(dirPath);

  arrayOfFiles = arrayOfFiles || [];

  files.forEach(file => {
    if (fs.statSync(path.join(dirPath, file)).isDirectory()) {
      // 跳过legacy目录
      if (file === '_legacy_archive_20251226') {
        return;
      }
      arrayOfFiles = getAllFiles(path.join(dirPath, file), arrayOfFiles);
    } else {
      if (file.endsWith('.tsx') || file.endsWith('.ts')) {
        arrayOfFiles.push(path.join(dirPath, file));
      }
    }
  });

  return arrayOfFiles;
}

// 提取组件名称和函数名
function extractExportedNames(filePath) {
  const content = fs.readFileSync(filePath, 'utf8');
  const names = [];

  // 提取export default组件
  const defaultExportRegex = /export\s+default\s+(\w+)/g;
  let match;
  while ((match = defaultExportRegex.exec(content)) !== null) {
    names.push(match[1]);
  }

  // 提取export const/function
  const namedExportRegex = /export\s+(?:const|function|class|interface|type|enum)\s+([\w]+)/g;
  while ((match = namedExportRegex.exec(content)) !== null) {
    names.push(match[1]);
  }

  return names;
}

// 主函数
function main() {
  const srcDir = path.join(__dirname, 'src');
  const allFiles = getAllFiles(srcDir);
  const exportedNames = new Map(); // 存储所有导出的名称及其来源文件
  const referencedNames = new Set(); // 存储所有被引用的名称

  // 第一步：收集所有导出的名称
  allFiles.forEach(file => {
    const names = extractExportedNames(file);
    names.forEach(name => {
      if (!exportedNames.has(name)) {
        exportedNames.set(name, []);
      }
      exportedNames.get(name).push(file);
    });
  });

  // 第二步：收集所有被引用的名称
  allFiles.forEach(file => {
    const content = fs.readFileSync(file, 'utf8');
    // 匹配所有可能的引用
    const referenceRegex = /\b([A-Z]\w+|use\w+|\w+Service|\w+Store|\w+Provider)\b/g;
    let match;
    while ((match = referenceRegex.exec(content)) !== null) {
      referencedNames.add(match[1]);
    }
  });

  // 第三步：找出未被引用的名称
  const unusedNames = [];
  exportedNames.forEach((files, name) => {
    if (!referencedNames.has(name)) {
      unusedNames.push({ name, files });
    }
  });

  // 第四步：输出结果
  console.log('=== 未被引用的组件和函数 ===');
  unusedNames.forEach(item => {
    console.log(`\n名称: ${item.name}`);
    item.files.forEach(file => {
      console.log(`  来源: ${file.replace(srcDir, 'src')}`);
    });
  });

  console.log(`\n=== 总计: ${unusedNames.length} 个未被引用的组件和函数 ===`);
}

main();
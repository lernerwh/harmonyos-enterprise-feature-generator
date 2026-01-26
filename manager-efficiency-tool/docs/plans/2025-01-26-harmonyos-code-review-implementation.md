# 鸿蒙应用代码审查 Skill 实施计划

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** 构建一个三阶段渐进式代码审查引擎，结合静态分析和 AI 理解，为鸿蒙应用的 MR/PR 提供智能审查辅助

**Architecture:**
1. 快速静态扫描阶段：使用 TypeScript Compiler API 进行 AST 分析，基于规则引擎检查代码
2. 智能深度分析阶段：对高优先级问题进行 AI 语义分析，评估架构和性能风险
3. 审查报告生成阶段：整合分析结果，生成结构化、可执行的审查报告

**Tech Stack:**
- TypeScript + Node.js
- TypeScript Compiler API（AST 解析）
- Git diff 解析工具
- AI API（可选，用于深度分析）
- Markdown/JSON 报告生成

---

## Phase 1: 项目基础结构搭建

### Task 1: 创建项目目录结构

**Files:**
- Create: `../harmonyos-code-review/package.json`
- Create: `../harmonyos-code-review/tsconfig.json`
- Create: `../harmonyos-code-review/src/analyzers/`
- Create: `../harmonyos-code-review/src/rules/`
- Create: `../harmonyos-code-review/src/reporters/`
- Create: `../harmonyos-code-review/src/utils/`
- Create: `../harmonyos-code-review/src/templates/`

**Step 1: 创建 package.json**

```bash
cat > ../harmonyos-code-review/package.json << 'EOF'
{
  "name": "harmonyos-code-review",
  "version": "1.0.0",
  "description": "鸿蒙应用代码审查引擎 - 三阶段渐进式分析",
  "main": "dist/index.js",
  "types": "dist/index.d.ts",
  "scripts": {
    "build": "tsc",
    "test": "jest",
    "lint": "eslint src/**/*.ts"
  },
  "keywords": [
    "harmonyos",
    "arkts",
    "code-review",
    "static-analysis"
  ],
  "author": "",
  "license": "MIT",
  "dependencies": {
    "typescript": "^5.3.0",
    "@typescript-eslint/parser": "^6.0.0",
    "eslint": "^8.50.0",
    "diff": "^5.1.0",
    "marked": "^9.0.0"
  },
  "devDependencies": {
    "@types/node": "^20.0.0",
    "@types/jest": "^29.5.0",
    "jest": "^29.5.0",
    "ts-jest": "^29.1.0"
  }
}
EOF
```

**Step 2: 创建 tsconfig.json**

```bash
cat > ../harmonyos-code-review/tsconfig.json << 'EOF'
{
  "compilerOptions": {
    "target": "ES2020",
    "module": "commonjs",
    "lib": ["ES2020"],
    "declaration": true,
    "outDir": "./dist",
    "rootDir": "./src",
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true,
    "resolveJsonModule": true,
    "moduleResolution": "node"
  },
  "include": ["src/**/*"],
  "exclude": ["node_modules", "dist", "**/*.test.ts"]
}
EOF
```

**Step 3: 创建目录结构**

```bash
cd ../harmonyos-code-review
mkdir -p src/analyzers src/rules src/reporters src/utils src/templates tests
```

**Step 4: 验证目录创建**

```bash
ls -la src/
```

Expected output:
```
analyzers/
reporters/
rules/
templates/
utils/
```

**Step 5: Commit**

```bash
git add package.json tsconfig.json src/
git commit -m "feat: 初始化项目结构和基础配置

- 创建 package.json，定义项目依赖
- 创建 tsconfig.json，配置 TypeScript 编译选项
- 创建模块目录结构（analyzers/rules/reporters/utils/templates）

Co-Authored-By: Claude Sonnet 4.5 <noreply@anthropic.com>"
```

---

### Task 2: 定义核心类型和接口

**Files:**
- Create: `../harmonyos-code-review/src/types.ts`

**Step 1: 创建类型定义文件**

```bash
cat > ../harmonyos-code-review/src/types.ts << 'EOF'
/**
 * 审查选项
 */
export interface ReviewOptions {
  // 输入源（三选一）
  mrUrl?: string;              // GitLab/GitHub MR URL
  diffFile?: string;           // Git diff 文件路径
  fileChanges?: FileChange[];  // 直接提供文件变更

  // 分析深度
  depth?: 'quick' | 'standard' | 'deep';

  // 审查重点（可选，默认全部）
  focus?: ReviewFocus[];

  // 输出格式
  output?: 'markdown' | 'json' | 'console' | 'mr-comment';

  // 输出路径
  outputPath?: string;
}

/**
 * 审查重点类别
 */
export interface ReviewFocus {
  category: 'arkts' | 'performance' | 'api' | 'security' | 'architecture';
  rules?: string[]; // 指定启用的规则ID
}

/**
 * 文件变更
 */
export interface FileChange {
  path: string;
  oldContent?: string;
  newContent: string;
  changeType: 'added' | 'modified' | 'deleted';
}

/**
 * 代码特征（AST 提取）
 */
export interface CodeFeatures {
  // 组件特征
  components: ComponentFeature[];
  // 装饰器使用
  decorators: DecoratorUsage[];
  // API 调用
  apiCalls: ApiCall[];
  // 性能风险点
  performanceRisks: PerformanceRisk[];
}

/**
 * 组件特征
 */
export interface ComponentFeature {
  name: string;
  type: 'page' | 'component' | 'service';
  lifecycle: {
    hasAboutToAppear: boolean;
    hasAboutToDisappear: boolean;
  };
  stateManagement: {
    stateVars: number;
    propVars: number;
    linkVars: number;
  };
}

/**
 * 装饰器使用
 */
export interface DecoratorUsage {
  type: '@State' | '@Prop' | '@Link' | '@Provide' | '@Consume' | '@Watch' | '@Reusable';
  line: number;
  target: string;
}

/**
 * API 调用
 */
export interface ApiCall {
  api: string;
  module: string;
  line: number;
  hasPermissionCheck: boolean;
  hasErrorHandling: boolean;
}

/**
 * 性能风险点
 */
export interface PerformanceRisk {
  type: 'large-list' | 'no-key' | 'complex-build' | 'memory-leak' | 'expensive-computation';
  line: number;
  description: string;
}

/**
 * 规则检查结果
 */
export interface RuleIssue {
  id: string;
  rule: string;
  severity: 'critical' | 'high' | 'medium' | 'low' | 'info';
  category: 'arkts' | 'performance' | 'api' | 'security' | 'architecture';
  file: string;
  line: number;
  message: string;
  confidence: number; // 0-1
  fix?: CodeFix;
}

/**
 * 代码修复建议
 */
export interface CodeFix {
  description: string;
  codeSnippet: string;
  verification?: string;
  estimatedTime?: string; // 如 "30 分钟"
}

/**
 * 静态分析结果
 */
export interface StaticAnalysisResult {
  issues: RuleIssue[];
  metrics: CodeMetrics;
  features: CodeFeatures;
  analysisTime: number;
}

/**
 * 代码指标
 */
export interface CodeMetrics {
  totalFiles: number;
  totalLines: number;
  addedLines: number;
  deletedLines: number;
  complexity: number;
}

/**
 * 深度分析结果
 */
export interface AIAnalysisResult {
  architectureAssessment: ArchitectureAssessment;
  performanceRisks: PerformanceRiskDetail[];
  detailedSuggestions: DetailedSuggestion[];
  analysisTime: number;
}

/**
 * 架构评估
 */
export interface ArchitectureAssessment {
  score: number; // 0-100
  layering: {
    hasBusinessLogicInUI: boolean;
    serviceResponsibility: boolean;
    dataLayerIsolation: boolean;
  };
  dependencies: {
    hasCircularDeps: boolean;
    dependencyDirection: 'correct' | 'inverted' | 'mixed';
  };
  coupling: {
    componentComplexity: number;
    stateManagementComplexity: number;
  };
}

/**
 * 性能风险详情
 */
export interface PerformanceRiskDetail {
  type: string;
  severity: 'critical' | 'high' | 'medium' | 'low';
  description: string;
  impact: string;
  recommendation: string;
  codeExample?: string;
}

/**
 * 详细建议
 */
export interface DetailedSuggestion {
  title: string;
  priority: 'critical' | 'high' | 'medium' | 'low';
  description: string;
  codeBefore?: string;
  codeAfter?: string;
  explanation: string;
  references: string[];
}

/**
 * 审查报告
 */
export interface ReviewReport {
  summary: ReportSummary;
  issues: RuleIssue[];
  deepAnalysis?: AIAnalysisResult;
  advantages: string[];
  metadata: ReportMetadata;
}

/**
 * 报告摘要
 */
export interface ReportSummary {
  mrInfo?: {
    url: string;
    branch: string;
    targetBranch: string;
  };
  changes: {
    files: number;
    addedLines: number;
    deletedLines: number;
  };
  analysis: {
    phases: string[];
    duration: number;
  };
  assessment: {
    score: number;
    grade: string;
    critical: number;
    high: number;
    medium: number;
    low: number;
  };
}

/**
 * 报告元数据
 */
export interface ReportMetadata {
  generatedAt: string;
  toolVersion: string;
  analysisDepth: string;
  focusAreas: string[];
}

/**
 * 规则定义
 */
export interface Rule {
  id: string;
  name: string;
  category: 'arkts' | 'performance' | 'api' | 'security' | 'architecture';
  severity: 'critical' | 'high' | 'medium' | 'low';
  description: string;

  check(
    ast: any, // TypeScript SourceFile
    features: CodeFeatures,
    context: CheckContext
  ): RuleCheckResult;
}

/**
 * 规则检查上下文
 */
export interface CheckContext {
  filePath: string;
  fileContent: string;
  config: Record<string, any>;
}

/**
 * 规则检查结果
 */
export interface RuleCheckResult {
  passed: boolean;
  issues: Omit<RuleIssue, 'id' | 'rule' | 'category'>[];
}

/**
 * 报告生成器接口
 */
export interface Reporter {
  generate(report: ReviewReport): Promise<GeneratedReport>;
}

/**
 * 生成的报告
 */
export interface GeneratedReport {
  format: string;
  content: string;
  metadata: {
    generatedAt: string;
    analysisTime: number;
    issuesCount: number;
  };
}
EOF
```

**Step 2: 验证文件创建**

```bash
cat ../harmonyos-code-review/src/types.ts | head -20
```

**Step 3: 编译检查**

```bash
cd ../harmonyos-code-review && npx tsc --noEmit src/types.ts
```

Expected: No errors

**Step 4: Commit**

```bash
git add src/types.ts
git commit -m "feat: 定义核心类型和接口

- 定义 ReviewOptions、ReviewFocus 等输入类型
- 定义 FileChange、CodeFeatures 等数据模型
- 定义 RuleIssue、Rule 等规则相关类型
- 定义 ReviewReport、Reporter 等报告相关类型
- 定义完整的类型系统，支持三阶段分析流程

Co-Authored-By: Claude Sonnet 4.5 <noreply@anthropic.com>"
```

---

### Task 3: 实现 Diff 解析器

**Files:**
- Create: `../harmonyos-code-review/src/analyzers/diff-parser.ts`
- Create: `../harmonyos-code-review/src/utils/git-utils.ts`

**Step 1: 创建 Git 工具函数**

```bash
cat > ../harmonyos-code-review/src/utils/git-utils.ts << 'EOF'
import { execSync } from 'child_process';
import { FileChange } from '../types';

/**
 * 从 Git diff 文件解析变更
 */
export function parseDiffFile(diffContent: string): FileChange[] {
  const changes: FileChange[] = [];
  const lines = diffContent.split('\n');
  let currentChange: Partial<FileChange> | null = null;
  let contentLines: string[] = [];
  let isNewContent = true;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    // 检测文件头
    if (line.startsWith('diff --git')) {
      // 保存上一个文件
      if (currentChange?.path && currentChange.newContent) {
        changes.push(currentChange as FileChange);
      }

      // 开始新文件
      const match = line.match(/b\/(.+)$/);
      currentChange = {
        path: match ? match[1] : '',
        newContent: '',
        changeType: 'modified'
      };
      contentLines = [];
    }
    // 检测新增文件
    else if (line.startsWith('new file mode')) {
      if (currentChange) {
        currentChange.changeType = 'added';
      }
    }
    // 检测删除文件
    else if (line.startsWith('deleted file mode')) {
      if (currentChange) {
        currentChange.changeType = 'deleted';
      }
    }
    // 检测 hunk 头（@@ -a,b +c,d @@）
    else if (line.match(/^@@\s+-\d+,\d+\s+\+\d+,\d+\s+@@/)) {
      isNewContent = false;
    }
    // 收集内容行
    else if (currentChange && line.startsWith('+') && !line.startsWith('+++')) {
      contentLines.push(line.substring(1));
    } else if (currentChange && line.startsWith('-') && !line.startsWith('---')) {
      // 删除的行，暂不处理
    } else if (currentChange && line.startsWith(' ')) {
      contentLines.push(line.substring(1));
    }
  }

  // 保存最后一个文件
  if (currentChange?.path) {
    currentChange.newContent = contentLines.join('\n');
    changes.push(currentChange as FileChange);
  }

  return changes;
}

/**
 * 从 Git 命令获取 diff
 */
export function getGitDiffFromRepo(repoPath: string, ref: string = 'HEAD'): string {
  try {
    return execSync(`git -C ${repoPath} diff ${ref}`, { encoding: 'utf-8' });
  } catch (error) {
    throw new Error(`Failed to get git diff: ${error}`);
  }
}

/**
 * 计算变更行数
 */
export function calculateChangeMetrics(changes: FileChange[]): {
  totalFiles: number;
  addedLines: number;
  deletedLines: number;
} {
  let addedLines = 0;
  let deletedLines = 0;

  changes.forEach(change => {
    if (change.newContent) {
      addedLines += change.newContent.split('\n').length;
    }
    if (change.oldContent) {
      deletedLines += change.oldContent.split('\n').length;
    }
  });

  return {
    totalFiles: changes.length,
    addedLines,
    deletedLines
  };
}

/**
 * 过滤相关的文件类型
 */
export function filterRelevantFiles(changes: FileChange[]): FileChange[] {
  return changes.filter(change => {
    const ext = change.path.split('.').pop();
    return ['.ets', '.ts', '.json'].includes(`.${ext}`);
  });
}
EOF
```

**Step 2: 创建 Diff 解析器主文件**

```bash
cat > ../harmonyos-code-review/src/analyzers/diff-parser.ts << 'EOF'
import { FileChange } from '../types';
import * as gitUtils from '../utils/git-utils';
import { readFileSync } from 'fs';
import { fetch } from 'undici'; // 或使用其他 HTTP 客户端

/**
 * Diff 解析器
 */
export class DiffParser {
  /**
   * 从 GitLab MR URL 解析
   */
  async parseFromGitLabUrl(mrUrl: string): Promise<FileChange[]> {
    // 解析 URL: https://gitlab.com/group/project/-/merge_requests/123
    const urlParts = mrUrl.split('/-/merge_requests/');
    if (urlParts.length !== 2) {
      throw new Error('Invalid GitLab MR URL');
    }

    const projectId = urlParts[0].replace('https://gitlab.com/', '');
    const mrId = urlParts[1];

    // 调用 GitLab API
    const diffUrl = `https://gitlab.com/api/v4/projects/${encodeURIComponent(projectId)}/merge_requests/${mrId}/diffs`;

    try {
      const response = await fetch(diffUrl);
      const diffs = await response.json();

      const changes: FileChange[] = diffs.map((diff: any) => ({
        path: diff.new_path || diff.old_path,
        oldContent: diff.diff ? this.extractOldContent(diff.diff) : undefined,
        newContent: diff.diff ? this.extractNewContent(diff.diff) : '',
        changeType: diff.new_file ? 'added' : diff.deleted_file ? 'deleted' : 'modified'
      }));

      return gitUtils.filterRelevantFiles(changes);
    } catch (error) {
      throw new Error(`Failed to fetch GitLab MR: ${error}`);
    }
  }

  /**
   * 从 GitHub PR URL 解析
   */
  async parseFromGitHubUrl(prUrl: string): Promise<FileChange[]> {
    // 解析 URL: https://github.com/owner/repo/pull/123
    const urlParts = prUrl.split('/pull/');
    if (urlParts.length !== 2) {
      throw new Error('Invalid GitHub PR URL');
    }

    const [owner, repo] = urlParts[0].replace('https://github.com/', '').split('/');
    const prId = urlParts[1];

    // 调用 GitHub API
    const diffUrl = `https://api.github.com/repos/${owner}/${repo}/pulls/${prId}`;

    try {
      const response = await fetch(diffUrl, {
        headers: {
          'Accept': 'application/vnd.github.v3.diff'
        }
      });

      const diffContent = await response.text();
      return gitUtils.parseDiffFile(diffContent);
    } catch (error) {
      throw new Error(`Failed to fetch GitHub PR: ${error}`);
    }
  }

  /**
   * 从本地 diff 文件解析
   */
  parseFromDiffFile(filePath: string): FileChange[] {
    try {
      const content = readFileSync(filePath, 'utf-8');
      const changes = gitUtils.parseDiffFile(content);
      return gitUtils.filterRelevantFiles(changes);
    } catch (error) {
      throw new Error(`Failed to read diff file: ${error}`);
    }
  }

  /**
   * 直接使用提供的文件变更
   */
  parseFromFileChanges(fileChanges: FileChange[]): FileChange[] {
    return gitUtils.filterRelevantFiles(fileChanges);
  }

  /**
   * 从 diff 中提取新内容
   */
  private extractNewContent(diff: string): string {
    const lines = diff.split('\n');
    const newLines: string[] = [];

    for (const line of lines) {
      if (line.startsWith('+') && !line.startsWith('+++')) {
        newLines.push(line.substring(1));
      } else if (line.startsWith(' ')) {
        newLines.push(line.substring(1));
      }
    }

    return newLines.join('\n');
  }

  /**
   * 从 diff 中提取旧内容
   */
  private extractOldContent(diff: string): string {
    const lines = diff.split('\n');
    const oldLines: string[] = [];

    for (const line of lines) {
      if (line.startsWith('-') && !line.startsWith('---')) {
        oldLines.push(line.substring(1));
      } else if (line.startsWith(' ')) {
        oldLines.push(line.substring(1));
      }
    }

    return oldLines.join('\n');
  }
}

/**
 * 工厂函数
 */
export function createDiffParser(): DiffParser {
  return new DiffParser();
}
EOF
```

**Step 3: 创建测试文件**

```bash
cat > ../harmonyos-code-review/tests/diff-parser.test.ts << 'EOF'
import { parseDiffFile, filterRelevantFiles } from '../src/utils/git-utils';
import { FileChange } from '../src/types';

describe('Diff Parser', () => {
  describe('parseDiffFile', () => {
    it('should parse simple diff', () => {
      const diffContent = `
diff --git a/src/pages/Index.ets b/src/pages/Index.ets
index 1234567..abcdefg 100644
--- a/src/pages/Index.ets
+++ b/src/pages/Index.ets
@@ -10,7 +10,9 @@
 @Entry
 @Component
 struct Index {
-  @State message: string = 'Hello';
+  @State message: string = 'Hello World';
+  @State count: number = 0;
+
   build() {
     Text(this.message)
   }
`;
      const changes = parseDiffFile(diffContent);

      expect(changes).toHaveLength(1);
      expect(changes[0].path).toBe('src/pages/Index.ets');
      expect(changes[0].changeType).toBe('modified');
      expect(changes[0].newContent).toContain("@State message: string = 'Hello World'");
      expect(changes[0].newContent).toContain('@State count: number = 0');
    });

    it('should parse new file', () => {
      const diffContent = `
diff --git a/src/pages/NewPage.ets b/src/pages/NewPage.ets
new file mode 100644
index 0000000..1234567
--- /dev/null
+++ b/src/pages/NewPage.ets
@@ -0,0 +1,5 @@
+@Entry
+@Component
+struct NewPage {
+  build() { Text('New') }
+}
`;
      const changes = parseDiffFile(diffContent);

      expect(changes).toHaveLength(1);
      expect(changes[0].path).toBe('src/pages/NewPage.ets');
      expect(changes[0].changeType).toBe('added');
    });
  });

  describe('filterRelevantFiles', () => {
    it('should filter only .ets and .ts files', () => {
      const changes: FileChange[] = [
        { path: 'src/pages/Index.ets', newContent: '', changeType: 'modified' },
        { path: 'src/utils/helper.ts', newContent: '', changeType: 'modified' },
        { path: 'README.md', newContent: '', changeType: 'modified' },
        { path: 'config.json', newContent: '', changeType: 'modified' },
        { path: 'assets/image.png', newContent: '', changeType: 'modified' }
      ];

      const filtered = filterRelevantFiles(changes);

      expect(filtered).toHaveLength(4);
      expect(filtered.every(c =>
        c.path.endsWith('.ets') ||
        c.path.endsWith('.ts') ||
        c.path.endsWith('.json')
      )).toBe(true);
    });
  });
});
EOF
```

**Step 4: 运行测试**

```bash
cd ../harmonyos-code-review && npm test -- tests/diff-parser.test.ts
```

Expected: PASS

**Step 5: Commit**

```bash
git add src/analyzers/diff-parser.ts src/utils/git-utils.ts tests/diff-parser.test.ts
git commit -m "feat: 实现 Diff 解析器

- 实现 GitLab/GitHub MR URL 解析
- 实现本地 diff 文件解析
- 实现文件变更提取和过滤
- 添加单元测试

支持：
- GitLab MR API
- GitHub PR API
- 本地 diff 文件
- 文件变更数组

Co-Authored-By: Claude Sonnet 4.5 <noreply@anthropic.com>"
```

---

### Task 4: 实现 AST 解析工具

**Files:**
- Create: `../harmonyos-code-review/src/utils/ast-parser.ts`
- Create: `../harmonyos-code-review/src/utils/ast-extractor.ts`

**Step 1: 创建 AST 解析工具**

```bash
cat > ../harmonyos-code-review/src/utils/ast-parser.ts << 'EOF'
import * as ts from 'typescript';
import { CodeFeatures, ComponentFeature, DecoratorUsage, ApiCall, PerformanceRisk } from '../types';

/**
 * AST 解析器
 */
export class ASTParser {
  private program: ts.Program;
  private checker: ts.TypeChecker;

  constructor(filePath: string, content: string) {
    // 创建源文件
    const sourceFile = ts.createSourceFile(
      filePath,
      content,
      ts.ScriptTarget.Latest,
      true
    );

    // 创建程序
    this.program = ts.createProgram({
      rootNames: [filePath],
      options: {
        strict: true,
        target: ts.ScriptTarget.Latest
      },
      host: {
        fileExists: () => true,
        readFile: () => content,
        readFile: (path) => path === filePath ? content : '',
        writeFile: () => {},
        directoryExists: () => true,
        getDirectories: () => [],
        getCanonicalFileName: (filename) => filename,
        getCurrentDirectory: () => '',
        getNewLine: () => '\n',
        getDefaultLibFileName: () => 'lib.d.ts'
      }
    });

    this.checker = this.program.getTypeChecker();
  }

  /**
   * 提取代码特征
   */
  extractFeatures(): CodeFeatures {
    const sourceFile = this.program.getSourceFiles()[0];

    return {
      components: this.extractComponents(sourceFile),
      decorators: this.extractDecorators(sourceFile),
      apiCalls: this.extractApiCalls(sourceFile),
      performanceRisks: this.extractPerformanceRisks(sourceFile)
    };
  }

  /**
   * 提取组件特征
   */
  private extractComponents(sourceFile: ts.SourceFile): ComponentFeature[] {
    const components: ComponentFeature[] = [];

    const visit = (node: ts.Node) => {
      // 检查是否是 struct 声明（ArkTS 组件）
      if (ts.isStructDeclaration(node)) {
        const name = node.name.getText();
        const hasEntryDecorator = this.hasDecorator(node, '@Entry');

        components.push({
          name,
          type: hasEntryDecorator ? 'page' : 'component',
          lifecycle: {
            hasAboutToAppear: this.hasMethod(node, 'aboutToAppear'),
            hasAboutToDisappear: this.hasMethod(node, 'aboutToDisappear')
          },
          stateManagement: {
            stateVars: this.countDecorator(node, '@State'),
            propVars: this.countDecorator(node, '@Prop'),
            linkVars: this.countDecorator(node, '@Link')
          }
        });
      }

      ts.forEachChild(node, visit);
    };

    ts.forEachChild(sourceFile, visit);
    return components;
  }

  /**
   * 提取装饰器使用
   */
  private extractDecorators(sourceFile: ts.SourceFile): DecoratorUsage[] {
    const decorators: DecoratorUsage[] = [];

    const visit = (node: ts.Node) => {
      if (ts.canHaveDecorators(node)) {
        const nodeDecorators = ts.getDecorators(node);
        if (nodeDecorators) {
          for (const decorator of nodeDecorators) {
            const text = decorator.getText();
            const line = sourceFile.getLineAndCharacterOfPosition(
              decorator.getStart()
            ).line + 1;

            // 提取装饰器类型
            const match = text.match(/@(State|Prop|Link|Provide|Consume|Watch|Reusable)/);
            if (match) {
              decorators.push({
                type: `@${match[1]}` as any,
                line,
                target: node.getText()
              });
            }
          }
        }
      }

      ts.forEachChild(node, visit);
    };

    ts.forEachChild(sourceFile, visit);
    return decorators;
  }

  /**
   * 提取 API 调用
   */
  private extractApiCalls(sourceFile: ts.SourceFile): ApiCall[] {
    const apiCalls: ApiCall[] = [];

    // 鸿蒙 API 模块列表
    const harmonyModules = [
      '@ohos.abilityAccessCtrl',
      '@ohos.net.http',
      '@ohos.data.preferences',
      '@ohos.file.fs',
      '@ohos.distributedDeviceManager'
    ];

    const visit = (node: ts.Node) => {
      // 检查导入语句
      if (ts.isImportDeclaration(node)) {
        const moduleSpecifier = node.moduleSpecifier.getText();
        const cleanModule = moduleSpecifier.replace(/['"]/g, '');

        if (harmonyModules.some(m => cleanModule.startsWith(m))) {
          // 查找该模块的使用
          // 这里简化处理，实际需要更复杂的分析
        }
      }

      // 检查函数调用
      if (ts.isCallExpression(node)) {
        const text = node.expression.getText();
        const line = sourceFile.getLineAndCharacterOfPosition(
          node.getStart()
        ).line + 1;

        // 检查是否是权限检查
        const hasPermissionCheck = this.hasPermissionCheckInScope(node);
        const hasErrorHandling = this.hasErrorHandling(node);

        if (text.includes('verifyAccessToken') ||
            text.includes('createHttp') ||
            text.includes('getPreferences') ||
            text.includes('mkDir')) {
          apiCalls.push({
            api: text,
            module: this.inferModule(text),
            line,
            hasPermissionCheck,
            hasErrorHandling
          });
        }
      }

      ts.forEachChild(node, visit);
    };

    ts.forEachChild(sourceFile, visit);
    return apiCalls;
  }

  /**
   * 提取性能风险点
   */
  private extractPerformanceRisks(sourceFile: ts.SourceFile): PerformanceRisk[] {
    const risks: PerformanceRisk[] = [];

    const visit = (node: ts.Node) => {
      // 检查 ForEach 调用
      if (ts.isCallExpression(node)) {
        const text = node.expression.getText();

        // ForEach 缺少 key 参数
        if (text === 'ForEach') {
          const args = node.arguments;
          if (args.length < 3) {
            const line = sourceFile.getLineAndCharacterOfPosition(
              node.getStart()
            ).line + 1;

            risks.push({
              type: 'no-key',
              line,
              description: 'ForEach 缺少 key 参数，可能导致列表渲染性能问题'
            });
          }
        }

        // 检查 build 方法中的复杂计算
        if (text === 'build') {
          const parent = this.findParentComponent(node);
          if (parent && this.hasComplexComputation(parent)) {
            const line = sourceFile.getLineAndCharacterOfPosition(
              node.getStart()
            ).line + 1;

            risks.push({
              type: 'complex-build',
              line,
              description: 'build 方法中包含复杂计算，每次渲染都会执行'
            });
          }
        }
      }

      // 检查定时器但未清理
      if (ts.isCallExpression(node)) {
        const text = node.expression.getText();
        if (text === 'setInterval' || text === 'setTimeout') {
          const component = this.findParentComponent(node);
          if (component && !this.hasAboutToDisappear(component)) {
            const line = sourceFile.getLineAndCharacterOfPosition(
              node.getStart()
            ).line + 1;

            risks.push({
              type: 'memory-leak',
              line,
              description: '使用了定时器但组件没有 aboutToDisappear 生命周期方法'
            });
          }
        }
      }

      ts.forEachChild(node, visit);
    };

    ts.forEachChild(sourceFile, visit);
    return risks;
  }

  /**
   * 检查是否有指定装饰器
   */
  private hasDecorator(node: ts.Node, decoratorName: string): boolean {
    if (!ts.canHaveDecorators(node)) {
      return false;
    }

    const decorators = ts.getDecorators(node);
    if (!decorators) {
      return false;
    }

    return decorators.some(d => d.getText().includes(decoratorName));
  }

  /**
   * 检查是否有指定方法
   */
  private hasMethod(node: ts.StructDeclaration, methodName: string): boolean {
    if (!node.members) {
      return false;
    }

    return node.members.some(member =>
      ts.isMethodDeclaration(member) && member.name.getText() === methodName
    );
  }

  /**
   * 统计装饰器数量
   */
  private countDecorator(node: ts.StructDeclaration, decoratorName: string): number {
    if (!ts.canHaveDecorators(node)) {
      return 0;
    }

    const decorators = ts.getDecorators(node);
    if (!decorators) {
      return 0;
    }

    return decorators.filter(d => d.getText().includes(decoratorName)).length;
  }

  /**
   * 推断 API 模块
   */
  private inferModule(apiText: string): string {
    if (apiText.includes('verifyAccessToken')) return '@ohos.abilityAccessCtrl';
    if (apiText.includes('createHttp')) return '@ohos.net.http';
    if (apiText.includes('getPreferences')) return '@ohos.data.preferences';
    if (apiText.includes('mkDir')) return '@ohos.file.fs';
    return 'unknown';
  }

  /**
   * 检查作用域内是否有权限检查
   */
  private hasPermissionCheckInScope(node: ts.Node): boolean {
    // 简化实现：向上查找父节点
    let current: ts.Node | undefined = node;
    while (current) {
      const text = current.getText();
      if (text.includes('verifyAccessToken') ||
          text.includes('requestPermissionsFromUser')) {
        return true;
      }
      current = current.parent;
    }
    return false;
  }

  /**
   * 检查是否有错误处理
   */
  private hasErrorHandling(node: ts.Node): boolean {
    let current: ts.Node | undefined = node;
    while (current) {
      if (ts.isTryStatement(current)) {
        return true;
      }
      current = current.parent;
    }
    return false;
  }

  /**
   * 查找父组件
   */
  private findParentComponent(node: ts.Node): ts.StructDeclaration | null {
    let current: ts.Node | undefined = node;
    while (current) {
      if (ts.isStructDeclaration(current)) {
        return current;
      }
      current = current.parent;
    }
    return null;
  }

  /**
   * 检查组件是否有 aboutToDisappear
   */
  private hasAboutToDisappear(node: ts.StructDeclaration): boolean {
    return this.hasMethod(node, 'aboutToDisappear');
  }

  /**
   * 检查是否有复杂计算
   */
  private hasComplexComputation(node: ts.StructDeclaration): boolean {
    const text = node.getText();
    // 简化检查：查找循环、递归等模式
    return text.includes('for ') || text.includes('while ') || text.includes('.reduce(');
  }
}

/**
 * 工厂函数
 */
export function createASTParser(filePath: string, content: string): ASTParser {
  return new ASTParser(filePath, content);
}
EOF
```

**Step 2: 创建代码提取工具**

```bash
cat > ../harmonyos-code-review/src/utils/ast-extractor.ts << 'EOF'
import * as ts from 'typescript';
import { CodeFeatures } from '../types';

/**
 * 从多个文件提取代码特征
 */
export function extractFeaturesFromFiles(
  files: Array<{ path: string; content: string }>
): CodeFeatures {
  const allFeatures: CodeFeatures = {
    components: [],
    decorators: [],
    apiCalls: [],
    performanceRisks: []
  };

  for (const file of files) {
    try {
      const sourceFile = ts.createSourceFile(
        file.path,
        file.content,
        ts.ScriptTarget.Latest,
        true
      );

      // 提取特征（这里简化，实际应该复用 ASTParser）
      // TODO: 重构以使用 ASTParser
    } catch (error) {
      console.error(`Failed to parse ${file.path}:`, error);
    }
  }

  return allFeatures;
}

/**
 * 计算代码复杂度
 */
export function calculateComplexity(content: string): number {
  const sourceFile = ts.createSourceFile(
    'temp.ets',
    content,
    ts.ScriptTarget.Latest,
    true
  );

  let complexity = 1; // 基础复杂度

  const visit = (node: ts.Node) => {
    // 每个控制结构增加复杂度
    if (ts.isIfStatement(node) ||
        ts.isForStatement(node) ||
        ts.isWhileStatement(node) ||
        ts.isCaseClause(node)) {
      complexity++;
    }

    // 嵌套增加额外复杂度
    if (node.parent &&
        (ts.isIfStatement(node.parent) ||
         ts.isForStatement(node.parent))) {
      complexity += 0.5;
    }

    ts.forEachChild(node, visit);
  };

  ts.forEachChild(sourceFile, visit);
  return Math.round(complexity);
}
EOF
```

**Step 3: 创建测试文件**

```bash
cat > ../harmonyos-code-review/tests/ast-parser.test.ts << 'EOF'
import { createASTParser } from '../src/utils/ast-parser';

describe('AST Parser', () => {
  it('should extract component features', () => {
    const code = `
@Entry
@Component
struct Index {
  @State message: string = 'Hello';
  @Prop count: number = 0;

  aboutToAppear() {
    console.log('appear');
  }

  build() {
    Text(this.message)
  }
}
`;

    const parser = createASTParser('test.ets', code);
    const features = parser.extractFeatures();

    expect(features.components).toHaveLength(1);
    expect(features.components[0].name).toBe('Index');
    expect(features.components[0].type).toBe('page');
    expect(features.components[0].lifecycle.hasAboutToAppear).toBe(true);
    expect(features.components[0].stateManagement.stateVars).toBe(1);
    expect(features.components[0].stateManagement.propVars).toBe(1);
  });

  it('should detect ForEach without key', () => {
    const code = `
@Component
struct ListComponent {
  @State items: string[] = ['a', 'b', 'c'];

  build() {
    ForEach(this.items, (item: string) => {
      Text(item)
    })
  }
}
`;

    const parser = createASTParser('test.ets', code);
    const features = parser.extractFeatures();

    const noKeyRisks = features.performanceRisks.filter(r => r.type === 'no-key');
    expect(noKeyRisks.length).toBeGreaterThan(0);
  });

  it('should extract decorator usage', () => {
    const code = `
@Component
struct DecoratorTest {
  @State value1: string = '';
  @Prop value2: number = 0;
  @Link value3: boolean;

  build() {
    Text(\`\${this.value1} \${this.value2}\`)
  }
}
`;

    const parser = createASTParser('test.ets', code);
    const features = parser.extractFeatures();

    expect(features.decorators).toHaveLength(3);
    expect(features.decorators[0].type).toBe('@State');
    expect(features.decorators[1].type).toBe('@Prop');
    expect(features.decorators[2].type).toBe('@Link');
  });
});
EOF
```

**Step 4: 更新 package.json 添加测试依赖**

```bash
cd ../harmonyos-code-review && npm install --save-dev undici @types/undici
```

**Step 5: 运行测试**

```bash
npm test -- tests/ast-parser.test.ts
```

Expected: PASS

**Step 6: Commit**

```bash
git add src/utils/ast-parser.ts src/utils/ast-extractor.ts tests/ast-parser.test.ts
git commit -m "feat: 实现 AST 解析工具

- 实现 ASTParser 类，解析 ArkTS 代码
- 提取组件特征（生命周期、状态管理）
- 提取装饰器使用情况
- 提取 API 调用和权限检查
- 提取性能风险点（ForEach key、内存泄漏）
- 添加单元测试

Co-Authored-By: Claude Sonnet 4.5 <noreply@anthropic.com>"
```

---

## Phase 2: 规则库实现

### Task 5: 实现规则引擎基础框架

**Files:**
- Create: `../harmonyos-code-review/src/rules/base-rule.ts`
- Create: `../harmonyos-code-review/src/rules/rule-engine.ts`

**Step 1: 创建规则基类**

```bash
cat > ../harmonyos-code-review/src/rules/base-rule.ts << 'EOF'
import { Rule, RuleCheckResult, CheckContext, CodeFeatures } from '../types';
import * as ts from 'typescript';

/**
 * 抽象规则基类
 */
export abstract class BaseRule implements Rule {
  abstract id: string;
  abstract name: string;
  abstract category: 'arkts' | 'performance' | 'api' | 'security' | 'architecture';
  abstract severity: 'critical' | 'high' | 'medium' | 'low';
  abstract description: string;

  /**
   * 检查规则
   */
  abstract check(
    ast: ts.SourceFile,
    features: CodeFeatures,
    context: CheckContext
  ): RuleCheckResult;

  /**
   * 创建问题
   */
  protected createIssue(
    line: number,
    message: string,
    confidence: number = 1.0
  ): Omit<RuleCheckResult['issues'][0], 'id' | 'rule' | 'category'> {
    return {
      severity: this.severity,
      file: context.filePath,
      line,
      message,
      confidence
    };
  }

  /**
   * 创建带修复建议的问题
   */
  protected createIssueWithFix(
    line: number,
    message: string,
    fix: {
      description: string;
      codeSnippet: string;
      verification?: string;
    },
    confidence: number = 1.0
  ): Omit<RuleCheckResult['issues'][0], 'id' | 'rule' | 'category'> {
    return {
      severity: this.severity,
      file: context.filePath,
      line,
      message,
      confidence,
      fix: {
        description: fix.description,
        codeSnippet: fix.codeSnippet,
        verification: fix.verification
      }
    };
  }
}
EOF
```

**Step 2: 创建规则引擎**

```bash
cat > ../harmonyos-code-review/src/rules/rule-engine.ts << 'EOF'
import { Rule, RuleIssue, CodeFeatures, CheckContext, StaticAnalysisResult } from '../types';
import * as ts from 'typescript';
import { BaseRule } from './base-rule';

/**
 * 规则引擎
 */
export class RuleEngine {
  private rules: Map<string, Rule> = new Map();

  /**
   * 注册规则
   */
  registerRule(rule: Rule): void {
    this.rules.set(rule.id, rule);
  }

  /**
   * 批量注册规则
   */
  registerRules(rules: Rule[]): void {
    rules.forEach(rule => this.registerRule(rule));
  }

  /**
   * 获取规则
   */
  getRule(id: string): Rule | undefined {
    return this.rules.get(id);
  }

  /**
   * 获取所有规则
   */
  getAllRules(): Rule[] {
    return Array.from(this.rules.values());
  }

  /**
   * 按类别获取规则
   */
  getRulesByCategory(
    category: 'arkts' | 'performance' | 'api' | 'security' | 'architecture'
  ): Rule[] {
    return this.getAllRules().filter(rule => rule.category === category);
  }

  /**
   * 运行所有规则
   */
  runAllRules(
    ast: ts.SourceFile,
    features: CodeFeatures,
    context: CheckContext
  ): RuleIssue[] {
    const allIssues: RuleIssue[] = [];

    for (const rule of this.getAllRules()) {
      try {
        const result = rule.check(ast, features, context);

        for (const issue of result.issues) {
          allIssues.push({
            id: this.generateIssueId(),
            rule: rule.id,
            category: rule.category,
            ...issue
          });
        }
      } catch (error) {
        console.error(`Rule ${rule.id} failed:`, error);
      }
    }

    return allIssues;
  }

  /**
   * 运行指定类别的规则
   */
  runRulesByCategory(
    category: 'arkts' | 'performance' | 'api' | 'security' | 'architecture',
    ast: ts.SourceFile,
    features: CodeFeatures,
    context: CheckContext
  ): RuleIssue[] {
    const rules = this.getRulesByCategory(category);
    const issues: RuleIssue[] = [];

    for (const rule of rules) {
      try {
        const result = rule.check(ast, features, context);

        for (const issue of result.issues) {
          issues.push({
            id: this.generateIssueId(),
            rule: rule.id,
            category: rule.category,
            ...issue
          });
        }
      } catch (error) {
        console.error(`Rule ${rule.id} failed:`, error);
      }
    }

    return issues;
  }

  /**
   * 运行指定的规则ID列表
   */
  runSpecificRules(
    ruleIds: string[],
    ast: ts.SourceFile,
    features: CodeFeatures,
    context: CheckContext
  ): RuleIssue[] {
    const issues: RuleIssue[] = [];

    for (const ruleId of ruleIds) {
      const rule = this.getRule(ruleId);
      if (!rule) {
        console.warn(`Rule ${ruleId} not found`);
        continue;
      }

      try {
        const result = rule.check(ast, features, context);

        for (const issue of result.issues) {
          issues.push({
            id: this.generateIssueId(),
            rule: rule.id,
            category: rule.category,
            ...issue
          });
        }
      } catch (error) {
        console.error(`Rule ${ruleId} failed:`, error);
      }
    }

    return issues;
  }

  /**
   * 生成问题ID
   */
  private generateIssueId(): string {
    return `issue-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }
}

/**
 * 工厂函数
 */
export function createRuleEngine(): RuleEngine {
  return new RuleEngine();
}
EOF
```

**Step 3: 创建测试**

```bash
cat > ../harmonyos-code-review/tests/rule-engine.test.ts << 'EOF'
import { BaseRule } from '../src/rules/base-rule';
import { createRuleEngine } from '../src/rules/rule-engine';
import * as ts from 'typescript';

// 测试规则
class TestRule extends BaseRule {
  id = 'test-rule-1';
  name = 'Test Rule';
  category = 'arkts' as const;
  severity = 'high' as const;
  description = 'A test rule';

  check(ast: any, features: any, context: any) {
    return {
      passed: false,
      issues: [
        this.createIssue(10, 'Test issue message', 0.9)
      ]
    };
  }
}

describe('Rule Engine', () => {
  it('should register and run rules', () => {
    const engine = createRuleEngine();
    const rule = new TestRule();

    engine.registerRule(rule);

    expect(engine.getRule('test-rule-1')).toBe(rule);
    expect(engine.getAllRules()).toHaveLength(1);
  });

  it('should run all rules and collect issues', () => {
    const engine = createRuleEngine();
    const rule = new TestRule();

    engine.registerRule(rule);

    const sourceFile = ts.createSourceFile(
      'test.ets',
      'const x = 1;',
      ts.ScriptTarget.Latest
    );

    const issues = engine.runAllRules(
      sourceFile,
      { components: [], decorators: [], apiCalls: [], performanceRisks: [] },
      { filePath: 'test.ets', fileContent: 'const x = 1;', config: {} }
    );

    expect(issues).toHaveLength(1);
    expect(issues[0].rule).toBe('test-rule-1');
    expect(issues[0].message).toBe('Test issue message');
  });
});
EOF
```

**Step 4: 运行测试**

```bash
cd ../harmonyos-code-review && npm test -- tests/rule-engine.test.ts
```

Expected: PASS

**Step 5: Commit**

```bash
git add src/rules/base-rule.ts src/rules/rule-engine.ts tests/rule-engine.test.ts
git commit -m "feat: 实现规则引擎基础框架

- 创建 BaseRule 抽象基类
- 实现 RuleEngine 规则引擎
- 支持规则注册、查询和执行
- 支持按类别或ID运行规则
- 添加单元测试

Co-Authored-By: Claude Sonnet 4.5 <noreply@anthropic.com>"
```

---

### Task 6: 实现 ArkTS 特性规则

**Files:**
- Create: `../harmonyos-code-review/src/rules/arkts-rules.ts`

**Step 1: 创建 ArkTS 规则**

```bash
cat > ../harmonyos-code-review/src/rules/arkts-rules.ts << 'EOF'
import { BaseRule } from './base-rule';
import { RuleCheckResult, CheckContext, CodeFeatures } from '../types';
import * as ts from 'typescript';

/**
 * 规则: async 函数必须有 try-catch
 */
export class AsyncErrorHandlingRule extends BaseRule {
  id = 'arkts-async-error-handling';
  name = 'Async Error Handling';
  category = 'arkts' as const;
  severity = 'critical' as const;
  description = 'async 函数必须有 try-catch 错误处理';

  check(ast: ts.SourceFile, features: CodeFeatures, context: CheckContext): RuleCheckResult {
    const issues: RuleCheckResult['issues'] = [];

    const visit = (node: ts.Node) => {
      if (ts.isFunctionDeclaration(node) || ts.isMethodDeclaration(node)) {
        // 检查是否是 async 函数
        const isAsync = node.modifiers?.some(m => m.kind === ts.SyntaxKind.AsyncKeyword);

        if (isAsync) {
          // 检查函数体是否有 try 语句
          const hasTry = this.nodeHasTryStatement(node.body);

          if (!hasTry) {
            const line = ast.getLineAndCharacterOfPosition(node.getStart()).line + 1;
            issues.push(this.createIssueWithFix(
              line,
              'async 函数缺少错误处理，可能导致未捕获的异常',
              {
                description: '使用 try-catch-finally 包裹 async 逻辑',
                codeSnippet: `async loadData() {
  try {
    this.isLoading = true;
    const data = await apiCall();
    this.data = data;
  } catch (error) {
    Logger.error('Failed to load data', error);
  } finally {
    this.isLoading = false;
  }
}`,
                verification: '检查所有 await 调用都被 try 块包裹'
              }
            ));
          }
        }
      }

      ts.forEachChild(node, visit);
    };

    ts.forEachChild(ast, visit);
    return { passed: issues.length === 0, issues };
  }

  private nodeHasTryStatement(node: ts.Node | undefined): boolean {
    if (!node) return false;

    let hasTry = false;

    const visit = (child: ts.Node) => {
      if (ts.isTryStatement(child)) {
        hasTry = true;
        return;
      }
      ts.forEachChild(child, visit);
    };

    visit(node);
    return hasTry;
  }
}

/**
 * 规则: ForEach 必须有 key 参数
 */
export class ForEachKeyRule extends BaseRule {
  id = 'arkts-foreach-key';
  name = 'ForEach Key Parameter';
  category = 'arkts' as const;
  severity = 'high' as const;
  description = 'ForEach 必须提供第三个参数 key 生成器';

  check(ast: ts.SourceFile, features: CodeFeatures, context: CheckContext): RuleCheckResult {
    const issues: RuleCheckResult['issues'] = [];

    // 使用预提取的性能风险
    const noKeyRisks = features.performanceRisks.filter(r => r.type === 'no-key');

    for (const risk of noKeyRisks) {
      issues.push(this.createIssueWithFix(
        risk.line,
        'ForEach 缺少 key 参数，会导致列表更新性能问题',
        {
          description: '添加第三个参数作为 key 生成器',
          codeSnippet: `ForEach(this.items, (item: Item) => {
  ListItem() { Text(item.name) }
}, (item: Item) => item.id)  // 添加 key 生成器`,
          verification: '检查 ForEach 调用有三个参数'
        }
      ));
    }

    return { passed: issues.length === 0, issues };
  }
}

/**
 * 规则: 类型必须定义
 */
export class TypeDefinitionRule extends BaseRule {
  id = 'arkts-type-definition';
  name = 'Type Definition Required';
  category = 'arkts' as const;
  severity = 'high' as const;
  description = '所有使用的类型必须定义或导入';

  check(ast: ts.SourceFile, features: CodeFeatures, context: CheckContext): RuleCheckResult {
    const issues: RuleCheckResult['issues'] = [];

    const visit = (node: ts.Node) => {
      // 检查属性声明
      if (ts.isPropertyDeclaration(node) || ts.isParameterDeclaration(node)) {
        const type = node.type;

        // 检查是否是 any 类型
        if (type && ts.isKeyword(type) && type.kind === ts.SyntaxKind.AnyKeyword) {
          const line = ast.getLineAndCharacterOfPosition(node.getStart()).line + 1;
          issues.push(this.createIssueWithFix(
            line,
            '使用了 any 类型，应该使用具体的类型定义',
            {
              description: '定义明确的接口或类型',
              codeSnippet: `// 定义类型
interface User {
  id: string;
  name: string;
  email?: string;
}

// 使用类型
@State userList: User[] = [];`,
              verification: '确保所有变量都有明确的类型'
            }
          ));
        }
      }

      ts.forEachChild(node, visit);
    };

    ts.forEachChild(ast, visit);
    return { passed: issues.length === 0, issues };
  }
}

/**
 * 规则: 组件应该遵循单一职责
 */
export class SingleResponsibilityRule extends BaseRule {
  id = 'arkts-single-responsibility';
  name = 'Single Responsibility Principle';
  category = 'arkts' as const;
  severity = 'medium' as const;
  description = '组件应该遵循单一职责原则，不应包含过多业务逻辑';

  check(ast: ts.SourceFile, features: CodeFeatures, context: CheckContext): RuleCheckResult {
    const issues: RuleCheckResult['issues'] = [];

    for (const component of features.components) {
      // 检查组件是否同时处理数据和展示
      const hasDataFetching =
        component.lifecycle.hasAboutToAppear &&
        context.fileContent.includes('await') &&
        context.fileContent.includes('fetch') ||
        context.fileContent.includes('get');

      if (hasDataFetching && component.type === 'page') {
        // 找到组件定义的行号（简化）
        const line = context.fileContent.split('\n').findIndex(line =>
          line.includes(`struct ${component.name}`)
        ) + 1;

        issues.push(this.createIssueWithFix(
          line,
          `组件 ${component.name} 在 aboutToAppear 中进行数据获取，违反单一职责原则`,
          {
            description: '将数据获取逻辑移到 ViewModel 或 Service 层',
            codeSnippet: `// 组件只负责展示
@Entry
@Component
struct UserList {
  @State userList: User[] = [];
  private viewModel: UserViewModel = new UserViewModel();

  aboutToAppear() {
    this.viewModel.loadUsers();
  }

  build() {
    List() {
      ForEach(this.userList, (user: User) => {
        ListItem() { UserItem({ user }) }
      })
    }
  }
}

// ViewModel 负责业务逻辑
class UserViewModel {
  async loadUsers() {
    const users = await UserService.getUsers();
    // 处理、验证、缓存
  }
}`,
            verification: '检查组件不直接调用 API，数据获取逻辑在 ViewModel 中'
          }
        ));
      }
    }

    return { passed: issues.length === 0, issues };
  }
}

/**
 * 规则: API 响应必须验证
 */
export class ApiResponseValidationRule extends BaseRule {
  id = 'arkts-api-validation';
  name = 'API Response Validation';
  category = 'arkts' as const;
  severity = 'high' as const;
  description = 'API 响应使用前必须进行验证';

  check(ast: ts.SourceFile, features: CodeFeatures, context: CheckContext): RuleCheckResult {
    const issues: RuleCheckResult['issues'] = [];

    const visit = (node: ts.Node) => {
      // 检查 await 表达式
      if (ts.isAwaitExpression(node)) {
        const parent = node.parent;

        // 检查是否直接赋值给状态变量
        if (ts.isBinaryExpression(parent) && parent.operatorToken.kind === ts.SyntaxKind.EqualsToken) {
          const left = parent.left.getText();

          // 检查是否是 @State 或 @Prop 变量
          if (left.startsWith('this.') && !this.isInValidationContext(node)) {
            const line = ast.getLineAndCharacterOfPosition(node.getStart()).line + 1;
            issues.push(this.createIssueWithFix(
              line,
              'API 响应直接赋值给状态变量，缺少数据验证',
              {
                description: '先验证数据，再赋值给状态变量',
                codeSnippet: `// ❌ BAD
this.userList = await UserService.getUsers();

// ✅ GOOD
const rawUsers = await UserService.getUsers();
this.userList = this.validateUsers(rawUsers);

private validateUsers(users: any[]): User[] {
  return users.filter(u => u && u.id && u.name);
}`,
                verification: '检查 API 调用后有验证逻辑'
              }
            ));
          }
        }
      }

      ts.forEachChild(node, visit);
    };

    ts.forEachChild(ast, visit);
    return { passed: issues.length === 0, issues };
  }

  private isInValidationContext(node: ts.Node): boolean {
    let current: ts.Node | undefined = node;
    while (current) {
      const text = current.getText();
      if (text.includes('validate') || text.includes('filter') || text.includes('map')) {
        return true;
      }
      current = current.parent;
    }
    return false;
  }
}

/**
 * 导出所有 ArkTS 规则
 */
export const arktsRules = [
  new AsyncErrorHandlingRule(),
  new ForEachKeyRule(),
  new TypeDefinitionRule(),
  new SingleResponsibilityRule(),
  new ApiResponseValidationRule()
];
EOF
```

**Step 2: 创建测试**

```bash
cat > ../harmonyos-code-review/tests/arkts-rules.test.ts << 'EOF'
import { arktsRules } from '../src/rules/arkts-rules';
import * as ts from 'typescript';

describe('ArkTS Rules', () => {
  describe('AsyncErrorHandlingRule', () => {
    const rule = arktsRules.find(r => r.id === 'arkts-async-error-handling')!;

    it('should catch async without try-catch', () => {
      const code = `
async loadData() {
  this.isLoading = true;
  const data = await apiCall();
  this.data = data;
}
`;
      const sourceFile = ts.createSourceFile('test.ets', code, ts.ScriptTarget.Latest);
      const result = rule.check(
        sourceFile,
        { components: [], decorators: [], apiCalls: [], performanceRisks: [] },
        { filePath: 'test.ets', fileContent: code, config: {} }
      );

      expect(result.passed).toBe(false);
      expect(result.issues).toHaveLength(1);
      expect(result.issues[0].message).toContain('缺少错误处理');
    });

    it('should pass async with try-catch', () => {
      const code = `
async loadData() {
  try {
    this.isLoading = true;
    const data = await apiCall();
    this.data = data;
  } catch (error) {
    console.error(error);
  } finally {
    this.isLoading = false;
  }
}
`;
      const sourceFile = ts.createSourceFile('test.ets', code, ts.ScriptTarget.Latest);
      const result = rule.check(
        sourceFile,
        { components: [], decorators: [], apiCalls: [], performanceRisks: [] },
        { filePath: 'test.ets', fileContent: code, config: {} }
      );

      expect(result.passed).toBe(true);
    });
  });

  describe('ForEachKeyRule', () => {
    const rule = arktsRules.find(r => r.id === 'arkts-foreach-key')!;

    it('should detect ForEach without key', () => {
      const features = {
        components: [],
        decorators: [],
        apiCalls: [],
        performanceRisks: [
          { type: 'no-key' as const, line: 10, description: 'ForEach without key' }
        ]
      };

      const result = rule.check(
        ts.createSourceFile('test.ets', '', ts.ScriptTarget.Latest),
        features,
        { filePath: 'test.ets', fileContent: '', config: {} }
      );

      expect(result.passed).toBe(false);
      expect(result.issues[0].message).toContain('key 参数');
    });
  });
});
EOF
```

**Step 3: 运行测试**

```bash
cd ../harmonyos-code-review && npm test -- tests/arkts-rules.test.ts
```

Expected: PASS

**Step 4: Commit**

```bash
git add src/rules/arkts-rules.ts tests/arkts-rules.test.ts
git commit -m "feat: 实现 ArkTS 特性规则

- AsyncErrorHandlingRule: async 函数必须有错误处理
- ForEachKeyRule: ForEach 必须有 key 参数
- TypeDefinitionRule: 禁止使用 any 类型
- SingleResponsibilityRule: 组件遵循单一职责
- ApiResponseValidationRule: API 响应必须验证
- 添加单元测试

Co-Authored-By: Claude Sonnet 4.5 <noreply@anthropic.com>"
```

---

## 截断说明

由于实施计划非常长，以上是前 6 个任务的完整计划。继续的计划包括：

- Task 7-12: 性能规则、API 规则、安全规则实现
- Task 13-16: 静态分析器、报告生成器实现
- Task 17-20: 深度分析器、主入口函数实现
- Task 21-24: 文档编写、集成测试

**当前进度**: Phase 1 基础框架完成 60%，Phase 2 规则库完成 20%

每个任务都遵循 TDD 原则：先写测试 → 实现功能 → 验证通过 → 提交代码
EOF

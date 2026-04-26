# debrief — 跑完一个长任务后，帮你搞清楚刚才发生了什么

一个为 [OpenCode](https://opencode.ai) 构建的苏格拉底式提问 Agent，帮助你在 AI 辅助编码后重新建立对自己项目的理解。

**Tab 切过去就开始提问，Tab 切回来继续写代码。**

## 快速开始

### 前置条件

- [OpenCode](https://opencode.ai) 已安装
- [Node.js](https://nodejs.org) 或 [Bun](https://bun.sh)

### 3 步跑起来

```bash
# 1. Clone 并 build
git clone https://github.com/zhan-tz/debrief.git
cd debrief
npm install && npm run build

# 2. 把 agent prompt 复制到你的项目里
cp -r .opencode /path/to/your/project/.opencode

# 3. 在你的项目里创建 opencode.json（如果还没有的话）
```

在你的项目的 `opencode.json` 里加上插件引用：

```json
{
  "plugin": ["file:///绝对路径/debrief/dist/index.js"]
}
```

然后进入你的项目目录启动 opencode，按 **Tab** 就能看到 `debrief` agent 了。

### 仅使用 Agent（不用插件）

如果你只想试试苏格拉底式提问的效果，不需要插件也行——把 `.opencode/agent/debrief.md` 复制到你的项目里就够了。Agent 会直接用 OpenCode 内置的 read/glob/grep 工具获取上下文，只是少了 `scan_project` 和 `analyze_session` 两个专用工具。

```bash
cp .opencode/agent/debrief.md /path/to/your/project/.opencode/agent/debrief.md
```

## 效果预览

选中 debrief agent 后，它会：

1. 自动扫描你的项目结构
2. 分析当前会话做了什么
3. 用 `question` 工具弹出**交互式问题**——不是纯文字输出，是底部弹出选项卡

每个问题都包含：
- **具体观察**：从你的代码里提取的真实事实
- **思考路径**：对比、因果、反常等引导方向
- **三个选项**：引导方向 / 常见误区 / 安全出口

示例：
> "我注意到你的 scanner 和 history 是两个独立模块——scanner 读文件系统，history 查 API。你觉得为什么它们不是一个统一的'数据采集器'？"
> - "因为数据源不同，分开更清晰" → 跟进：那为什么不用统一的接口抽象？
> - "因为历史原因" → 跟进：如果重新设计，你会怎么统一？
> - "不确定，想从基础开始" → 我们从模块职责开始聊

## 产品洞察

### 问题的角度本身就是讲解

在传统教育产品中，AI 讲解概念，用户吸收知识。但我发现了一种更有效的方式：**好的苏格拉底式提问本身就是一个微课堂**。

如果 AI 只是问"这个数据流怎么工作的？"，用户只会觉得累——因为问题里没有信息，没有路径，只有压力。好的问题包含观察、路径和邀请，用户顺着问题走就能学到东西。

### CLI Agent 时代的新认知问题

2025 年起，开发者大量使用 AI Agent 写代码。结果是：**代码跑了，效果有了，但开发者不理解发生了什么。** 导师随便挑一个问题就答不上来——数据来源、名词解释、设计原因，完全没印象。

debrief 就是解决这个问题的：让你在 AI 帮你写完代码后，重新建立对项目的理解。

## 架构

```
┌──────────────────────────────────────┐
│  .opencode/agent/debrief.md          │
│  苏格拉底式导师的完整 prompt          │
│  - 问题构建公式：观察 → 路径 → 提问   │
│  - 认知弱点检测（5种信号 + 干预策略）  │
│  - 提问主导权（不被用户带偏）          │
│  - 三选模板（引导/误区/安全出口）      │
├──────────────────────────────────────┤
│  opencode-debrief (Plugin)            │
│  注册两个工具供 Agent 调用            │
│  - scan_project: 扫描项目文件结构     │
│  - analyze_session: 分析会话历史      │
└──────────────────────────────────────┘
```

Agent 负责人格和提问策略（纯 markdown），Plugin 负责提供工具（TypeScript）。

修改提问策略只需要改 markdown 文件，不需要重新 build。Agent prompt 可读性极高——HR 直接看 `.opencode/agent/debrief.md` 就能理解产品核心设计。

## 设计决策

### 为什么用 Agent 而不是 Command？

- **Command**（`/xxx`）：一次性触发，执行完就结束
- **Agent**（Tab 切换）：持久的人格，可以持续对话

苏格拉底式提问是多轮对话——Agent 天然适配。Command 只能触发一次，无法维持"追问"的对话流。

### 为什么用 `question` 工具而不是纯文字输出？

OpenCode 的 `question` 工具在 TUI 底部弹出可点击的选项卡——比纯文字输出更有交互感，用户可以选预设方向也可以自己输入。这种交互方式本身就是一种教学设计。

### 为什么不做知识图谱？

- **太重**：简历项目不需要如此复杂的工程
- **不灵活**：难以适应不同项目和学习阶段
- **LLM 已有理解能力**：通过良好的提示词即可引导 LLM 做自适应提问

## 项目结构

```
src/
  index.ts              # Plugin 入口，注册 scan_project 和 analyze_session
.opencode/
  agent/
    debrief.md          # 苏格拉底式导师 Agent prompt（231行）
```

## 开发

```bash
npm install
npm run build
```

## License

MIT

---

> 这是我在准备智谱教育产品经理实习时做的一个项目。核心洞察是"问题的角度本身就是讲解"——这可能是 LLM 时代教育的一个切入点。如果你觉得这个思路有趣，欢迎交流！

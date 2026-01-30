# 真迹项目施工宪法 (Project Technical Constraints)

## 1. 逻辑锚点
- **强制前置条件**：任何 Builder 操作前，必须先完整读取项目根目录下的 `Project_Blueprint.md`。

## 2. 页面职能锁定 (禁止混淆)
- **P1/P2**：主页与路径展示，目前为只读/稳定区，严禁擅自修改其基础 UI 逻辑。
- **P3**：用户执行页，逻辑需与 P4 的发布协议完全兼容。
- **P4/P4LAB**：核心发布与实验室区。所有协议测试必须在此先行验证。

## 3. 技术红线 (针对 P4LAB 常见 Bug)
- **音频流处理**：若 `outputType` 为 `audio`，必须检查 `apiService.ts`，强制使用 `response.blob()` 接收，严禁使用 `.json()` 解析。
- **字段唯一性**：语音复刻任务的输入键名强制锁定为 `input`，绝对禁止改为 `text`。
- **接口一致性**：所有协议配置必须从 `src/config/protocolConfig.ts` 动态读取，禁止硬编码。
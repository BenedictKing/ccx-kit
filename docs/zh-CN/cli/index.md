---
title: 命令概览
---

# 命令概览

ZCF CLI 基于 `cac` 实现，所有命令均可通过 `npx ccx-kit <command>` 调用。常用命令如下：

| 命令 | 说明 |
| --- | --- |
| `ccx-kit` | 打开交互式菜单，聚合所有功能 |
| `ccx-kit init` / `ccx-kit i` | 完整初始化，覆盖 Claude Code 或 Codex |
| `ccx-kit update` / `ccx-kit u` | 更新工作流与模板，可选择语言与输出样式 |
| `ccx-kit ccx` | 管理 Claude Code Router 代理 |
| `ccx-kit ccu` | Claude Code 使用分析与统计 |
| `ccx-kit uninstall` | 卸载配置并可选择保留备份 |
| `ccx-kit config-switch` / `ccx-kit cs` | 在多套配置之间切换 |
| `ccx-kit check-updates` / `ccx-kit check` | 检查并升级工具链 |

每个命令均支持 `--help` 查看详细参数。以下章节将逐一说明。

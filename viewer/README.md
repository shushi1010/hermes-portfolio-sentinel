# Hermes Portfolio Sentinel 看板

## 功能

- 读取 `../holdings_record.xlsx` 并转换为 `portfolio_data.json`
- 展示组合总览、单股盈亏、仓位占比和风险提醒
- 支持市场、风险、关键词筛选
- 支持按市值、仓位、今日涨跌、累计盈亏排序
- 关注列表保存在浏览器 `localStorage`，适合 GitHub Pages 静态部署

## 启动

在本目录执行：

```bash
../.venv/bin/python run_viewer.py
```

如果端口被占用，可换端口启动：

```bash
../.venv/bin/python run_viewer.py --port 7770
```

浏览器打开：

```text
http://127.0.0.1:8765
```

## 仅更新数据

```bash
../.venv/bin/python build_data.py
```

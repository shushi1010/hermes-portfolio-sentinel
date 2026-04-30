# Hermes Portfolio Sentinel

**hermes-portfolio-sentinel** 是一个基于 Hermes 的持仓股票监控系统：每天读取你的持仓清单，抓取最新行情，计算组合盈亏和风险提醒，推送飞书日报，并生成本地或 GitHub Pages 可用的网页看板。

## 功能

- 通过 `holdings.csv` 维护持仓
- 自动拉取股票最新价格
- 计算单股市值、今日盈亏、累计盈亏、仓位占比
- 根据仓位、跌幅、浮亏和提醒价生成风险提示
- 写入 `holdings_record.xlsx` 作为每日快照
- 生成 `viewer/portfolio_data.json` 供网页看板使用
- 生成 `feishu_msg.md`，方便 Hermes cron 推送到飞书
- 支持本地网页查看，也支持 GitHub Pages 发布

## 持仓配置

编辑 [holdings.csv](holdings.csv)：

```csv
symbol,name,market,shares,cost_price,sector,alert_below,alert_above,notes
AAPL,Apple,US,10,180,Technology,160,220,示例持仓，请替换为你自己的股票
NVDA,NVIDIA,US,5,650,Semiconductors,580,900,示例持仓，请替换为你自己的股票
```

字段说明：

- `symbol`：行情代码，例如 `AAPL`、`NVDA`、`0700.HK`、`600519.SS`
- `shares`：持仓数量
- `cost_price`：持仓成本价
- `alert_below` / `alert_above`：可选提醒价
- `sector`、`notes`：用于看板筛选和备注

## 运行

创建项目内虚拟环境并安装依赖：

```bash
python3 -m venv .venv
.venv/bin/python -m pip install openpyxl requests
```

执行监控：

```bash
.venv/bin/python monitor.py
```

脚本会生成：

- `holdings_record.xlsx`
- `portfolio_snapshot.json`
- `viewer/portfolio_data.json`
- `feishu_msg.md`

## 本地网页看板

```bash
cd viewer
../.venv/bin/python run_viewer.py
```

浏览器访问：

```text
http://127.0.0.1:8765
```

看板支持：

- 组合总览
- 按市场、风险、关键词筛选
- 按市值、仓位、今日涨跌、累计盈亏排序
- 本地关注列表，保存在浏览器 `localStorage`

## GitHub Pages 模式

如果要自动发布看板，请先 fork 本仓库，并确保 `origin` 指向你自己的 fork，推荐 SSH：

```bash
git remote set-url origin git@github.com:<your-github-id>/hermes-portfolio-sentinel.git
```

手动发布：

```bash
.venv/bin/python monitor.py
bash scripts/publish_viewer.sh
```

发布脚本只会提交 `viewer/portfolio_data.json` 和 viewer 前端文件。

## Hermes Cron

生成 cron prompt：

```bash
bash prepare_deploy.sh
```

GitHub Pages 模式：

```bash
DEPLOY_MODE=pages bash prepare_deploy.sh
```

然后在 Hermes/飞书对话里使用 `cronjob_prompt.generated.txt` 的完整内容创建定时任务。

## 说明

当前版本使用 Yahoo Finance chart 接口抓取行情，不需要 API key。它适合作为个人持仓监控 MVP；如果需要更稳定的生产级行情、新闻、公告或财报数据，可以后续接入 Finnhub、Polygon、Tushare、AkShare 或券商数据源。

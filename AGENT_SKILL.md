---
name: hermes-portfolio-sentinel
description: Deploy Hermes Portfolio Sentinel end to end in either local/Feishu mode or optional GitHub Pages mode.
---

# Hermes Portfolio Sentinel Deploy

This skill deploys Hermes Portfolio Sentinel as a personal stock holdings monitor.

Use it when the user wants to:

- install the project from GitHub
- set up daily portfolio monitoring
- create or repair the Hermes cron job
- choose between local-only usage and GitHub Pages publishing

## Deployment Modes

Use Local / Feishu mode by default.

Use GitHub Pages mode only when the user explicitly asks for publishing.

### Local / Feishu Mode

- local files and Excel records
- daily Feishu/Lark push
- optional local browser viewing
- generated cron prompt comes from `cronjob_prompt.txt`

### GitHub Pages Mode

- includes everything in local mode
- publishes `viewer/portfolio_data.json` and the static viewer to the user's fork
- generated cron prompt comes from `cronjob_prompt.pages.txt`
- the repository remote must point to the user's own writable fork

## Required Workflow

1. Verify Python 3 and pip are available.
2. Clone or locate the repository.
3. Create a project-local virtual environment and install dependencies:

```bash
python3 -m venv .venv
.venv/bin/python -m pip install openpyxl requests
```

4. Ask the user to edit `holdings.csv` with their real holdings:

```csv
symbol,name,market,shares,cost_price,sector,alert_below,alert_above,notes
AAPL,Apple,US,10,180,Technology,160,220,example
```

5. Generate the cron prompt:

```bash
bash prepare_deploy.sh
```

For GitHub Pages mode:

```bash
DEPLOY_MODE=pages bash prepare_deploy.sh
```

6. Use the full current contents of `cronjob_prompt.generated.txt` as the Hermes `/cron add` prompt payload.

Do not rewrite the cron prompt from memory. Do not run `/cron add` in a shell.

## Runtime Files

- `holdings.csv`: user-maintained holdings input
- `holdings_record.xlsx`: daily snapshot record
- `portfolio_snapshot.json`: latest full snapshot
- `viewer/portfolio_data.json`: static viewer data
- `feishu_msg.md`: latest Feishu-ready report

## Notes

- Current quote fetching uses Yahoo Finance chart data through `requests`.
- The first version has rule-based risk hints. News, announcements, and LLM interpretation can be added later.
- In GitHub Pages mode, publish only viewer files and never publish private Excel files.

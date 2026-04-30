# AGENTS

## Project Purpose

`hermes-portfolio-sentinel` is a Hermes-based personal stock holdings monitor.

It is designed to:

- read holdings from `holdings.csv`
- fetch latest quotes for each symbol
- calculate market value, daily P/L, total P/L, position weights, and risk hints
- append daily snapshots to `holdings_record.xlsx`
- generate a Feishu-ready daily portfolio report in `feishu_msg.md`
- build `viewer/portfolio_data.json` for the static dashboard
- provide a local or GitHub Pages portfolio viewer

## Core Data Flow

Main runtime entry:

- [monitor.py](monitor.py)

Persistent/local data:

- `holdings.csv`: user-maintained source of truth for positions
- `holdings_record.xlsx`: daily snapshot history
- `portfolio_snapshot.json`: latest full portfolio snapshot
- `viewer/portfolio_data.json`: static website data
- `feishu_msg.md`: latest Feishu Markdown report

Daily flow:

1. `.venv/bin/python monitor.py`
2. load positions from `holdings.csv`
3. fetch quotes through the Yahoo Finance chart endpoint
4. calculate portfolio and position metrics
5. write a new snapshot to `holdings_record.xlsx`
6. rebuild `viewer/portfolio_data.json`
7. write `feishu_msg.md`
8. optional: `bash scripts/publish_viewer.sh` pushes viewer changes and triggers GitHub Pages

Important:

- This project is a monitoring and reporting tool, not an automated trading system.
- Generated risk hints are rule-based monitoring aids, not investment advice.
- `holdings.csv` may contain sensitive financial information. Do not publish it unless the user explicitly wants that.
- `holdings_record.xlsx` and `portfolio_snapshot.json` are local generated data and are ignored by git.

## Deployment Modes

This repo supports two deployment modes.

### 1. Local Mode

Use this when the user wants:

- daily Feishu delivery
- local Excel snapshot storage
- local web viewer via `python3 viewer/run_viewer.py`

Characteristics:

- does not require a fork
- does not push to GitHub Pages
- generated cron prompt comes from `cronjob_prompt.txt`

### 2. GitHub Pages Mode

This is an enhanced version of local mode.

It includes everything in local mode, plus:

- automatic static-site publishing to the user's own GitHub fork
- GitHub Actions deployment for Pages

Characteristics:

- requires the user to fork the repository first
- `origin` should point to the user's own fork
- SSH is preferred for Git pushes
- generated cron prompt comes from `cronjob_prompt.pages.txt`
- cron includes `bash scripts/publish_viewer.sh`

## Deployment Files

Key deployment and ops files:

- [README.md](README.md): user-facing install and usage guide
- [AGENT_SKILL.md](AGENT_SKILL.md): Hermes deployment skill
- [UPDATE_CRON_SKILL.md](UPDATE_CRON_SKILL.md): Hermes skill for refreshing cron only
- [prepare_deploy.sh](prepare_deploy.sh): generates `cronjob_prompt.generated.txt`
- [cronjob_prompt.txt](cronjob_prompt.txt): local mode cron template
- [cronjob_prompt.pages.txt](cronjob_prompt.pages.txt): GitHub Pages mode cron template

Mode persistence:

- `.deploy_mode` stores `local` or `pages`
- `prepare_deploy.sh` reads it unless `DEPLOY_MODE` is explicitly provided

## Viewer

Viewer files:

- [viewer/index.html](viewer/index.html)
- [viewer/app.js](viewer/app.js)
- [viewer/styles.css](viewer/styles.css)
- [viewer/build_data.py](viewer/build_data.py)

Viewer behavior:

- reads `viewer/portfolio_data.json`
- shows portfolio totals, P/L, weights, and risk hints
- supports filtering by market, risk level, keyword, and watchlist state
- watchlist is stored in browser `localStorage`
- GitHub Pages mode does not publish private Excel or CSV files

## Publish Safety Rules

GitHub Pages publishing should only expose static viewer files.

- `scripts/publish_viewer.sh` stages `viewer/portfolio_data.json`, `viewer/index.html`, `viewer/app.js`, and `viewer/styles.css`
- it does not stage `holdings.csv`, `holdings_record.xlsx`, or `portfolio_snapshot.json`
- it retries `git push` with backoff
- it pushes to the current configured remote; it should never be hardcoded to an upstream repo

If a user is in GitHub Pages mode, publishing must target their own fork.

## Common Commands

Create local virtual environment:

```bash
python3 -m venv .venv
.venv/bin/python -m pip install openpyxl requests
```

Run monitor:

```bash
.venv/bin/python monitor.py
```

Local viewer:

```bash
cd viewer
../.venv/bin/python run_viewer.py
```

Rebuild viewer data:

```bash
.venv/bin/python viewer/build_data.py
```

Regenerate deploy prompt:

```bash
bash prepare_deploy.sh
```

Regenerate deploy prompt for Pages mode:

```bash
DEPLOY_MODE=pages bash prepare_deploy.sh
```

Manual Pages publish:

```bash
bash scripts/publish_viewer.sh
```

## What To Check First In A New Session

When starting a new work session on this repo, check these first:

1. `git status --short`
2. current deployment mode from `.deploy_mode` if it exists
3. whether the task is about local mode or GitHub Pages mode
4. whether `holdings.csv` contains real user holdings or sample data
5. whether the user wants code changes, cron updates, data refresh, or publishing

Useful questions to answer early:

- Is this a deployment problem, a data-processing problem, or a viewer/UI problem?
- Is the user working in local mode or GitHub Pages mode?
- If publishing is involved, does `origin` point to the user's own fork?

## Current Conventions

- prefer `rg` for search
- use `apply_patch` for file edits
- avoid touching unrelated untracked user files
- do not revert user changes unless explicitly asked
- preserve the distinction between local mode and Pages mode

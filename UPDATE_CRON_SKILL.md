---
name: hermes-portfolio-sentinel-update-cron
description: Refresh the Hermes Portfolio Sentinel cron prompt for an existing local checkout without reinstalling or recloning.
---

# Hermes Portfolio Sentinel Update Cron

Use this skill only for updating the existing cron configuration. Do not reclone the repository or reinstall dependencies unless the user explicitly asks.

## Workflow

1. Locate the existing local checkout and capture its absolute path as `PROJECT_DIR`.
2. Determine deployment mode:
   - explicit GitHub Pages request -> `pages`
   - existing `.deploy_mode` -> use that value
   - otherwise -> `local`
3. Regenerate the prompt:

```bash
bash prepare_deploy.sh
```

For GitHub Pages mode:

```bash
DEPLOY_MODE=pages bash prepare_deploy.sh
```

4. Validate `cronjob_prompt.generated.txt`:
   - contains the real absolute project path
   - does not contain `/path/to/hermes-portfolio-sentinel`
   - local mode does not include `bash scripts/publish_viewer.sh`
   - Pages mode includes `bash scripts/publish_viewer.sh`

5. Update or recreate the Hermes cron job using the full generated prompt.

## Expected Daily Output

The cron should run `.venv/bin/python monitor.py`, which updates:

- `holdings_record.xlsx`
- `viewer/portfolio_data.json`
- `portfolio_snapshot.json`
- `feishu_msg.md`

In Pages mode, it should then run `bash scripts/publish_viewer.sh`.

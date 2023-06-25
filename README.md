# GitHub Action - PR Reminder

This GitHub Action retrieves the remaining open pull requests (PRs) in a specified repository and sends a notification to a Telegram group.

## Usage

To use this GitHub Action, follow these steps:

1. Create a new workflow file (e.g., `.github/workflows/pr-reminder.yml`) in your repository.
2. Add the following content to the workflow file:

```yaml
name: PR Reminder

on:
  schedule:
    - cron: "0 0 * * *"

concurrency:
  group: ${{ github.workflow }}-${{ github.event.pull_request.number || github.ref }}
  cancel-in-progress: true

jobs:
  pr-reminder:
    runs-on: ubuntu-latest
    steps:
      - name: Checkout repository
        uses: actions/checkout@v2

      - name: PR Reminder
        uses: TheTechNexus/pull_request_reminder@v0.0.2
        with:
          owner: ${{ secrets.GITHUB_OWNER }}
          repo: ${{ secrets.GITHUB_REPOSITORY }}
          github_api_key: ${{ secrets.GITHUB_API_KEY }}
          telegram_bot_token: ${{ secrets.TELEGRAM_BOT_TOKEN }}
          telegram_chat_id: ${{ secrets.TELEGRAM_CHAT_ID }}

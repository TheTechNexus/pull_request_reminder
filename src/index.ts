import * as core from "@actions/core";
import { Octokit } from "@octokit/rest";
import axios from "axios";
import * as fs from "fs";

const GITHUB_API_BASE_URL = "https://api.github.com";

interface IPullRequest {
  author: string;
  url: string;
}

interface PullRequestData {
  [key: string]: IPullRequest[];
}

async function run() {
  try {
    const owner = core.getInput("owner", { required: true });

    const repo = core.getInput("repo", { required: true });

    const github_api_key = core.getInput("github_api_key", { required: true });

    const telegram_bot_token = core.getInput("telegram_bot_token", {
      required: true,
    });

    const telegram_chat_id = core.getInput("telegram_chat_id", {
      required: true,
    });

    const octokit = new Octokit({
      auth: github_api_key,
      baseUrl: GITHUB_API_BASE_URL,
    });

    const { data: pull_requests } = await octokit.rest.pulls.list({
      owner,
      repo,
    });

    fs.writeFileSync("pull_requests.json", JSON.stringify(pull_requests));

    const pull_request_obj: PullRequestData = {};

    for (const pull_request of pull_requests) {
      if (pull_request?.user?.login.toLowerCase().includes("dependabot")) {
        continue;
      }

      if (pull_request?.title.toLowerCase().includes("wip")) {
        continue;
      }

      const author = pull_request?.user?.login ?? "Ghost";

      let reviewers =
        pull_request?.requested_reviewers?.map((reviewer) => reviewer?.login) ??
        [];

      for (const reviewer of reviewers) {
        if (pull_request_obj[reviewer]) {
          pull_request_obj[reviewer].push({
            author,
            url: pull_request.html_url,
          });
        } else {
          pull_request_obj[reviewer] = [
            {
              author,
              url: pull_request.html_url,
            },
          ];
        }
      }
    }
    fs.writeFileSync("pull_request_obj.json", JSON.stringify(pull_request_obj));

    const sendMessage = [];

    sendMessage.push(`⏰⏰ <b>Pull Request Daily Alert</b> ⏰⏰`);
    sendMessage.push(`${"fa_nestjs_dms_server"}`);

    for (const reviewer in pull_request_obj) {
      sendMessage.push(`\n\n👀 Reviewer: <b>${reviewer}</b>`);

      for (const pull_request of pull_request_obj[reviewer]) {
        sendMessage.push(
          `\n🔗 ${pull_request.url}\n👨‍💻 Author: <i>${pull_request.author}</i>`
        );
      }
    }

    // post to telegram
    const telegram_url = `https://api.telegram.org/bot${telegram_bot_token}/sendMessage`;

    axios.post(telegram_url, {
      text: sendMessage.join("\n"),
      parse_mode: "HTML",
      chat_id: telegram_chat_id,
    });
  } catch (error: any) {
    core.setFailed(error.message);
  }
}

run();

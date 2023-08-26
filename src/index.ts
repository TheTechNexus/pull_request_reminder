import * as core from "@actions/core";
import { Octokit } from "@octokit/rest";
import axios from "axios";
import * as fs from "fs";
import { GITHUB_API_BASE_URL } from "./constants";
import { PullRequestData } from "./types";

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

    // fs.writeFileSync("pull_requests.json", JSON.stringify(pull_requests));

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
        pull_request?.requested_reviewers?.map(
          (reviewer: any) => reviewer?.login
        ) ?? [];

      for (const reviewer of reviewers) {
        if (pull_request_obj[reviewer]) {
          pull_request_obj[reviewer].push({
            author,
            url: pull_request.html_url,
            number: pull_request.number,
            duration: Math.ceil(
              (new Date().getTime() -
                new Date(pull_request.updated_at).getTime()) /
                (1000 * 3600 * 24) // in days
            ),
          });
        } else {
          pull_request_obj[reviewer] = [
            {
              author,
              url: pull_request.html_url,
              number: pull_request.number,
              duration: Math.ceil(
                (new Date().getTime() -
                  new Date(pull_request.updated_at).getTime()) /
                  (1000 * 3600 * 24) // in days
              ),
            },
          ];
        }
      }
    }

    // fs.writeFileSync("pull_request_obj.json", JSON.stringify(pull_request_obj));

    const sendMessage = [];

    sendMessage.push(`⏰⏰ <b>Pull Request Daily Alert</b> ⏰⏰`);
    sendMessage.push(repo);

    for (const reviewer in pull_request_obj) {
      sendMessage.push(`\n\n👀 Reviewer: <b>${reviewer}</b>`);

      for (const pull_request of pull_request_obj[reviewer]) {
        // Add url with hyerlink
        sendMessage.push(
          `\n🔗 <a href="${pull_request.url}">PR#${pull_request.number}</a> (👨‍💻 <i>${pull_request.author}</i>) (⏱️ <i>${pull_request.duration} days</i>)`
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

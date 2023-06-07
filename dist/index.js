"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const core = __importStar(require("@actions/core"));
const rest_1 = require("@octokit/rest");
const axios_1 = __importDefault(require("axios"));
const fs = __importStar(require("fs"));
const GITHUB_API_BASE_URL = "https://api.github.com";
function run() {
    var _a, _b, _c, _d, _e;
    return __awaiter(this, void 0, void 0, function* () {
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
            const octokit = new rest_1.Octokit({
                auth: github_api_key,
                baseUrl: GITHUB_API_BASE_URL,
            });
            const { data: pull_requests } = yield octokit.rest.pulls.list({
                owner,
                repo,
            });
            fs.writeFileSync("pull_requests.json", JSON.stringify(pull_requests));
            const pull_request_obj = {};
            for (const pull_request of pull_requests) {
                if ((_a = pull_request === null || pull_request === void 0 ? void 0 : pull_request.user) === null || _a === void 0 ? void 0 : _a.login.toLowerCase().includes("dependabot")) {
                    continue;
                }
                if (pull_request === null || pull_request === void 0 ? void 0 : pull_request.title.toLowerCase().includes("wip")) {
                    continue;
                }
                const author = (_c = (_b = pull_request === null || pull_request === void 0 ? void 0 : pull_request.user) === null || _b === void 0 ? void 0 : _b.login) !== null && _c !== void 0 ? _c : "Ghost";
                let reviewers = (_e = (_d = pull_request === null || pull_request === void 0 ? void 0 : pull_request.requested_reviewers) === null || _d === void 0 ? void 0 : _d.map((reviewer) => reviewer === null || reviewer === void 0 ? void 0 : reviewer.login)) !== null && _e !== void 0 ? _e : [];
                for (const reviewer of reviewers) {
                    if (pull_request_obj[reviewer]) {
                        pull_request_obj[reviewer].push({
                            author,
                            url: pull_request.html_url,
                        });
                    }
                    else {
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
                    sendMessage.push(`\n🔗 ${pull_request.url}\n👨‍💻 Author: <i>${pull_request.author}</i>`);
                }
            }
            // post to telegram
            const telegram_url = `https://api.telegram.org/bot${telegram_bot_token}/sendMessage`;
            axios_1.default.post(telegram_url, {
                text: sendMessage.join("\n"),
                parse_mode: "HTML",
                chat_id: telegram_chat_id,
            });
        }
        catch (error) {
            core.setFailed(error.message);
        }
    });
}
run();

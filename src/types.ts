export interface IPullRequest {
  author: string;
  url: string;
  number: number; // PR number
  duration: number; // PR duration in days (since updated_at)
}

export interface PullRequestData {
  [key: string]: IPullRequest[];
}

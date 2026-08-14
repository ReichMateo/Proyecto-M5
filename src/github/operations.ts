import { octokit } from "./client.js";
import type {
    CreateRepositoryInput,
    CreateIssueInput,
    ListRepositoriesInput,
    CreateCommitInput,
    ListIssuesInput,
} from "../schemas/index.js";
import type {
    RepositoryResult,
    IssueResult,
    CommitResult,
} from "../utils/types.js";

export async function createRepository(
    input: CreateRepositoryInput
): Promise<RepositoryResult> {
    const response = await octokit.rest.repos.createForAuthenticatedUser({
        name: input.name,
        description: input.description,
        private: input.isprivate,
    });

    return {
        name: response.data.name,
        url: response.data.html_url,
        isPrivate: response.data.private,
        owner: response.data.owner.login,
    };
}

export async function createIssue(
    input: CreateIssueInput
): Promise<IssueResult> {
    const response = await octokit.rest.issues.create({
        owner: input.owner,
        repo: input.repo,
        title: input.title,
        body: input.body,

    });
    return {
        number: response.data.number,
        title: response.data.title,
        url: response.data.html_url,
        state: response.data.state,
    };
}

export async function listRepositories(
    input: ListRepositoriesInput
): Promise<RepositoryResult[]> {
    const response = await octokit.rest.repos.listForAuthenticatedUser({
        per_page: input.limit,
    });

    return response.data.map((repo) => ({
        name: repo.name,
        url: repo.html_url,
        isPrivate: repo.private,
        owner: repo.owner?.login ?? "",
    }));
}

export async function listIssues(
    input: ListIssuesInput
): Promise<IssueResult[]> {
    const response = await octokit.rest.issues.listForRepo({
        owner: input.owner,
        repo: input.repo,
        state: input.state,
    });

    return response.data.map((issue) => ({
        number: issue.number,
        title: issue.title,
        url: issue.html_url,
        state: issue.state,
    }));
}

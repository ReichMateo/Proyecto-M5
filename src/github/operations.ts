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
        private: input.isPrivate,
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
export async function createCommit(
    input: CreateCommitInput
): Promise<CommitResult> {
    let sha: string | undefined;

    try {
        const existing = await octokit.rest.repos.getContent({
            owner: input.owner,
            repo: input.repo,
            path: input.path,
            ref: input.branch,
        });

        if (!Array.isArray(existing.data) && existing.data.type === "file") {
            sha = existing.data.sha;
        }
    } catch (error: any) {
        if (error.status !== 404) {
            throw error; // si es otro error (no "no encontrado"), lo dejamos propagar
        }
        // 404 = el archivo no existe todavía, está bien, seguimos sin sha
    }

    const response = await octokit.rest.repos.createOrUpdateFileContents({
        owner: input.owner,
        repo: input.repo,
        path: input.path,
        message: input.message,
        content: Buffer.from(input.content).toString("base64"),
        branch: input.branch,
        sha,
    });

    return {
        sha: response.data.commit.sha ?? "",
        message: input.message,
        url: response.data.commit.html_url ?? "",
    };
}
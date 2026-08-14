import { Octokit } from "@octokit/rest";

const token = process.env.GITHUB_TOKEN;

if (!token) {
    throw new Error(
        "GITHUB_TOKEN no está configurado. Verificá tu archivo .env"
    );
}

export const octokit = new Octokit({
    auth: token,
});
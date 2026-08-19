import { $ZodBooleanInternals } from "zod/v4/core";

export interface RepositoryResult {
    name: string;
    url: string;
    isPrivate: boolean;
    owner: string
}

export interface IssueResult {
    number: number;
    title: string;
    url: string;
    state: string;
}

export interface CommitResult {
    sha: string;
    message: string;
    url: string;
}

export interface ToolResponse {
    success: boolean;
    message: string;
    data?: unknown;
}
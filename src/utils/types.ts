import { $ZodBooleanInternals } from "zod/v4/core";

// Resultado limpio despues de crear un repositorio
export interface RepositoryResult {
    name: string;
    url: string;
    isPrivate: boolean;
    owner: string
}

// Resultado limpio despues de crear/listar un issue
export interface IssueeResult {
    number: number;
    title: string;
    url: string;
    state: string;
}

// Resultado limpio despues de crear un commit
export interface CommitResult {
    sha: string;
    message: string;
    url: string;
}

// Forma estandar que va a devolver CADA tool al LLM
export interface ToolResponse {
    succes: boolean;
    message: string;
    data?: unknown;
}
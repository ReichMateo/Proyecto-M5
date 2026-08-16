import { describe, it, expect, vi, beforeEach } from "vitest";

// Mockeamos el módulo completo de client.ts ANTES de importar operations.ts
vi.mock("../src/github/client.js", () => ({
    octokit: {
        rest: {
            repos: {
                createForAuthenticatedUser: vi.fn(),
            },
            issues: {
                create: vi.fn(),
            },
        },
    },
}));

// Ahora sí importamos operations.ts — ya va a usar el octokit falso
import { createRepository, createIssue } from "../src/github/operations.js";
import { octokit } from "../src/github/client.js";

describe("createRepository", () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it("devuelve el repositorio formateado cuando Octokit responde bien", async () => {
        (octokit.rest.repos.createForAuthenticatedUser as any).mockResolvedValue({
            data: {
                name: "repo-de-prueba",
                html_url: "https://github.com/usuario/repo-de-prueba",
                private: true,
                owner: { login: "usuario" },
            },
        });

        const result = await createRepository({ name: "repo-de-prueba", isPrivate: true });

        expect(result).toEqual({
            name: "repo-de-prueba",
            url: "https://github.com/usuario/repo-de-prueba",
            isPrivate: true,
            owner: "usuario",
        });
    });

    it("propaga el error cuando Octokit falla", async () => {
        (octokit.rest.repos.createForAuthenticatedUser as any).mockRejectedValue({
            status: 422,
            message: "name already exists on this account",
        });

        await expect(
            createRepository({ name: "repo-repetido", isPrivate: false })
        ).rejects.toBeTruthy();
    });
});

describe("createIssue", () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it("devuelve el issue formateado cuando Octokit responde bien", async () => {
        (octokit.rest.issues.create as any).mockResolvedValue({
            data: {
                number: 1,
                title: "Issue de prueba",
                html_url: "https://github.com/usuario/repo/issues/1",
                state: "open",
            },
        });

        const result = await createIssue({
            owner: "usuario",
            repo: "repo",
            title: "Issue de prueba",
        });

        expect(result.number).toBe(1);
        expect(result.state).toBe("open");
    });
});
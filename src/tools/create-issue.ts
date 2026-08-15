import { ZodError } from "zod";
import { createIssueSchema } from "../schemas/index.js";
import { createIssue } from "../github/operations.js";
import { withRetry } from "../utils/retry.js";
import { toUserMessage, ValidationError } from "../errors/index.js";
import { logger } from "../utils/logging.js";
import type { ToolResponse } from "../utils/types.js";

export const createIssueTool = {
    name: "create_issue",
    description:
        "Crea un nuevo issue en un repositorio de GitHub existente. " +
        "Usar cuando el usuario pida reportar un bug, crear una tarea o abrir un issue. " +
        "Requiere el owner (usuario u organización) y el nombre del repositorio.",
    inputSchema: createIssueSchema,

    async handler(rawInput: unknown): Promise<ToolResponse> {
        try {
            let input;
            try {
                input = createIssueSchema.parse(rawInput);
            } catch (zodError) {
                if (zodError instanceof ZodError) {
                    throw new ValidationError(zodError.issues[0].message);
                }
                throw zodError;
            }

            const issue = await withRetry(() => createIssue(input));

            logger.info("Issue creado", { number: issue.number, repo: input.repo });

            return {
                success: true,
                message: `Issue #${issue.number} '${issue.title}' creado en ${issue.url}`,
                data: issue,
            };
        } catch (error) {
            logger.error("Error al crear issue", { error });
            return { success: false, message: toUserMessage(error) };
        }
    },
};
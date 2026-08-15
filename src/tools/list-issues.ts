import { ZodError } from "zod";
import { listIssuesSchema } from "../schemas/index.js";
import { listIssues } from "../github/operations.js";
import { withRetry } from "../utils/retry.js";
import { toUserMessage, ValidationError } from "../errors/index.js";
import { logger } from "../utils/logging.js";
import type { ToolResponse } from "../utils/types.js";

export const listIssuesTool = {
    name: "list_issues",
    description:
        "Lista los issues de un repositorio de GitHub, filtrando por estado (abiertos, cerrados o todos). " +
        "Usar cuando el usuario pregunte qué issues/tareas/bugs hay pendientes en un repositorio.",
    inputSchema: listIssuesSchema,

    async handler(rawInput: unknown): Promise<ToolResponse> {
        try {
            let input;
            try {
                input = listIssuesSchema.parse(rawInput);
            } catch (zodError) {
                if (zodError instanceof ZodError) {
                    throw new ValidationError(zodError.issues[0].message);
                }
                throw zodError;
            }

            const issues = await withRetry(() => listIssues(input));

            logger.info("Issues listados", { count: issues.length, repo: input.repo });

            return {
                success: true,
                message: `Se encontraron ${issues.length} issue(s) con estado '${input.state}'.`,
                data: issues,
            };
        } catch (error) {
            logger.error("Error al listar issues", { error });
            return { success: false, message: toUserMessage(error) };
        }
    },
};
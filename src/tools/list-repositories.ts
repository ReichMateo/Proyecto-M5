import { ZodError } from "zod";
import { listRepositoriesSchema } from "../schemas/index.js";
import { listRepositories } from "../github/operations.js";
import { withRetry } from "../utils/retry.js";
import { toUserMessage, ValidationError } from "../errors/index.js";
import { logger } from "../utils/logging.js";
import type { ToolResponse } from "../utils/types.js";

export const listRepositoriesTool = {
    name: "list_repositories",
    description:
        "Lista los repositorios del usuario autenticado en GitHub. " +
        "Usar cuando el usuario pregunte qué repositorios tiene, o pida ver sus proyectos.",
    inputSchema: listRepositoriesSchema,

    async handler(rawInput: unknown): Promise<ToolResponse> {
        try {
            let input;
            try {
                input = listRepositoriesSchema.parse(rawInput);
            } catch (zodError) {
                if (zodError instanceof ZodError) {
                    throw new ValidationError(zodError.issues[0].message);
                }
                throw zodError;
            }

            const repos = await withRetry(() => listRepositories(input));

            logger.info("Repositorios listados", { count: repos.length });

            return {
                success: true,
                message: `Se encontraron ${repos.length} repositorio(s).`,
                data: repos,
            };
        } catch (error) {
            logger.error("Error al listar repositorios", { error });
            return { success: false, message: toUserMessage(error) };
        }
    },
};
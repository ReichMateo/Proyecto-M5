import { ZodError } from "zod";
import { createRepositorySchema } from "../schemas/index.js";
import { createRepository } from "../github/operations.js";
import { withRetry } from "../utils/retry.js";
import { toUserMessage, ValidationError } from "../errors/index.js";
import { logger } from "../utils/logging.js";
import type { ToolResponse } from "../utils/types.js";

export const createRepositoryTool = {
    name: "create_repository",
    description:
        "Crea un nuevo repositorio de GitHub en la cuenta autenticada. " +
        "Usar cuando el usuario pida crear, generar o iniciar un repositorio nuevo. " +
        "Requiere un nombre válido (3-100 caracteres, solo letras, números y guiones).",
    inputSchema: createRepositorySchema,

    async handler(rawInput: unknown): Promise<ToolResponse> {
        try {
            let input;
            try {
                input = createRepositorySchema.parse(rawInput);
            } catch (zodError) {
                if (zodError instanceof ZodError) {
                    const firstIssue = zodError.issues[0];
                    throw new ValidationError(firstIssue.message);
                }
                throw zodError;
            }

            const repo = await withRetry(() => createRepository(input));

            logger.info("Repositorio creado", { name: repo.name });

            return {
                success: true,
                message: `Repositorio '${repo.name}' creado correctamente en ${repo.url}`,
                data: repo,
            };
        } catch (error) {
            logger.error("Error al crear repositorio", { error });

            return {
                success: false,
                message: toUserMessage(error),
            };
        }
    },
};
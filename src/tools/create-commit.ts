import { ZodError } from "zod";
import { createCommitSchema } from "../schemas/index.js";
import { createCommit } from "../github/operations.js";
import { withRetry } from "../utils/retry.js";
import { toUserMessage, ValidationError } from "../errors/index.js";
import { logger } from "../utils/logging.js";
import type { ToolResponse } from "../utils/types.js";

export const createCommitTool = {
    name: "create_commit",
    description:
        "Crea o actualiza un archivo en un repositorio de GitHub mediante un commit. " +
        "Usar cuando el usuario pida agregar, modificar o subir contenido de un archivo. " +
        "Si el archivo ya existe en la ruta indicada, se actualiza; si no, se crea.",
    inputSchema: createCommitSchema,

    async handler(rawInput: unknown): Promise<ToolResponse> {
        try {
            let input;
            try {
                input = createCommitSchema.parse(rawInput);
            } catch (zodError) {
                if (zodError instanceof ZodError) {
                    throw new ValidationError(zodError.issues[0].message);
                }
                throw zodError;
            }

            const commit = await withRetry(() => createCommit(input));

            logger.info("Commit creado", { sha: commit.sha, path: input.path });

            return {
                success: true,
                message: `Commit realizado correctamente: "${commit.message}" (${commit.sha.slice(0, 7)})`,
                data: commit,
            };
        } catch (error) {
            logger.error("Error al crear commit", { error });
            return { success: false, message: toUserMessage(error) };
        }
    },
};
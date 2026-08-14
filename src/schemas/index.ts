import { z } from "zod";

export const createRepositorySchema = z.object({
    name: z
        .string()
        .min(3, "El nombre del repositorio debe tener al menos 3 caracteres")
        .max(100, "El nombre del repositorio no puede superar los 100 caracteres")
        .regex(
            /^[a-zA-Z0-9-]+$/,
            "El nombre solo puede contener letras, numeros y guiones"
        )
        .describe("Nombre del repositorio a crear a GitHub"),
    description: z
        .string()
        .optional()
        .describe("Descripcion breve del proposito del repositorio"),
    isPrivate: z
        .boolean()
        .optional()
        .default(false)
        .describe("Si el repositorio debe ser privado. Por defecto es publico")
});

export type CreateRepositoryInput = z.infer<typeof createRepositorySchema>;

const ownerRepoSchema = {
    owner: z
        .string()
        .min(1, "El owner (usuario o organizacion) es requerido")
        .describe("Usuario u organizacion dueño del repositorio"),
    repo: z
        .string()
        .min(1, "El nombre del repositorio es requerido")
        .describe("Nombre del repositorio"),
};
export const createIssueSchema = z.object({
    ...ownerRepoSchema,
    title: z
        .string()
        .min(1, "El titulo del issue no puede estar vacio")
        .describe("Titulo del issue a crear"),
    body: z
        .string()
        .optional()
        .describe("Descripcion detallada del issue (opcional)"),
});

export type CreateIssueInput = z.infer<typeof createIssueSchema>;

export const listRepositoriesSchema = z.object({
    limit: z
        .number()
        .int()
        .min(1)
        .max(100)
        .optional()
        .default(30)
        .describe("Cantidad maxima de repositorios a listar"),
})

export const createCommitSchema = z.object({
    ...ownerRepoSchema,
    path: z
        .string()
        .min(1, "La ruta del archivo es requerida")
        .describe("Ruta del archivo dentro del repositorio, ej: 'src/index.ts'"),
    content: z
        .string()
        .min(1, "El contenido del archivo no puede estar vacío")
        .describe("Contenido completo del archivo a crear o modificar"),
    message: z
        .string()
        .min(1, "El mensaje de commit es requerido")
        .describe("Mensaje descriptivo del commit"),
    branch: z
        .string()
        .optional()
        .describe("Branch donde hacer el commit. Por defecto la rama principal"),
});

export type CreateCommitInput = z.infer<typeof createCommitSchema>;

export const listIssuesSchema = z.object({
    ...ownerRepoSchema,
    state: z
        .enum(["open", "closed", "all"])
        .optional()
        .default("open")
        .describe("Estado de los issues a listar"),
});

export type ListIssuesInput = z.infer<typeof listIssuesSchema>;

export type ListRepositoriesInput = z.infer<typeof listRepositoriesSchema>;
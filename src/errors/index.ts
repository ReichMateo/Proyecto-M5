// Error base del que heredan los demas
export class AppError extends Error {
    constructor(message: string) {
        super(message);
        this.name = this.constructor.name;
    }
}

//cuando un input no pasa la validacion de zod
export class ValidationError extends AppError {
    constructor(message: string) {
        super(message)
    }
}

//cuando github responde con un error (404, 422, etc...)
export class GitHubAPIError extends AppError {
    statusCode: number;

    constructor(message: string, statusCode: number) {
        super(message);
        this.statusCode = statusCode;
    }
}

//cuando el token es invalido o no tiene permisos (401/403)
export class AuthenticationError extends AppError {
    constructor(message: string) {
        super(message);
    }
}

//cuando falla la conexion (sin internet, timeout, etc.)
export class NetworkError extends AppError {
    constructor(message: string) {
        super(message);
    }
}
export function toUserMessage(error: unknown): string {
    if (error instanceof ValidationError) {
        return `Los datos ingresados no son válidos: ${error.message}`;
    }

    if (error instanceof AuthenticationError) {
        return "No se pudo autenticar con GitHub. Verificá que el token sea válido y tenga los permisos necesarios.";
    }

    if (error instanceof GitHubAPIError) {
        if (error.statusCode === 404) {
            return "El recurso solicitado no fue encontrado. Verificá el nombre e intentá de nuevo.";
        }
        if (error.statusCode === 422) {
            return "GitHub rechazó la solicitud, probablemente porque el recurso ya existe o el dato es inválido.";
        }
        return `GitHub devolvió un error inesperado (código ${error.statusCode}).`;
    }

    if (error instanceof NetworkError) {
        return "Hubo un problema de conexión con GitHub. Intentá de nuevo en unos segundos.";
    }

    // Fallback para cualquier error no anticipado
    return "Ocurrió un error inesperado. Intentá de nuevo.";
}
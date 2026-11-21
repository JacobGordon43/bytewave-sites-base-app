type LogLevel = "log" | "warn" | "error" | "info" | "debug"

const isDev = import.meta.env.DEV

const log = (level: LogLevel, ...args: unknown[]) => {
    if(isDev || level === "error"){
        console[level](`[${level.toUpperCase()}]`, ...args);
    }
}

const logger = {
    log: (...args: unknown[]) => log("log", ...args),
    warn: (...args: unknown[]) => log("warn", ...args),
    error: (...args: unknown[]) => log('error', ...args),
    info: (...args: unknown[]) => log('info', ...args),
    debug: (...args: unknown[]) => log('debug', ...args),
}

export default logger;
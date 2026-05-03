import winston from 'winston';
import { config } from '../config';

const { combine, timestamp, colorize, printf, json } = winston.format;

// Human-readable format for development
const devFormat = combine(
    colorize(),
    timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
    printf(({ level, message, timestamp, ...metadata }) => {
        let msg = `${timestamp} [${level}]: ${message}`;
        if (Object.keys(metadata).length) {
            msg += ` ${JSON.stringify(metadata)}`;
        }
        return msg;
    })
);

// JSON format for production (log aggregation tools)
const prodFormat = combine(timestamp(), json());

export const logger = winston.createLogger({
    level: config.isDev ? 'debug' : 'info',
    format: config.isDev ? devFormat : prodFormat,
    transports: [
        new winston.transports.Console(),
        // In production, add file transports or cloud logger here
        ...(config.isDev
            ? []
            : [
                new winston.transports.File({ filename: 'logs/error.log', level: 'error' }),
                new winston.transports.File({ filename: 'logs/combined.log' }),
            ]),
    ],
});

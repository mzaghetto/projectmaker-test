import { createLogger, format, transports } from 'winston';

const { combine, timestamp, printf, colorize, align, splat } = format;

const logFormat = printf((info) => {
  const { level, message, timestamp, stack, ...meta } = info;
  const baseLog = `${'[' + timestamp + ']'} ${level}: ${stack || message}`;
  if (Object.keys(meta).length) {
    return `${baseLog} ${JSON.stringify(meta, null, 2)}`;
  }
  return baseLog;
});

export const logger = createLogger({
  level:
    process.env.NODE_ENV === 'production' || process.env.NODE_ENV === 'test'
      ? 'silent'
      : 'debug',
  format: combine(
    timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
    splat(),
    logFormat,
  ),
  transports:
    process.env.NODE_ENV !== 'production'
      ? [
          new transports.Console({
            format: combine(colorize(), align(), splat(), logFormat),
          }),
          new transports.File({ filename: 'logs/error.log', level: 'error' }),
          new transports.File({ filename: 'logs/app.log' }),
        ]
      : [], // No transports in production environment
  exceptionHandlers:
    process.env.NODE_ENV !== 'production'
      ? [new transports.File({ filename: 'logs/exceptions.log' })]
      : [],
  rejectionHandlers:
    process.env.NODE_ENV !== 'production'
      ? [new transports.File({ filename: 'logs/rejections.log' })]
      : [],
});

export default logger;

import { createLogger, transports, format, addColors } from 'winston';
const { combine, timestamp, printf, colorize } = format;

addColors({
  info: 'blue',
  warn: 'yellow',
  error: 'red',
  debug: 'green',
});

const globalLoggerFormat = printf(({ level, message, label, timestamp }) => {
  return `${timestamp} [${label}] ${level}: ${message}`;
});

const Logger = createLogger({
  format: combine(colorize({ all: true }), timestamp(), globalLoggerFormat),
  transports: [new transports.Console({})],
});

export const getLoggerWithLabel = (label) => Logger.child({ label });
export default Logger;

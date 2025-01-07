/**
 * Warning log.
 * @param message The message to display.
 * @param location Specify the location where this message originates. Can be omitted.
 */
export function logWarn(message: string, location: string = '') {
  console.warn(`[WARNING] ${message}; ${location === '' ? '' : 'Thrown at ' + location}`);
}

/**
 * Warning log.
 * @param message The message to display.
 * @param location Specify the location where this message originates. Can be omitted.
 */
export function logDebug(message: string, location: string = '') {
  console.debug(`[DEBUG] ${message}; ${location === '' ? '' : 'Thrown at ' + location}`);
}

/**
 * Warning log.
 * @param message The message to display.
 * @param location Specify the location where this message originates. Can be omitted.
 */
export function logError(message: string, location: string = '') {
  console.error(`[ERROR] ${message}; ${location === '' ? '' : 'Thrown at ' + location}`);
}

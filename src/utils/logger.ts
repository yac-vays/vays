/**
 * Error log.
 * @param message The message to display.
 * @param location Specify the location where this message originates. Can be omitted.
 */
export function logError(message: string, location: string = '') {
  console.error(`[ERROR] ${message}; ${location === '' ? '' : 'Thrown at ' + location}`);
}

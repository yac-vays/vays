/**
 * Type Utils. This includes a number of wrappers that can be applied to any type.
 */

/**
 * Allows to assign null to a variable of a given type.
 **/
export type Nullable<T> = T | null;


/**
 * Designates Data that is from a safe source - typically from 
 * the YAC configuration. This is strictly different from data
 * that is derived from user input (which may have been stored back
 * in the cloud to be fetched back later.)
 * 
 * BY DEFAULT, ALL EXTERNAL DATA IS UNSAFE.
 */
export type SafeSource<T> = T;

/**
 * Designates data that is derived from user input 
 * (which may have been stored back
 * in the cloud to be fetched back later.)
 * 
 * BY DEFAULT, ALL EXTERNAL DATA IS UNSAFE.
 */
export type UnsafeSource<T> = T;

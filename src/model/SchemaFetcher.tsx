/**
 * TODO: You can merge this file back into the BackendFetcher.
 */

/**
 * Retreives the schema. The current strategy is to call validate and provide yaml == ""
 * As such, the sent data typically is not valid, unless the entity does not have any
 * required fields.
 *
 * This strategy allows to avoid an additional API call that either retreives all data
 * or fetches the raw YAML file.
 *
 * TODO: Should make sure that this case is handled efficiently inside YAC.
 *
 * @param ename The entity name.
 * @param et The entity type name. (e.g. Host)
 */
async function getSchema(ename: string, et: string) {}

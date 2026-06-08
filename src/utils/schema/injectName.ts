/**
 * The historic property key under which a settable entity name used to be
 * injected into the form data. Name + actions now live in the always-visible
 * MetaInfoPanel (not in the form data), so nothing injects this anymore — but
 * `troubleshoot` still recognizes the key when inspecting older data.
 */
const INJECTED_NAME_PROPETRY = 'name753984327583297515507489734124497987457185454894315';

export function isInjectedNameKey(s: string) {
  return s === INJECTED_NAME_PROPETRY;
}

// CC-151 — this spec exercises the CRM, which is parked in this app. Declaring the dependency makes
// discovery skip it instead of running it against routes that are never generated.
export const integrationMeta = { dependsOnModules: ['customers'] }

// CC-153: the payment demo page lives in the example module, but the session
// API it drives belongs to `payment_gateways` — parked in this app's modules.ts
// (an ERP-commerce module the platform deliberately does not serve). With the
// module parked its routes are not generated, so every lifecycle assertion in
// TC-UMES-020 fails on 404s. Declaring the dependency is the sanctioned answer:
// discovery skips the spec while the module is parked and picks it back up the
// moment anyone un-parks it — the same shape checkout's specs use.
export const integrationMeta = { dependsOnModules: ['payment_gateways'] }

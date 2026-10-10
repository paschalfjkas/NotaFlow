// Stub for the "server-only" package under tests. The real package throws
// unconditionally unless the bundler sets the "react-server" export
// condition (only Next.js's RSC bundler does that) — see
// node_modules/server-only/index.js. Vitest aliases "server-only" to this
// file (vitest.config.ts) so server-only modules can be imported in tests.
export {};

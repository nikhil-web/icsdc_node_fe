const browserSync = require("browser-sync").create();
const { spawn } = require("child_process");

// Set here rather than as a `NODE_ENV=development` prefix in the npm script:
// that prefix is shell syntax cmd.exe does not understand, so on Windows
// `npm run dev` failed outright ("'NODE_ENV' is not recognized"). Setting it in
// JS works the same on every platform.
//
// It matters more than it looks: without NODE_ENV=development, server.js serves
// build/ICSDC_Frontend in preference to public/, so a stale build silently
// shadows every source edit you make while developing.
process.env.NODE_ENV = "development";

const server = spawn("node", ["server.js"], {
    stdio: "inherit",
    env: process.env,
});

browserSync.init({
    proxy: "http://localhost:3000",
    files: ["public/**/*.*"],
    port: 3001,
});

process.on("exit", () => server.kill());
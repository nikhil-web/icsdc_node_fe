const browserSync = require("browser-sync").create();
const { spawn } = require("child_process");

const server = spawn("node", ["server.js"], {
    stdio: "inherit",
});

browserSync.init({
    proxy: "http://localhost:3000",
    files: ["public/**/*.*"],
    port: 3001,
});

process.on("exit", () => server.kill());
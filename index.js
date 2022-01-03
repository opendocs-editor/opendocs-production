const axios = require("axios");
const { execSync, exec } = require("child_process");
const fs = require("fs");

console.log("Cleaning old installations...");
if(fs.existsSync("api")) {
    execSync(`rm -rf api`);
}
if(fs.existsSync("front")) {
    execSync(`rm -rf front`);
}
if(fs.existsSync("server")) {
    execSync(`rm -rf server`);
}

console.log("Installing new version...");
axios.default.get("https://git.nosadnile.net/api/v4/projects/14/pipelines", { headers: { "PRIVATE-TOKEN": "glpat-TvY89e7vuUAucse_49_k" } }).then(async (res) => {
    var resp = res.data;
    var pl = resp[0].id;
    const pld = await axios.default.get(`https://git.nosadnile.net/api/v4/projects/14/pipelines/${pl}`, { headers: { "PRIVATE-TOKEN": "glpat-TvY89e7vuUAucse_49_k" } });
    const plc = pld.data.sha;
    axios.default.get(`https://git.nosadnile.net/api/v4/projects/14/pipelines/${pl}/jobs?include_retried=yes&scope=success`, { headers: { "PRIVATE-TOKEN": "glpat-TvY89e7vuUAucse_49_k" } }).then(async (res) => {
        var resp = res.data;
        var bjobs = [];
        for(var i = 0; i < resp.length; i++) {
            var job = resp[i];
            if(job.stage == "build") {
                bjobs.push(job.id);
            }
        }
        for(var i = 0; i < bjobs.length; i++) {
            var jobid = bjobs[i];
            execSync(`wget -qO artifacts-${jobid}.zip https://git.nosadnile.net/api/v4/projects/14/jobs/${jobid}/artifacts`);
            execSync(`unzip -qq artifacts-${jobid}.zip`);
            execSync(`rm artifacts-${jobid}.zip`);
        }
        execSync(`unzip -qq api-build-${pl}.zip -d api`);
        execSync(`unzip -qq backend-build-${pl}.zip -d server`);
        execSync(`unzip -qq frontend-build-${pl}.zip -d front`);
        execSync(`mv server/dist/* server`);
        execSync(`mv api/dist/* api`);
        execSync(`mv front/out/* front`);
        execSync(`rm api-build-${pl}.zip`);
        execSync(`rm frontend-build-${pl}.zip`);
        execSync(`rm backend-build-${pl}.zip`);
        execSync(`rm -rf api/dist`);
        execSync(`rm -rf server/dist`);
        execSync(`rm -rf front/out`);
        console.log("Installing packages for the backend...");
        execSync(`wget -q https://git.nosadnile.net/opendocs/opendocs/-/raw/${plc}/server/package.json -O server/package.json`);
        execSync(`cd server && yarn`);
        console.log("Installing packages for the API...");
        execSync(`wget -q https://git.nosadnile.net/opendocs/opendocs/-/raw/${plc}/api/package.json -O api/package.json`);
        execSync(`cd api && yarn`);
        var isFrontendRunning = false;
        var isBackendRunning = false;
        var isAPIRunning = false;
        console.log("Starting OpenDocs...");
        exec(`node_modules/.bin/serve -s front -p 4501`, (err, stdout, stderr) => {
            if(err) return console.error(err);
            if(stderr) console.error(stderr);
            console.log(stdout);
        }).on("message", (m, sh) => {
            console.log(m);
        }).on("error", (err) => {
            console.error(err);
        }).on("spawn", () => {
            console.log(`Started frontend.`);
            isFrontendRunning = true;
            if(isFrontendRunning && isBackendRunning && isAPIRunning) {
                console.log("OpenDocs is running on port 4500.");
            }
        });
        exec(`node server/index.js`, (err, stdout, stderr) => {
            if(err) return console.error(err);
            if(stderr) console.error(stderr);
            console.log(stdout);
        }).on("message", (m, sh) => {
            console.log(m);
        }).on("error", (err) => {
            console.error(err);
        }).on("spawn", () => {
            console.log(`Started backend.`);
            isBackendRunning = true;
            if(isFrontendRunning && isBackendRunning && isAPIRunning) {
                console.log("OpenDocs is running on port 4500.");
            }
        });
        exec(`node api/index.js`, (err, stdout, stderr) => {
            if(err) return console.error(err);
            if(stderr) console.error(stderr);
            console.log(stdout);
        }).on("message", (m, sh) => {
            console.log(m);
        }).on("error", (err) => {
            console.error(err);
        }).on("spawn", () => {
            console.log(`Started API.`);
            isAPIRunning = true;
            if(isFrontendRunning && isBackendRunning && isAPIRunning) {
                console.log("OpenDocs is running on port 4500.");
            }
        });
    });
})
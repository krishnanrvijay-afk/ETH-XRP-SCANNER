#!/usr/bin/env node
"use strict";

const { ReplitConnectors } = require("/home/runner/workspace/node_modules/@replit/connectors-sdk/index.js");

async function main() {
  const connectors = new ReplitConnectors();
  const command = process.argv[2];

  if (command === "list-repos") {
    const resp = await connectors.proxy("github", "/user/repos?per_page=100&sort=updated", { method: "GET" });
    const repos = await resp.json();
    if (repos.message) { console.error("GitHub error:", repos.message); process.exit(1); }
    repos.forEach(r => console.log(r.full_name));
    return;
  }

  if (command === "get-file") {
    const [, , , owner, repo, filePath] = process.argv;
    const resp = await connectors.proxy("github", `/repos/${owner}/${repo}/contents/${filePath}`, { method: "GET" });
    const data = await resp.json();
    if (data.message) { console.error("GitHub error:", data.message); process.exit(1); }
    const content = Buffer.from(data.content, "base64").toString("utf8");
    process.stdout.write(content);
    return;
  }

  if (command === "push-file") {
    const [, , , owner, repo, filePath, localPath, commitMsg] = process.argv;
    const fs = require("fs");
    const fileContent = fs.readFileSync(localPath, "utf8");
    const encoded = Buffer.from(fileContent).toString("base64");

    // Get current SHA
    const getResp = await connectors.proxy("github", `/repos/${owner}/${repo}/contents/${filePath}`, { method: "GET" });
    const getData = await getResp.json();
    const sha = getData.sha;

    const body = JSON.stringify({
      message: commitMsg || "Update from Replit",
      content: encoded,
      sha: sha
    });

    const putResp = await connectors.proxy("github", `/repos/${owner}/${repo}/contents/${filePath}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body
    });
    const putData = await putResp.json();
    if (putData.message && !putData.commit) { console.error("GitHub error:", putData.message); process.exit(1); }
    console.log("Pushed successfully. Commit:", putData.commit?.sha);
    return;
  }

  console.error("Usage: node github-sync.cjs <list-repos|get-file|push-file> [args...]");
  process.exit(1);
}

main().catch(e => { console.error(e.message); process.exit(1); });

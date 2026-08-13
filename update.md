Update: Add observability logging to Worker stats handlers

What I changed
- Added structured console.log / console.warn / console.error statements to the Worker stats handlers in two locations:
  - src/api/stats.js (Cloudflare Worker module entry)
  - functions/api/stats.js (Cloudflare Pages Function variant)
- Wrapped handler logic in try/catch to ensure unexpected exceptions are logged and return a 500 JSON error response.
- Logged key events: incoming request metadata, action handling (get_ip_hash), visit start (visitorId, KV presence), new vs existing user processing, totals updates, and final response payload.

Why
- Observability is enabled for Workers by default, but without console logs the Logs view will be empty or unhelpful. Adding logs makes it easy to verify the Worker is invoked, see errors, and inspect important runtime values (visitorId, KV binding status, counters).

How to verify locally / in Cloudflare UI
1. Deploy or ensure this branch is built to your Worker (or merge to main and deploy).
2. Trigger a few requests to /api/stats:
   - curl -i "https://<your-worker-domain>/api/stats?action=visit"
   - curl -i -X POST "https://<your-worker-domain>/api/stats" -H "Content-Type: application/json" -d '{"language":"en"}'
3. Open Cloudflare Dashboard → Workers → your Worker → Observability → Logs
   - Look for log lines starting with [stats] or [pages-stats]
   - Example entries: "[stats] visit start visitorId=... kv_present=true", "[stats] totals updated totalVisits=..."

Next steps I recommend
1. Merge this branch to your main deployment (open a PR and run your normal review). I couldn't create the PR automatically from this agent; open one from add-worker-logging → main with title:
   "Add observability logging to Worker stats handlers"
   Use the contents of this update.md as the PR description.

2. (Optional) Convert logs to structured JSON objects for easier parsing and export (console.log(JSON.stringify({...}))). I can update the branch to emit JSON structured logs if you want.

3. (Optional) Configure an OTLP destination in Cloudflare Observability to forward logs to your logging/monitoring system (Datadog/Dataverse/ELK). Instructions are available in the Cloudflare dashboard under Observability → Destinations.

4. Add a small smoke test in your CI to call /api/stats (mock env or integration) and assert 200 response.

5. Monitor the Observability logs after deployment and adjust log verbosity as needed — avoid excessive logs on high-traffic endpoints.

Questions / next actions for me
- I pushed the changes to the branch "add-worker-logging". I cannot open the PR on your behalf using this agent, but I can provide the exact PR body and title to paste when creating it in GitHub, or walk you through creating it.
- Want me to convert the logs to JSON structured output now? Reply: "Convert to JSON logs".
- Want me to produce the PR description text (ready to paste)? Reply: "PR description".

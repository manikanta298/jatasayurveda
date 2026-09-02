const Agenda = require("agenda");

// Reuses the same MongoDB the app already connects to — no separate Redis
// instance to provision. Jobs are stored in the "agendaJobs" collection.
// processEvery is short (5s) so notification emails still go out promptly;
// this queue exists to take the SMTP round-trip off the request/response
// cycle, not to introduce a long delay.
const agenda = new Agenda({
  db: { address: process.env.MONGO_URI, collection: "agendaJobs" },
  processEvery: "5 seconds",
  maxConcurrency: 5,
});

agenda.on("fail", (err, job) => {
  console.error(`[agenda] Job "${job.attrs.name}" failed: ${err.message}`);
});

agenda.on("error", (err) => {
  // Without this listener, an EventEmitter "error" event with no listener
  // throws synchronously and crashes the entire Node process — not just
  // this feature. A dropped/unstable MongoDB connection would otherwise
  // take the whole API down (502s on every route) instead of just logging.
  console.error("[agenda] Connection error:", err.message);
});

async function startAgenda() {
  await agenda.start();
  console.log("[agenda] Background job queue started");
}

module.exports = { agenda, startAgenda };

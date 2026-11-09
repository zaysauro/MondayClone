import express from "express";
import { openDatabase } from "../lib/db";
import routesDeals from "./routes/deals";
import routesPersons from "./routes/persons";
import routesProperties from "./routes/properties";
import routesLeads from "./routes/leads";
import routesActivities from "./routes/activities";
import routesProposals from "./routes/proposals";
import routesDashboard from "./routes/dashboard";

export const db = openDatabase();

const app = express();
app.use(express.json({ limit: "2mb" }));

app.use("/api/deals", routesDeals(db));
app.use("/api/persons", routesPersons(db));
app.use("/api/properties", routesProperties(db));
app.use("/api/leads", routesLeads(db));
app.use("/api/activities", routesActivities(db));
app.use("/api/proposals", routesProposals(db));
app.use("/api", routesDashboard(db));

app.get("/api/users", (_req, res) => {
  const rows = db.prepare("SELECT id, name, email, role, active FROM users WHERE active = 1").all();
  res.json(rows);
});

app.get("/api/health", (_req, res) => res.json({ ok: true }));

app.use((_req, res) => res.status(404).json({ error: "Rota não encontrada" }));

const port = Number(process.env.PORT || 3001);
app.listen(port, () => {
  console.log(`API CRM rodando em http://localhost:${port}`);
});

import type { Router } from "express";
import express from "express";
import type { Database } from "better-sqlite3";
import { uuid } from "../../lib/uuid";
import { propertySchema } from "../../domain/validators";
import { ZodError } from "zod";

export default function routes(db: Database): Router {
  const r: Router = express.Router();
  const now = () => new Date().toISOString();

  const SEL = `id, code, type, purpose, status, development_id AS developmentId,
    owner_person_id AS ownerPersonId, address, price_cents AS priceCents,
    condo_fee_cents AS condoFeeCents, iptu_annual_cents AS iptuAnnualCents,
    bedrooms, suites, bathrooms, parking_spots AS parkingSpots, area_m2 AS areaM2,
    land_area_m2 AS landAreaM2, floor, age_years AS ageYears, features, description,
    photos, exclusive, created_at AS createdAt, updated_at AS updatedAt, deleted_at AS deletedAt`;

  const parseJSON = <T,>(s: unknown, fallback: T): T => {
    if (typeof s !== "string" || s === "") return fallback;
    try { return JSON.parse(s) as T; } catch { return fallback; }
  };
  const out = (row: Record<string, unknown>) => ({
    ...row,
    address: parseJSON(row.address, null),
    features: parseJSON(row.features, []),
    photos: parseJSON(row.photos, []),
    exclusive: !!row.exclusive,
  });

  const toSql = (b: Record<string, unknown>) => ({
    code: b.code, type: b.type, purpose: b.purpose, status: b.status ?? "disponivel",
    development_id: b.developmentId ?? null, owner_person_id: b.ownerPersonId ?? null,
    address: JSON.stringify(b.address ?? null),
    price_cents: Math.round(Number(b.priceCents)),
    condo_fee_cents: b.condoFeeCents == null ? null : Math.round(Number(b.condoFeeCents)),
    iptu_annual_cents: b.iptuAnnualCents == null ? null : Math.round(Number(b.iptuAnnualCents)),
    bedrooms: Number(b.bedrooms ?? 0), suites: Number(b.suites ?? 0), bathrooms: Number(b.bathrooms ?? 0),
    parking_spots: Number(b.parkingSpots ?? 0), area_m2: Number(b.areaM2 ?? 0),
    land_area_m2: b.landAreaM2 == null ? null : Number(b.landAreaM2),
    floor: b.floor == null ? null : Number(b.floor), age_years: b.ageYears == null ? null : Number(b.ageYears),
    features: JSON.stringify(b.features ?? []), description: b.description ?? null,
    photos: JSON.stringify(b.photos ?? []), exclusive: b.exclusive === false ? 0 : 1,
  });

  r.get("/", (_req, res) => {
    const rows = db.prepare(`SELECT ${SEL} FROM properties WHERE deleted_at IS NULL ORDER BY created_at DESC`).all() as Record<string, unknown>[];
    res.json(rows.map(out));
  });

  r.get("/:id", (req, res) => {
    const row = db.prepare(`SELECT ${SEL} FROM properties WHERE id = ?`).get(req.params.id);
    if (!row) return res.status(404).json({ error: "Imóvel não encontrado" });
    res.json(out(row as Record<string, unknown>));
  });

  r.post("/", (req, res) => {
    try {
      const body = propertySchema.parse(req.body);
      const id = uuid();
      const n = now();
      db.prepare(`INSERT INTO properties (id,code,type,purpose,status,development_id,owner_person_id,address,price_cents,condo_fee_cents,iptu_annual_cents,bedrooms,suites,bathrooms,parking_spots,area_m2,land_area_m2,floor,age_years,features,description,photos,exclusive,created_at,updated_at)
        VALUES (@id,@code,@type,@purpose,@status,@development_id,@owner_person_id,@address,@price_cents,@condo_fee_cents,@iptu_annual_cents,@bedrooms,@suites,@bathrooms,@parking_spots,@area_m2,@land_area_m2,@floor,@age_years,@features,@description,@photos,@exclusive,@created_at,@updated_at)`)
        .run({ id, ...toSql(body as unknown as Record<string, unknown>), created_at: n, updated_at: n });
      res.status(201).json(out(db.prepare(`SELECT ${SEL} FROM properties WHERE id = ?`).get(id) as Record<string, unknown>));
    } catch (e) {
      res.status(400).json({ error: e instanceof ZodError ? e.issues.map((i) => i.message).join("; ") : (e as Error).message });
    }
  });

  r.put("/:id", (req, res) => {
    const existing = db.prepare(`SELECT ${SEL} FROM properties WHERE id = ?`).get(req.params.id);
    if (!existing) return res.status(404).json({ error: "Imóvel não encontrado" });
    try {
      const body = propertySchema.parse({ ...(existing as object), ...req.body });
      db.prepare(`UPDATE properties SET code=@code, type=@type, purpose=@purpose, status=@status, development_id=@development_id,
        owner_person_id=@owner_person_id, address=@address, price_cents=@price_cents, condo_fee_cents=@condo_fee_cents,
        iptu_annual_cents=@iptu_annual_cents, bedrooms=@bedrooms, suites=@suites, bathrooms=@bathrooms, parking_spots=@parking_spots,
        area_m2=@area_m2, land_area_m2=@land_area_m2, floor=@floor, age_years=@age_years, features=@features, description=@description,
        photos=@photos, exclusive=@exclusive, updated_at=@updated_at WHERE id=@id`)
        .run({ ...toSql(body as unknown as Record<string, unknown>), updated_at: now(), id: req.params.id });
      res.json(out(db.prepare(`SELECT ${SEL} FROM properties WHERE id = ?`).get(req.params.id) as Record<string, unknown>));
    } catch (e) {
      res.status(400).json({ error: e instanceof ZodError ? e.issues.map((i) => i.message).join("; ") : (e as Error).message });
    }
  });

  r.delete("/:id", (req, res) => {
    db.prepare("UPDATE properties SET deleted_at = ? WHERE id = ?").run(now(), req.params.id);
    res.status(204).end();
  });

  return r;
}

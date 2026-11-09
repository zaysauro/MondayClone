import { describe, expect, it } from "vitest";
import { ALLOWED_TRANSITIONS, canTransition, assertTransition } from "../src/domain/pipeline";
import { STAGES } from "../src/domain/enums";
import { validateDealRules } from "../src/domain/validators";
import { personSchema } from "../src/domain/validators";
import { centsToBRL } from "../src/lib/money";

describe("pipeline — transições", () => {
  it("avanço de 1 etapa é permitido (novo_lead → contato_feito)", () => {
    expect(canTransition("novo_lead", "contato_feito")).toBe(true);
  });

  it("avanço de 1 etapa é permitido (qualificado → visita_agendada)", () => {
    expect(canTransition("qualificado", "visita_agendada")).toBe(true);
  });

  it("retorno de 1 etapa é permitido (visita_agendada → qualificado)", () => {
    expect(canTransition("visita_agendada", "qualificado")).toBe(true);
  });

  it("pulo de etapa é bloqueado (novo_lead → proposta)", () => {
    expect(canTransition("novo_lead", "proposta")).toBe(false);
  });

  it("avanço além de 1 etapa é bloqueado (contato_feito → reserva)", () => {
    expect(canTransition("contato_feito", "reserva")).toBe(false);
  });

  it("qualificado → ganho é bloqueado", () => {
    expect(canTransition("qualificado", "ganho")).toBe(false);
  });

  it("reserva → ganho é permitido", () => {
    expect(canTransition("reserva", "ganho")).toBe(true);
  });

  it("contrato → ganho é permitido", () => {
    expect(canTransition("contrato", "ganho")).toBe(true);
  });

  it("ganho não tem transições de saída", () => {
    expect(ALLOWED_TRANSITIONS["ganho"]).toEqual([]);
  });

  it("qualificado → perdido é permitido", () => {
    expect(canTransition("qualificado", "perdido")).toBe(true);
  });

  it("negociacao → perdido é permitido", () => {
    expect(canTransition("negociacao", "perdido")).toBe(true);
  });

  it("mesma etapa é recusada", () => {
    expect(canTransition("proposta", "proposta")).toBe(false);
  });
});

describe("pipeline — assertTransition", () => {
  it("lança erro claro em transição bloqueada", () => {
    expect(() => assertTransition("qualificado", "ganho")).toThrowError(/bloqueada/);
  });
});

describe("validações de deal", () => {
  it("closedAt é obrigatório em perdido", () => {
    expect(() =>
      validateDealRules({ stage: "perdido", valueCents: 0, closedAt: null, lostReason: "preco" }),
    ).toThrowError(/closedAt/);
  });

  it("lostReason é obrigatório em perdido", () => {
    expect(() =>
      validateDealRules({ stage: "perdido", valueCents: 0, closedAt: "2026-11-06T14:30:00.000Z", lostReason: null }),
    ).toThrowError(/lostReason/);
  });

  it("closedAt proibido em etapa aberta", () => {
    expect(() =>
      validateDealRules({ stage: "qualificado", valueCents: 0, closedAt: "2026-11-06T14:30:00.000Z" }),
    ).toThrowError(/closedAt/);
  });

  it("valueCents > 0 exigido a partir de proposta", () => {
    expect(() =>
      validateDealRules({ stage: "proposta", valueCents: 0, closedAt: null }),
    ).toThrowError(/valueCents/);
  });

  it("deal válido nova etapa não dispara erros", () => {
    expect(() =>
      validateDealRules({ stage: "novo_lead", valueCents: 0, closedAt: null }),
    ).not.toThrow();
  });
});

describe("validação de pessoa", () => {
  it("nome muito curto é rejeitado", () => {
    const r = personSchema.safeParse({ type: "comprador", name: "a" });
    expect(r.success).toBe(false);
  });

  it("documento fora de formato é rejeitado", () => {
    const r = personSchema.safeParse({ name: "Maria Teste", document: "123" });
    expect(r.success).toBe(false);
  });

  it("pessoa válida é aceita", () => {
    const r = personSchema.safeParse({ type: "comprador", name: "Maria Teste", document: "39053344705" });
    expect(r.success).toBe(true);
  });
});

describe("money", () => {
  it("formata centavos em BRL", () => {
    expect(centsToBRL(5200000)).toContain("52.000,00");
  });
});

describe("integridade geral", () => {
  it("todas as etapas têm regras de transição", () => {
    for (const s of STAGES) expect(ALLOWED_TRANSITIONS[s]).toBeDefined();
  });
});

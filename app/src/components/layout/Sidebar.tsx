const ITEMS: { id: string; label: string; icon: string }[] = [
  { id: "dashboard", label: "Dashboard", icon: "📊" },
  { id: "pipeline", label: "Pipeline", icon: "🗂️" },
  { id: "deals", label: "Negócios", icon: "💼" },
  { id: "properties", label: "Imóveis", icon: "🏠" },
  { id: "persons", label: "Pessoas", icon: "🧑" },
  { id: "activities", label: "Atividades", icon: "📞" },
];

export default function Sidebar({ page, onPage }: { page: string; onPage: (p: string) => void }) {
  return (
    <aside className="flex w-56 flex-col bg-slate-900 text-slate-200">
      <div className="flex items-center gap-2 px-5 py-5 text-lg font-bold text-white">
        <span className="text-xl">🏢</span> CRM Imobiliário
      </div>
      <nav className="flex-1 space-y-1 px-3">
        {ITEMS.map((it) => (
          <button
            key={it.id}
            onClick={() => onPage(it.id)}
            className={`flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm transition ${
              page === it.id ? "bg-indigo-600 text-white" : "hover:bg-slate-800"
            }`}
          >
            <span>{it.icon}</span> {it.label}
          </button>
        ))}
      </nav>
      <div className="px-5 py-4 text-xs text-slate-500">v1.0 · pipeline de vendas</div>
    </aside>
  );
}

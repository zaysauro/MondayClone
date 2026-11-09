import { ReactNode } from "react";
import { STAGE_PROBABILITY } from "../../domain/enums";

export default function StageColumn({
  title, stage, isOver, onDragOver, onDrop, children,
}: {
  title: string;
  stage: string;
  isOver: boolean;
  onDragOver: () => void;
  onDrop: () => void;
  children: ReactNode;
}) {
  return (
    <div
      className={`flex min-w-[220px] w-[240px] flex-shrink-0 flex-col rounded-xl border ${
        isOver ? "border-indigo-400 bg-indigo-50" : "border-slate-200 bg-slate-50"
      } p-2`}
      onDragOver={(e) => { e.preventDefault(); onDragOver(); }}
      onDrop={onDrop}
      data-stage={stage}
    >
      <div className="mb-2 flex items-center justify-between px-1">
        <span className="text-xs font-semibold uppercase text-slate-600">{title}</span>
        <span className="text-xs text-slate-400">{STAGE_PROBABILITY[stage as keyof typeof STAGE_PROBABILITY] ?? 0}%</span>
      </div>
      <div className="flex-1 space-y-2 overflow-y-auto">{children}</div>
    </div>
  );
}

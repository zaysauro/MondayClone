import { ReactNode } from "react";
import Sidebar from "./Sidebar";

export default function AppShell({
  page, onPage, children,
}: {
  page: string;
  onPage: (p: string) => void;
  children: ReactNode;
}) {
  return (
    <div className="flex min-h-screen">
      <Sidebar page={page} onPage={onPage} />
      <main className="flex-1 p-6">{children}</main>
    </div>
  );
}

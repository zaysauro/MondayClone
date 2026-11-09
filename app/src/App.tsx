import { useState } from "react";
import AppShell from "./components/layout/AppShell";
import DashboardPage from "./pages/DashboardPage";
import PipelinePage from "./pages/PipelinePage";
import DealsPage from "./pages/DealsPage";
import PropertiesPage from "./pages/PropertiesPage";
import PersonsPage from "./pages/PersonsPage";
import ActivitiesPage from "./pages/ActivitiesPage";

const PAGES: Record<string, React.ComponentType> = {
  dashboard: DashboardPage,
  pipeline: PipelinePage,
  deals: DealsPage,
  properties: PropertiesPage,
  persons: PersonsPage,
  activities: ActivitiesPage,
};

export default function App() {
  const [page, setPage] = useState("pipeline");
  const Current = PAGES[page] ?? PipelinePage;
  return (
    <AppShell page={page} onPage={setPage}>
      <Current />
    </AppShell>
  );
}

import { useState } from "react";
import PersonList from "../components/persons/PersonList";
import PersonForm from "../components/persons/PersonForm";

export default function PersonsPage() {
  const [open, setOpen] = useState(false);
  const [key, setKey] = useState(0);
  return (
    <>
      <PersonList onNew={() => setOpen(true)} key={key} />
      {open && (
        <PersonForm open onClose={() => setOpen(false)} onSaved={() => setKey(key + 1)} />
      )}
    </>
  );
}

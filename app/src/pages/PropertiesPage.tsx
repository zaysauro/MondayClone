import { useState } from "react";
import PropertyList from "../components/properties/PropertyList";
import PropertyForm from "../components/properties/PropertyForm";

export default function PropertiesPage() {
  const [open, setOpen] = useState(false);
  const [key, setKey] = useState(0);
  return (
    <>
      <PropertyList onNew={() => setOpen(true)} key={key} />
      {open && (
        <PropertyForm
          open
          onClose={() => setOpen(false)}
          onSaved={() => setKey(key + 1)}
        />
      )}
    </>
  );
}

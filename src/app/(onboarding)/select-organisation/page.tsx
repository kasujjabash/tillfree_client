import type { Metadata } from "next";
import { Suspense } from "react";

import { OrganisationPicker } from "@/features/organisations/components/organisation-picker";

export const metadata: Metadata = { title: "Choose an organisation" };

export default function SelectOrganisationPage() {
  return (
    <Suspense>
      <OrganisationPicker />
    </Suspense>
  );
}

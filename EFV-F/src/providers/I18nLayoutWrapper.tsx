'use client';

import { I18nProvider } from "./I18nProvider";
import CountrySelectorPopup from "@/components/Common/CountrySelectorPopup";

export default function I18nLayoutWrapper({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <I18nProvider>
      <CountrySelectorPopup />
      {children}
    </I18nProvider>
  );
}

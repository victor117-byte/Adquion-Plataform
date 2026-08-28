import { ReactNode } from "react";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";

interface LegalLayoutProps {
  title: string;
  updatedAt: string;
  children: ReactNode;
}

export const LegalLayout = ({ title, updatedAt, children }: LegalLayoutProps) => {
  return (
    <div className="min-h-screen">
      <Header />

      <section className="bg-surface px-4 pb-20 pt-28 sm:pb-24 sm:pt-32">
        <div className="container mx-auto max-w-3xl">
          <h1 className="font-display text-3xl font-extrabold leading-tight text-ink sm:text-4xl">
            {title}
          </h1>
          <p className="mt-2 text-sm text-ink-muted">Última actualización: {updatedAt}</p>

          <div className="prose-legal mt-10 space-y-8">{children}</div>
        </div>
      </section>

      <Footer />
    </div>
  );
};

export const LegalSection = ({ title, children }: { title: string; children: ReactNode }) => (
  <div>
    <h2 className="font-display text-xl font-bold text-ink">{title}</h2>
    <div className="mt-3 space-y-3 text-sm leading-relaxed text-ink-muted [&_strong]:font-semibold [&_strong]:text-ink [&_ul]:list-disc [&_ul]:space-y-1.5 [&_ul]:pl-5">
      {children}
    </div>
  </div>
);

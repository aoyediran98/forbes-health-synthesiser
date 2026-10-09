import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Research-to-hypothesis synthesiser",
  description:
    "Turn reviews, tickets and survey verbatims into ranked problem statements and testable hypotheses.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className="h-full antialiased">
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}

import type { Metadata } from "next";
import "./globals.css";
import { WorkspaceProvider } from "@/hooks/workspace";
import { Shell } from "@/components/shell";
export const metadata: Metadata = {
  title: "AlgoAdapt — The Algorithm Lab",
  description:
    "Analyze your input, understand the algorithm, and test the decision. An adaptive DAA laboratory.",
  icons: { icon: "/favicon.svg" },
};
export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      {/* Extensions such as Scholarcy add body attributes before hydration.
          Limit this escape hatch to body attributes; descendants still validate. */}
      <body suppressHydrationWarning>
        <WorkspaceProvider>
          <Shell>{children}</Shell>
        </WorkspaceProvider>
      </body>
    </html>
  );
}

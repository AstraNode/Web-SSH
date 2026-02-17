import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
    title: "Web SSH",
    description: "High-performance web-based SSH client",
};

export default function RootLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <html lang="en" className="dark">
            <body>{children}</body>
        </html>
    );
}
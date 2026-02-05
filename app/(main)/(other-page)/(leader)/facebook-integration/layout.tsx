export default function RootLayout({ children }: { children: React.ReactNode }) {
    return (
        <main style={{ padding: 24 }}>
            {children}
        </main>
    );
}

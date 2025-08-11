import "./globals.css";

export const metadata = {
  title: "Varuna",
  description:
    "Varuna is your personal AI assistant by International Centre of Excellence for Dams (ICED)",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>
        {children}
      </body>
    </html>
  );
}

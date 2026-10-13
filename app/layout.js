import Provider from "@/provider";
import "./globals.css";
import { Outfit } from "next/font/google";
import { ClerkProvider } from "@clerk/nextjs";

export const metadata = {
  title: {
    default: "Goat Note",
    template: "%s · Goat Note",
  },
  description:
    "Goat Note is a fast, minimal notes app. Capture ideas, pin what matters, and find anything instantly.",
};

const outfit = Outfit({
  subsets: ["latin"],
  variable: "--font-outfit",
  display: "swap",
});

// Applies the saved theme before first paint to avoid a flash of the wrong theme.
const themeScript = `
(function(){try{var t=localStorage.getItem("theme");var d=t?t==="dark":window.matchMedia("(prefers-color-scheme: dark)").matches;if(d)document.documentElement.classList.add("dark");}catch(e){}})();
`;

export default function RootLayout({ children }) {
  return (
    <ClerkProvider>
      <html lang="en" suppressHydrationWarning className={outfit.variable}>
        <head>
          <script dangerouslySetInnerHTML={{ __html: themeScript }} />
        </head>
        <body className="min-h-dvh font-sans antialiased">
          <Provider>{children}</Provider>
        </body>
      </html>
    </ClerkProvider>
  );
}

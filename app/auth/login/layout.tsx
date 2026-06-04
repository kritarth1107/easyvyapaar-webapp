import { loginPageMetadata } from "@/lib/seo/site-metadata";
import {
  Noto_Nastaliq_Urdu,
  Noto_Sans_Devanagari,
  Noto_Sans_Gujarati,
  Noto_Sans_Gurmukhi,
  Noto_Sans_Malayalam,
  Noto_Sans_Tamil,
  Noto_Sans_Telugu,
} from "next/font/google";

const devanagari = Noto_Sans_Devanagari({
  subsets: ["devanagari"],
  variable: "--font-dukaan-deva",
  weight: ["600", "700"],
});

const gujarati = Noto_Sans_Gujarati({
  subsets: ["gujarati"],
  variable: "--font-dukaan-gu",
  weight: ["600", "700"],
});

const gurmukhi = Noto_Sans_Gurmukhi({
  subsets: ["gurmukhi"],
  variable: "--font-dukaan-pa",
  weight: ["600", "700"],
});

const tamil = Noto_Sans_Tamil({
  subsets: ["tamil"],
  variable: "--font-dukaan-ta",
  weight: ["600", "700"],
});

const telugu = Noto_Sans_Telugu({
  subsets: ["telugu"],
  variable: "--font-dukaan-te",
  weight: ["600", "700"],
});

const malayalam = Noto_Sans_Malayalam({
  subsets: ["malayalam"],
  variable: "--font-dukaan-ml",
  weight: ["600", "700"],
});

const urdu = Noto_Nastaliq_Urdu({
  subsets: ["arabic"],
  variable: "--font-dukaan-ur",
  weight: ["600", "700"],
});

export const metadata = loginPageMetadata;

export default function LoginLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <div
      className={`${devanagari.variable} ${gujarati.variable} ${gurmukhi.variable} ${tamil.variable} ${telugu.variable} ${malayalam.variable} ${urdu.variable}`}
    >
      {children}
    </div>
  );
}

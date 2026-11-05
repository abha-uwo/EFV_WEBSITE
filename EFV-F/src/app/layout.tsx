import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import SecurityLayer from "@/components/Common/SecurityLayer";
import I18nLayoutWrapper from "@/providers/I18nLayoutWrapper";
import Script from "next/script";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Energy Frequency Vibration | Official Platform",
  description: "EFV™ by UWO™ — the world's first Alignment Intelligence system designed to elevate your Energy, Frequency & Vibration.",
  robots: {
    index: true,
    follow: true,
  },
  verification: {
    google: "G-D2Z48EXJ9Z",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        {/* Unified Analytics Platform Auto-Tracker */}
        <Script
          id="unified-analytics-tracker"
          strategy="afterInteractive"
          src="https://uwo24.com/api/web-stats/tracker.js"
          data-site="efvframework"
          data-endpoint="https://uwo24.com/api/web-stats/collect"
        />

        {/* Google Analytics GA4 */}
        <Script
          strategy="afterInteractive"
          src="https://www.googletagmanager.com/gtag/js?id=G-D2Z48EXJ9Z"
        />
        <Script id="ga4-init" strategy="afterInteractive" dangerouslySetInnerHTML={{
          __html: `
            window.dataLayer = window.dataLayer || [];
            function gtag(){dataLayer.push(arguments);}
            gtag('js', new Date());
            gtag('config', 'G-D2Z48EXJ9Z');
          `
        }} />
        
        {/* Microsoft Clarity */}
        <Script id="microsoft-clarity" strategy="afterInteractive" dangerouslySetInnerHTML={{
          __html: `
            (function(c,l,a,r,i,t,y){
                c[a]=c[a]||function(){(c[a].q=c[a].q||[]).push(arguments)};
                t=l.createElement(r);t.async=1;t.src="https://www.clarity.ms/tag/"+i;
                y=l.getElementsByTagName(r)[0];y.parentNode.insertBefore(t,y);
            })(window, document, "clarity", "script", "xna8nwpoq6");
          `
        }} />

        {/* Meta Pixel Code */}
        <Script id="meta-pixel" strategy="afterInteractive" dangerouslySetInnerHTML={{
          __html: `
            !function(f,b,e,v,n,t,s)
            {if(f.fbq)return;n=f.fbq=function(){n.callMethod?
            n.callMethod.apply(n,arguments):n.queue.push(arguments)};
            if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';
            n.queue=[];t=b.createElement(e);t.async=!0;
            t.src=v;s=b.getElementsByTagName(e)[0];
            s.parentNode.insertBefore(t,s)}(window, document,'script',
            'https://connect.facebook.net/en_US/fbevents.js');
            fbq('init', '1015594134713138');
            fbq('track', 'PageView');
          `
        }} />
        <noscript>
          <img
            height="1"
            width="1"
            style={{ display: "none" }}
            src="https://www.facebook.com/tr?id=1015594134713138&ev=PageView&noscript=1"
            alt="Meta Pixel"
          />
        </noscript>

        <SecurityLayer />
        <I18nLayoutWrapper>
          {children}
        </I18nLayoutWrapper>
      </body>
    </html>
  );
}

import { Plus_Jakarta_Sans, Inter } from 'next/font/google';
import './globals.css';
import Providers from '@/components/Providers';

const jakarta = Plus_Jakarta_Sans({
  subsets: ['latin'],
  weight: ['600', '700', '800'],
  variable: '--font-heading',
  display: 'swap',
});

const inter = Inter({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
  variable: '--font-body',
  display: 'swap',
});

export const metadata = {
  title: 'Balothia Refrigeration – Electronic Toys & Learning Store',
  description: 'Electronic toys & games for child education. Learn. Play. Grow every day!',
};

export const viewport = { width: 'device-width', initialScale: 1 };

export default function RootLayout({ children }) {
  return (
    <html
      lang="en"
      className={`${jakarta.variable} ${inter.variable} overflow-x-clip`}
    >
      <body className={`${inter.className} overflow-x-clip bg-white text-slate-800 antialiased`}>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}














// import './globals.css';
// import Providers from '@/components/Providers';

// export const metadata = {
//   title: 'Balothia Refrigeration – Electronic Toys & Learning Store',
//   description: 'Electronic toys & games for child education. Learn. Play. Grow every day!',
// };
// export const viewport = { width: 'device-width', initialScale: 1 };

// export default function RootLayout({ children }) {
//   return (
//     <html lang="en" className="overflow-x-clip">
//       <body className="overflow-x-clip">
//         <Providers>{children}</Providers>
//       </body>
//     </html>
//   );
// }
import Link from "next/link";
import { Coffee } from "lucide-react";

export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-6 text-center">
      <div className="glass-panel p-10 rounded-3xl max-w-md w-full flex flex-col items-center space-y-6">
        <div className="w-16 h-16 rounded-2xl glass-panel flex items-center justify-center mb-4 border-white/20">
          <Coffee className="w-8 h-8 text-white" />
        </div>
        <h1 className="text-3xl font-light tracking-wider text-gradient">
          AURA CAFE
        </h1>
        <p className="text-white/60 font-light text-sm">
          Please scan the QR code on your table to access the menu and place your order.
        </p>
        
        <div className="w-full h-[1px] bg-white/10 my-6" />
        
        <div className="text-xs text-white/40 mb-4 uppercase tracking-widest">Demo Links</div>
        <div className="flex flex-col w-full gap-3">
          <Link href="/table/7" className="glass-button w-full py-3 rounded-xl text-sm font-medium tracking-wide">
            Simulate Table 7
          </Link>
          <Link href="/admin" className="glass-button w-full py-3 rounded-xl text-sm font-medium tracking-wide border-white/10 bg-white/5">
            Admin Dashboard
          </Link>
        </div>
      </div>
    </main>
  );
}

import { ArrowUpRight, Menu, Truck, X } from "lucide-react";
import { useState } from "react";

export default function Navbar() {
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <header className="sticky top-0 z-50 border-b border-gray-100 bg-white/95 backdrop-blur">
      <nav className="mx-auto flex max-w-7xl items-center justify-between px-5 py-4 lg:px-8">
        <a href="#home" className="flex items-center gap-2">
          <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-600 text-white">
            <Truck size={23} />
          </span>
          <span className="text-2xl font-extrabold tracking-tight">
            Local<span className="text-emerald-600">Ride</span>
          </span>
        </a>

        <div className="hidden items-center gap-8 md:flex">
          <a href="#home" className="text-sm font-medium text-gray-700 hover:text-emerald-600">Home</a>
          <a href="#vehicles" className="text-sm font-medium text-gray-700 hover:text-emerald-600">Vehicles</a>
          <a href="#how-it-works" className="text-sm font-medium text-gray-700 hover:text-emerald-600">How it works</a>
        </div>

        <div className="hidden items-center gap-3 md:flex">
          <button
            onClick={() => document.getElementById("vehicles")?.scrollIntoView({ behavior: "smooth" })}
            className="rounded-xl px-4 py-2.5 text-sm font-semibold text-gray-700 hover:bg-gray-100"
          >
            Find a ride
          </button>
          <button
            onClick={() => document.getElementById("driver-cta")?.scrollIntoView({ behavior: "smooth" })}
            className="flex items-center gap-2 rounded-xl bg-emerald-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-emerald-700"
          >
            Become a driver <ArrowUpRight size={16} />
          </button>
        </div>

        <button
          onClick={() => setMenuOpen(!menuOpen)}
          className="rounded-lg p-2 text-gray-700 hover:bg-gray-100 md:hidden"
          aria-label="Toggle navigation"
          aria-expanded={menuOpen}
        >
          {menuOpen ? <X size={24} /> : <Menu size={24} />}
        </button>
      </nav>

      {menuOpen && (
        <div className="border-t border-gray-100 bg-white px-5 py-4 md:hidden">
          <div className="flex flex-col gap-4">
            <a onClick={() => setMenuOpen(false)} href="#home" className="font-medium">Home</a>
            <a onClick={() => setMenuOpen(false)} href="#vehicles" className="font-medium">Vehicles</a>
            <a onClick={() => setMenuOpen(false)} href="#how-it-works" className="font-medium">How it works</a>
            <button
              onClick={() => {
                setMenuOpen(false);
                document.getElementById("driver-cta")?.scrollIntoView({ behavior: "smooth" });
              }}
              className="rounded-xl bg-emerald-600 px-4 py-3 font-semibold text-white"
            >
              Become a driver
            </button>
          </div>
        </div>
      )}
    </header>
  );
}
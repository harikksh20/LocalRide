import { ArrowRight, MapPin, Search, ShieldCheck, Truck } from "lucide-react";
import { useState } from "react";

export default function HeroSection() {
  const [area, setArea] = useState("");
  const [destination, setDestination] = useState("");
  const [vehicle, setVehicle] = useState("All vehicles");
  const [message, setMessage] = useState("");

  function handleSearch(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!area.trim()) {
      setMessage("Please enter your pickup area.");
      return;
    }

    setMessage(
      `Search requested for ${area.trim()}${destination.trim() ? ` to ${destination.trim()}` : ""} — ${vehicle}. Driver search will be connected in the next step.`
    );
  }

  return (
    <section id="home" className="overflow-hidden bg-[#f6faf7]">
      <div className="mx-auto grid max-w-7xl items-center gap-12 px-5 py-16 md:py-24 lg:grid-cols-2 lg:px-8">
        <div>
          <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-emerald-100 bg-white px-4 py-2 text-sm font-semibold text-emerald-700">
            <span className="h-2 w-2 rounded-full bg-emerald-500" />
            Your local transport, simplified
          </div>

          <h1 className="max-w-2xl text-4xl font-extrabold leading-tight tracking-tight text-gray-950 sm:text-5xl lg:text-6xl">
            The right ride.
            <br />
            <span className="text-emerald-600">Right around you.</span>
          </h1>

          <p className="mt-6 max-w-xl text-base leading-7 text-gray-600 sm:text-lg">
            Find local drivers for everyday rides and goods transport.
            Search your area, compare vehicles, and request a booking in one place.
          </p>

          <form onSubmit={handleSearch} className="mt-9 rounded-2xl border border-gray-100 bg-white p-4 shadow-xl shadow-gray-200/50 sm:p-5">
            <div className="grid gap-4 sm:grid-cols-2">
              <label className="block">
                <span className="mb-2 block text-xs font-bold uppercase tracking-wider text-gray-500">
                  Pickup area
                </span>
                <span className="flex items-center gap-3 rounded-xl border border-gray-200 px-3 py-3 focus-within:border-emerald-500">
                  <MapPin size={19} className="shrink-0 text-emerald-600" />
                  <input
                    value={area}
                    onChange={(e) => setArea(e.target.value)}
                    placeholder="e.g. Rasipuram"
                    className="w-full min-w-0 bg-transparent text-sm outline-none"
                  />
                </span>
              </label>

              <label className="block">
                <span className="mb-2 block text-xs font-bold uppercase tracking-wider text-gray-500">
                  Destination
                </span>
                <span className="flex items-center gap-3 rounded-xl border border-gray-200 px-3 py-3 focus-within:border-emerald-500">
                  <MapPin size={19} className="shrink-0 text-gray-400" />
                  <input
                    value={destination}
                    onChange={(e) => setDestination(e.target.value)}
                    placeholder="Where to?"
                    className="w-full min-w-0 bg-transparent text-sm outline-none"
                  />
                </span>
              </label>
            </div>

            <label className="mt-4 block">
              <span className="mb-2 block text-xs font-bold uppercase tracking-wider text-gray-500">
                Vehicle type
              </span>
              <select
                value={vehicle}
                onChange={(e) => setVehicle(e.target.value)}
                className="w-full rounded-xl border border-gray-200 bg-white px-3 py-3 text-sm outline-none focus:border-emerald-500"
              >
                <option>All vehicles</option>
                <option>Auto</option>
                <option>Car</option>
                <option>Pickup Van</option>
                <option>Mini Truck</option>
                <option>Lorry</option>
              </select>
            </label>

            <button
              type="submit"
              className="mt-4 flex w-full items-center justify-center gap-2 rounded-xl bg-emerald-600 px-5 py-4 font-bold text-white transition hover:bg-emerald-700"
            >
              <Search size={19} /> Find available drivers <ArrowRight size={18} />
            </button>

            {message && (
              <p role="status" className="mt-3 rounded-lg bg-emerald-50 p-3 text-sm text-emerald-800">
                {message}
              </p>
            )}
          </form>

          <div className="mt-6 flex flex-wrap gap-x-6 gap-y-3 text-sm text-gray-600">
            <span className="flex items-center gap-2"><ShieldCheck size={17} className="text-emerald-600" /> Easy booking</span>
            <span className="flex items-center gap-2"><Truck size={17} className="text-emerald-600" /> Multiple vehicles</span>
          </div>
        </div>

        <div className="relative">
          <div className="absolute -inset-4 rounded-[2rem] bg-emerald-100/70 blur-2xl" />
          <div className="relative overflow-hidden rounded-[2rem] bg-emerald-950 p-6 text-white sm:p-9">
            <div className="absolute -right-12 -top-12 h-48 w-48 rounded-full border border-white/10" />
            <div className="absolute -right-5 -top-5 h-32 w-32 rounded-full border border-white/10" />

            <p className="text-sm font-semibold text-emerald-300">TRANSPORT MADE SIMPLE</p>
            <h2 className="mt-3 max-w-md text-3xl font-bold leading-tight sm:text-4xl">
              One place for your local transport needs.
            </h2>
            <p className="mt-3 max-w-md leading-7 text-emerald-100/80">
              From a quick auto ride to moving goods across town, discover the right vehicle for your journey.
            </p>

            <div className="mt-8 grid grid-cols-2 gap-3">
              {[
                { emoji: "🛺", name: "Auto", desc: "Local rides" },
                { emoji: "🚗", name: "Car", desc: "Comfortable trips" },
                { emoji: "🛻", name: "Pickup", desc: "Small loads" },
                { emoji: "🚚", name: "Lorry", desc: "Goods transport" },
              ].map((item) => (
                <div key={item.name} className="rounded-2xl border border-white/10 bg-white/10 p-4 backdrop-blur-sm">
                  <span className="text-3xl">{item.emoji}</span>
                  <p className="mt-3 font-bold">{item.name}</p>
                  <p className="mt-1 text-xs text-emerald-100/70">{item.desc}</p>
                </div>
              ))}
            </div>

            <div className="mt-5 flex items-center gap-3 rounded-xl bg-white/10 p-4">
              <span className="flex h-10 w-10 items-center justify-center rounded-full bg-emerald-400/20">
                <MapPin size={20} className="text-emerald-300" />
              </span>
              <div>
                <p className="font-semibold">Search by area</p>
                <p className="text-sm text-emerald-100/70">Find drivers serving your location.</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
import { ArrowRight, CheckCircle2, MapPin, Search } from "lucide-react";

const steps = [
  {
    number: "01",
    title: "Enter your area",
    description: "Choose your pickup area and destination to begin your search.",
    icon: MapPin,
  },
  {
    number: "02",
    title: "Find your driver",
    description: "Explore vehicle options and compare available drivers and fares.",
    icon: Search,
  },
  {
    number: "03",
    title: "Request a booking",
    description: "Choose the driver that suits your needs and submit a booking request.",
    icon: CheckCircle2,
  },
];

export default function HowItWorks() {
  return (
    <section id="how-it-works" className="bg-[#f6faf7] py-20">
      <div className="mx-auto max-w-7xl px-5 lg:px-8">
        <div className="mx-auto max-w-2xl text-center">
          <p className="text-sm font-bold uppercase tracking-widest text-emerald-600">Simple process</p>
          <h2 className="mt-3 text-3xl font-extrabold tracking-tight text-gray-950 sm:text-4xl">
            Your ride in three steps.
          </h2>
          <p className="mt-4 leading-7 text-gray-600">
            A simple way to discover local transport without the hassle.
          </p>
        </div>

        <div className="mt-12 grid gap-6 md:grid-cols-3">
          {steps.map((step, index) => {
            const Icon = step.icon;

            return (
              <div key={step.number} className="relative rounded-2xl border border-gray-100 bg-white p-7 shadow-sm">
                <div className="flex items-center justify-between">
                  <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-emerald-50 text-emerald-700">
                    <Icon size={23} />
                  </div>
                  <span className="text-3xl font-extrabold text-gray-100">{step.number}</span>
                </div>
                <h3 className="mt-6 text-xl font-bold text-gray-900">{step.title}</h3>
                <p className="mt-3 leading-7 text-gray-600">{step.description}</p>
                {index < 2 && (
                  <ArrowRight className="absolute -right-4 top-1/2 z-10 hidden -translate-y-1/2 text-emerald-400 md:block" size={28} />
                )}
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
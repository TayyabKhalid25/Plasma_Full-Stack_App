import { Gamepad2, Calendar, Trophy } from "lucide-react";

// Feature cards data for the right panel
const featureCards = [
  {
    icon: <Gamepad2 className="w-5 h-5 text-[#ffb1c1]" />,
    iconBg: "bg-[#ffb1c133]",
    text: "See your squad's live\nactivity",
    wrapperClass: "flex justify-center w-full",
    cardClass: "flex max-w-[280px] w-[280px] items-center gap-4 p-6 bg-plasma-slate/60 rounded-2xl border border-solid border-plasma-text-primary/10 backdrop-blur [-webkit-backdrop-filter:blur(8px)_brightness(100%)] shadow-[0px_25px_50px_-12px_#00000040]",
  },
  {
    icon: <Calendar className="w-5 h-5 text-[#d1bcff]" />,
    iconBg: "bg-[#d1bcff33]",
    text: "Schedule gaming\nsessions effortlessly",
    wrapperClass: "flex justify-center w-full pl-12",
    cardClass: "flex max-w-[280px] w-[280px] items-center gap-4 p-6 bg-plasma-slate/60 rounded-2xl border border-solid border-plasma-text-primary/10 backdrop-blur [-webkit-backdrop-filter:blur(8px)_brightness(100%)] shadow-[0px_25px_50px_-12px_#00000040]",
  },
  {
    icon: <Trophy className="w-5 h-5 text-[#e40468]" />,
    iconBg: "bg-[#e4046833]",
    text: "Track achievements\nacross all platforms",
    wrapperClass: "flex justify-center w-full pr-12",
    cardClass: "flex max-w-[280px] w-[280px] items-center gap-4 p-6 bg-plasma-slate/60 rounded-2xl border border-solid border-plasma-text-primary/10 backdrop-blur [-webkit-backdrop-filter:blur(8px)_brightness(100%)] shadow-[0px_25px_50px_-12px_#00000040]",
  },
];

export default function AuthRightPanel() {
  return (
    <div className="hidden lg:flex flex-col items-center justify-center relative flex-1 self-stretch z-0 bg-plasma-slate overflow-hidden">
      {/* Radial gradient overlay */}
      <div className="absolute w-full h-full top-0 left-0" style={{ background: "radial-gradient(50% 50% at 50% 50%, rgba(86,56,149,0.15) 0%, rgba(86,56,149,0) 70%)" }} />

      {/* Large watermark Logo */}
      <div className="flex w-full h-full items-center justify-center absolute top-0 left-0 opacity-5 pointer-events-none select-none">
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 394.31 468"
          className="w-[600px] h-auto ml-[-120px] text-plasma-primary"
          fill="currentColor"
        >
          <polygon points="0 0 0 99.37 96.23 99.37 100.17 99.37 292.56 99.37 292.56 241.68 197.16 241.68 197.16 331.59 197.16 331.98 197.16 338.66 297.59 338.66 299.5 336.34 394.31 241.86 394.31 0 0 0" />
          <polygon points="100.17 273.23 100.17 265.82 100.17 130.93 96.23 130.93 0 226.82 0 350.71 0 375.33 0 468 170.22 467.27 265.79 370.81 100.17 370.21 100.17 273.23" />
        </svg>
      </div>

      {/* Version label */}
      <div className="absolute right-8 bottom-8 opacity-20 select-none">
        <span className="font-display font-bold text-plasma-text-primary/30 text-base tracking-[1.60px] leading-6 whitespace-nowrap">
          NEON OBSERVATORY v2.4
        </span>
      </div>

      {/* Feature cards */}
      <div className="flex flex-col items-center gap-8 relative self-stretch w-full flex-[0_0_auto] z-10 scale-90 xl:scale-100">
        {featureCards.map((card, index) => (
          <div key={index} className={card.wrapperClass}>
            <div className={`${card.cardClass} transition-transform hover:-translate-y-1`}>
              {/* Icon circle */}
              <div className={`${card.iconBg} flex w-10 h-10 items-center justify-center rounded-full flex-shrink-0`}>
                {card.icon}
              </div>
              {/* Card text */}
              <p className="font-sans font-medium text-plasma-text-primary text-sm tracking-[0] leading-[17.5px] whitespace-pre-line">
                {card.text}
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

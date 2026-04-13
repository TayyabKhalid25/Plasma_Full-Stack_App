import Link from "next/link";
import { Button } from "../../components/ui/button";
import { Input } from "../../components/ui/input";
import { Label } from "../../components/ui/label";
import { Separator } from "../../components/ui/separator";

// Feature cards data for the right panel
const featureCards = [
  {
    icon: "🎮",
    iconBg: "bg-[#ffb1c133]",
    text: "See your squad's live\nactivity",
    wrapperClass: "flex justify-center w-full",
    cardClass: "flex max-w-[280px] w-[280px] items-center gap-4 p-6 bg-[#1a172699] rounded-2xl border border-solid border-[#f8f9fa1a] backdrop-blur [-webkit-backdrop-filter:blur(8px)_brightness(100%)] shadow-[0px_25px_50px_-12px_#00000040]",
  },
  {
    icon: "📅",
    iconBg: "bg-[#d1bcff33]",
    text: "Schedule gaming\nsessions effortlessly",
    wrapperClass: "flex justify-center w-full pl-12",
    cardClass: "flex max-w-[280px] w-[280px] items-center gap-4 p-6 bg-[#1a172699] rounded-2xl border border-solid border-[#f8f9fa1a] backdrop-blur [-webkit-backdrop-filter:blur(8px)_brightness(100%)] shadow-[0px_25px_50px_-12px_#00000040]",
  },
  {
    icon: "🏆",
    iconBg: "bg-[#e4046833]",
    text: "Track achievements\nacross all platforms",
    wrapperClass: "flex justify-center w-full pr-12",
    cardClass: "flex max-w-[280px] w-[280px] items-center gap-4 p-6 bg-[#1a172699] rounded-2xl border border-solid border-[#f8f9fa1a] backdrop-blur [-webkit-backdrop-filter:blur(8px)_brightness(100%)] shadow-[0px_25px_50px_-12px_#00000040]",
  },
];

export default function LoginPage() {
  return (
    <div className="bg-[#0d0b14] overflow-hidden w-full flex flex-col lg:flex-row min-h-screen selection:bg-plasma-primary selection:text-white">
      {/* Left panel - Login form */}
      <div className="flex flex-col items-center justify-center px-6 py-12 flex-1 self-stretch z-[1] bg-[#0d0b14]">
        <div className="flex flex-col max-w-[460px] w-full items-start gap-[18px]">
          {/* Logo + heading */}
          <div className="pt-8 pb-0 px-0 inline-flex flex-col items-start flex-[0_0_auto]">
            <div className="text-3xl font-bold text-white font-display tracking-[0.15em] mb-4">
              PLASMA
            </div>
            
            <div className="gap-[7px] inline-flex flex-col items-start flex-[0_0_auto]">
              <div className="flex flex-col items-start self-stretch w-full flex-[0_0_auto]">
                <h1 className="font-display font-bold text-[#f8f9fa] text-[28px] tracking-[-0.70px] leading-[42px] whitespace-nowrap">
                  Welcome Back, Gamer
                </h1>
              </div>
              <div className="flex flex-col max-w-[380px] items-start w-full flex-[0_0_auto]">
                <p className="font-sans font-normal text-[#8a869c] text-[15px] tracking-[0] leading-[24px]">
                  Sign in with your Steam account to access your
                  <br />
                  squad, feed, and game stats.
                </p>
              </div>
            </div>
          </div>

          <form className="flex flex-col gap-[18px] w-full max-w-[380px]">
             {/* Username field */}
             <div className="flex flex-col gap-1.5 self-stretch w-full">
              <Label
                htmlFor="username"
                className="font-sans font-medium text-[#cbc4d3] text-[13px] tracking-[0] leading-[19.5px]"
              >
                Username
              </Label>
              <Input
                id="username"
                defaultValue="pro_gamer"
                className="w-full bg-[#1A1726]/50 text-white rounded-xl border border-solid border-[#cbc4d340] font-sans font-normal text-[#cbc4d3] text-sm py-[11px] px-4 h-[44px] transition-all focus-visible:border-plasma-primary"
              />
            </div>
            
            {/* Password field */}
            <div className="flex flex-col gap-1.5 self-stretch w-full">
              <Label
                htmlFor="password"
                className="font-sans font-medium text-[#cbc4d3] text-[13px] tracking-[0] leading-[19.5px]"
              >
                Password
              </Label>
              <Input
                id="password"
                type="password"
                defaultValue="........"
                className="w-full bg-[#1A1726]/50 text-white rounded-xl border border-solid border-[#cbc4d340] font-sans font-normal text-[#cbc4d3] text-sm py-[11px] px-4 h-[44px] transition-all focus-visible:border-plasma-primary"
              />
            </div>
            
            {/* Log In button */}
            <Button className="self-stretch w-full h-[52px] bg-primary-gradient rounded-[32px] shadow-card-glow font-sans font-bold text-white text-base text-center tracking-[0] leading-6 border-0 hover:opacity-90 transition-all hover:scale-[1.02]">
              Log In
            </Button>
            
            {/* OR divider */}
            <div className="flex flex-col items-start pt-[12px] pb-0 px-0 self-stretch w-full flex-[0_0_auto]">
              <div className="flex items-center gap-4 self-stretch w-full flex-[0_0_auto]">
                <Separator className="flex-1 bg-[#cbc4d333]" />
                <span className="font-sans font-medium text-[#cbc4d3] text-[13px] tracking-[0.65px] leading-[19.5px] whitespace-nowrap">
                  OR
                </span>
                <Separator className="flex-1 bg-[#cbc4d333]" />
              </div>
            </div>
          </form>

          {/* Sign in with Steam + Sign Up link */}
          <div className="w-full pt-4 pb-0 px-0 flex flex-col max-w-[380px] items-start flex-[0_0_auto]">
            <div className="gap-[24px] w-full flex flex-col max-w-[380px] items-start flex-[0_0_auto]">
              {/* Steam button */}
              <Button className="w-full h-[50px] bg-[#563895] rounded-[32px] font-sans font-normal text-white text-[15px] text-center tracking-[0] leading-[22.5px] whitespace-nowrap hover:bg-[#6a47b0] border-0 flex items-center justify-center gap-2 transition-all hover:scale-[1.02]">
                <svg viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
                  <path d="M12.001 22.502c-5.748 0-10.424-4.63-10.498-10.366L4.747 9.87l1.094 2.87c.801-1.636 2.37-2.651 4.195-2.651 2.222 0 4.103 1.543 4.675 3.655.857-1.571 2.505-2.641 4.414-2.641 2.766 0 5.012 2.247 5.012 5.013 0 2.768-2.246 5.015-5.012 5.015-2.31 0-4.254-1.59-4.836-3.702-.634 1.258-1.921 2.112-3.411 2.112-1.97 0-3.626-1.523-3.86-3.456l-1.077 3.037c1.332 2.453 3.972 4.181 7.054 4.181 4.29 0 7.781-3.491 7.781-7.781 0-4.29-3.491-7.781-7.781-7.781-1.644 0-3.172.518-4.42 1.398l-3.565-9.336H.482l1.625 4.258C1.463 3.42 6.273.5 12.002.5c5.798 0 10.498 4.7 10.498 10.499s-4.7 10.499-10.499 10.499L12.001 22.502h0z"/>
                </svg>
                Sign in with Steam
              </Button>
              {/* Sign Up link */}
              <div className="flex flex-col w-full items-center flex-[0_0_auto]">
                <Link
                  href="/sign-up"
                  className="font-sans font-medium text-[#563895] text-[13px] text-center tracking-[0] leading-[19.5px] whitespace-nowrap hover:underline hover:text-plasma-secondary transition-colors"
                >
                  Don't have an Account? Sign Up
                </Link>
              </div>
            </div>
          </div>
          
          {/* Terms and Privacy */}
          <div className="flex flex-wrap items-center justify-center text-center max-w-[380px] w-full mt-4">
             <span className="font-sans font-normal text-[#8a869c] text-xs leading-[19.5px]">
               By signing in, you agree to our{" "}
             </span>
             <span className="font-sans font-medium text-[#563895] text-xs leading-[19.5px] mx-1 cursor-pointer hover:underline">
               Terms of Service
             </span>
             <span className="font-sans font-normal text-[#8a869c] text-xs leading-[19.5px]">
               and{" "}
             </span>
             <span className="font-sans font-medium text-[#563895] text-xs leading-[19.5px] mx-1 cursor-pointer hover:underline">
               Privacy Policy
             </span>
          </div>
        </div>
      </div>

      {/* Right panel - Decorative */}
      <div className="hidden lg:flex flex-col items-center justify-center relative flex-1 self-stretch z-0 bg-[#1a1726] overflow-hidden">
        {/* Radial gradient overlay */}
        <div className="absolute w-full h-full top-0 left-0" style={{ background: "radial-gradient(50% 50% at 50% 50%, rgba(86,56,149,0.15) 0%, rgba(86,56,149,0) 70%)" }} />
        
        {/* Large watermark "P" */}
        <div className="flex w-full h-full items-center justify-center absolute top-0 left-0 opacity-5 pointer-events-none select-none">
          <span className="font-display font-bold text-[#563895] text-[600px] leading-none ml-[-120px] tracking-[-0.05em]">
            P
          </span>
        </div>
        
        {/* Version label */}
        <div className="absolute right-8 bottom-8 opacity-20 select-none">
          <span className="font-display font-bold text-[#f8f9fa4c] text-base tracking-[1.60px] leading-6 whitespace-nowrap">
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
                  <span className="text-xl leading-none">{card.icon}</span>
                </div>
                {/* Card text */}
                <p className="font-sans font-medium text-[#f8f9fa] text-sm tracking-[0] leading-[17.5px] whitespace-pre-line">
                  {card.text}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

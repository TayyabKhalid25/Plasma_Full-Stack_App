import Link from "next/link";
import { Button } from "../components/ui/button";
import { Badge } from "../components/ui/badge";
import { Card, CardContent } from "../components/ui/card";

// Data
const pulseFeatures = [
  "Cross-platform activity aggregation",
  "Smart notifications for squad milestones",
  "One-click join for active sessions",
];

const omniLibraryFeatures = [
  "IGDB-powered game search",
  "Manual \"Now Playing\" broadcasts",
  "Cross-platform game shelf",
];

const prestigeFeatures = [
  "Rarity-weighted Plasma XP",
  "Hall of Fame trophy showcase",
  "Friends leaderboard",
];

const intentModes = [
  {
    title: "Competitive",
    description: "Locked in. No distractions. Ready for ranked\ngrinds and high-stakes tournament play.",
    barBg: "bg-[#dc262633]",
    barFill: "bg-red-600 shadow-[0px_0px_10px_#ef4444]",
    glowBg: "bg-[#dc26261a]",
    barTop: "top-[262px]",
  },
  {
    title: "Casual/Chill",
    description: "Just vibing. Open to talk, exploring new\nworlds, or completing daily quests at a\nrelaxed pace.",
    barBg: "bg-[#05966933]",
    barFill: "bg-emerald-600 shadow-[0px_0px_10px_#10b981]",
    glowBg: "bg-[#0596691a]",
    barTop: "top-[285px]",
  },
  {
    title: "LFG",
    description: "Looking for Group. Need more players for a\nspecific activity or just want to find new\nteammates.",
    barBg: "bg-[#ca8a0433]",
    barFill: "bg-yellow-600 shadow-[0px_0px_10px_#f59e0b]",
    glowBg: "bg-[#ca8a041a]",
    barTop: "top-[285px]",
  },
];

const avatarColors = ["bg-slate-500", "bg-slate-600", "bg-slate-700"];

const TopNavBarSubsection = () => {
  return (
    <nav className="flex w-full h-[72px] items-center justify-center z-50 bg-[#0d0b14cc] backdrop-blur-[6px] sticky top-0 border-b border-white/5">
      <div className="flex max-w-screen-xl items-center justify-between px-8 py-0 w-full">
        {/* Logo area */}
        <div className="inline-flex flex-col items-start flex-[0_0_auto]">
          <div className="text-3xl font-bold text-white font-display tracking-[0.15em] hover:text-plasma-primary transition-colors cursor-pointer">
            PLASMA
          </div>
        </div>
        
        {/* Navigation actions */}
        <div className="inline-flex items-center gap-2 flex-[0_0_auto]">
          {/* Sign In link */}
          <Link
            href="/login"
            className="inline-flex flex-col justify-center items-center flex-[0_0_auto] px-4 py-2 hover:opacity-80 transition-opacity"
          >
            <span className="flex items-center justify-center font-sans font-medium text-[#8a869c] text-sm text-center tracking-[0] leading-5 whitespace-nowrap hover:text-white transition-colors">
              Sign In
            </span>
          </Link>
          
          {/* Get Started button */}
          <div className="inline-flex flex-col items-start flex-[0_0_auto]">
            <Button
              asChild
              className="inline-flex flex-col justify-center px-6 py-5 rounded-full shadow-[0px_0px_20px_#5638954c] bg-primary-gradient items-center flex-[0_0_auto] h-auto border-0 focus-visible:ring-0 hover:opacity-90 transition-all hover:scale-[1.02]"
            >
              <Link href="/sign-up">
                <span className="flex items-center justify-center font-sans font-bold text-white text-sm text-center tracking-[0] leading-5 whitespace-nowrap pt-[2px]">
                  Get Started
                </span>
              </Link>
            </Button>
          </div>
        </div>
      </div>
    </nav>
  );
};

const MainSubsection = () => {
  return (
    <div className="pt-8 pb-0 px-0 z-0 bg-transparent flex flex-col items-center gap-24 relative self-stretch w-full overflow-hidden">
      <div className="pt-8 pb-32 px-0 flex flex-col items-center gap-24 relative self-stretch w-full">
        
        {/* - Hero Section - */}
        <section className="flex max-w-screen-xl items-center justify-center px-8 relative w-full pt-12">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 w-full max-w-[1216px]">
            {/* Left: headline + CTA */}
            <div className="flex flex-col items-start gap-8 self-center z-10">
              <Badge
                variant="outline"
                className="px-4 py-1.5 bg-[#ff2a7a1a] border-[#ff2a7a33] rounded-full text-plasma-secondary text-xs tracking-[1.80px] font-sans font-semibold h-auto"
              >
                THE SECOND SCREEN FOR GAMERS
              </Badge>
              <h1 className="font-display font-bold text-[#f8f9fa] text-5xl md:text-6xl lg:text-[72px] leading-[1.05] self-stretch tracking-[-0.02em]">
                Know what your squad<br />is up to. Always.
              </h1>
              <p className="font-sans font-normal text-[#8a869c] text-lg leading-[29.2px] max-w-xl">
                Plasma is a social layer that sits above your game launchers.
                See live activity, schedule sessions, track achievements, and never miss a gaming moment with your friends.
              </p>
              <div className="flex items-start gap-4 pt-4 self-stretch">
                <Link
                  href="/sign-up"
                  className="inline-flex px-8 py-4 rounded-full shadow-[0px_0px_30px_#ff2a7a33] bg-[linear-gradient(12deg,rgba(86,56,149,1)_0%,rgba(255,42,122,1)_100%)] items-center font-sans font-bold text-white text-base text-center leading-6 whitespace-nowrap hover:scale-[1.05] transition-transform"
                >
                  Get Started
                </Link>
              </div>
              <div className="flex items-center pt-6 self-stretch">
                <div className="inline-flex flex-col items-start px-4 py-1.5 bg-[#56389533] rounded-full border border-solid border-[#5638954c]">
                  <span className="font-sans font-semibold text-plasma-secondary text-xs leading-4 whitespace-nowrap">
                    +12K PLAYERS ONLINE
                  </span>
                </div>
              </div>
            </div>
            
            {/* Right: dashboard preview card */}
            <div className="relative flex flex-col items-start self-center pl-[26px] pr-0 pt-[17px] pb-[11px] lg:scale-110 xl:scale-125 z-0 lg:ml-8 mt-16 lg:mt-0">
              <div className="absolute w-[calc(100%_+_80px)] h-[calc(100%_+_80px)] -top-10 -left-10 bg-[#ff2a7a1a] rounded-full blur-[50px] opacity-70" />
              <div className="flex flex-col w-full items-center gap-[22px] pl-[13px] pr-[18px] pt-[14px] pb-[72px] relative bg-[#1a1726]/90 backdrop-blur-xl rounded-[48px] overflow-hidden border border-solid border-[#ffffff1a] rotate-[1.34deg] shadow-[-20px_20px_50px_#56389533]">
                {/* Dashboard header */}
                <div className="relative w-full h-[14px]">
                  <span className="absolute top-0 right-0 font-sans font-semibold text-[#8a869c] text-[10px] tracking-[1.00px] leading-[15px] whitespace-nowrap">
                    THE PULSE DASHBOARD
                  </span>
                </div>
                {/* Dashboard rows */}
                <div className="flex flex-col items-center gap-[15px] relative self-stretch w-full">
                  
                  {/* Row 1 - active/live */}
                  <div className="relative w-full h-[76px] bg-[#1a172699] rounded-[32px] border border-solid border-[#f8f9fa1a] backdrop-blur [-webkit-backdrop-filter:blur(8px)_brightness(100%)] shadow-lg hover:-translate-y-1 transition-transform cursor-pointer">
                    <div className="flex w-[43px] h-11 items-center justify-center absolute top-[calc(50%_-_22px)] left-[15px] rounded-2xl bg-[linear-gradient(131deg,rgba(99,102,241,1)_0%,rgba(147,51,234,1)_100%)]">
                      <span className="text-white text-xl leading-6">🎮</span>
                    </div>
                    <div className="flex flex-col gap-[8px] absolute top-[23px] left-[71px] right-16">
                      <div className="w-[89px] h-[7px] bg-[#ffffff33] rounded-2xl" />
                      <div className="w-[120px] h-[7px] bg-[#ffffff1a] rounded-2xl mt-1.5" />
                    </div>
                    <div className="absolute top-[15px] right-[15px]">
                      <div className="flex items-center px-[9px] py-[4px] bg-[#ff2a7a33] rounded-2xl">
                        <span className="font-sans font-bold text-[#ff2a7a] text-[9px] leading-3 whitespace-nowrap pt-[1px]">
                          LIVE
                        </span>
                      </div>
                    </div>
                  </div>
                  
                  {/* Row 2 - opacity 80 */}
                  <div className="flex w-full items-center pl-[14px] pr-[18px] pt-[15px] pb-[15px] bg-[#1a172699] rounded-[32px] border border-solid border-[#f8f9fa1a] backdrop-blur [-webkit-backdrop-filter:blur(8px)_brightness(100%)] opacity-80 shadow-lg">
                    <div className="flex w-[43px] h-[45px] items-center justify-center rounded-2xl bg-[linear-gradient(130deg,rgba(251,146,60,1)_0%,rgba(220,38,38,1)_100%)] shrink-0">
                      <span className="text-white text-xl leading-6">🛡️</span>
                    </div>
                    <div className="flex flex-col gap-[8px] pl-[17px] flex-1">
                      <div className="w-[105px] h-[7px] bg-[#ffffff33] rounded-2xl" />
                      <div className="w-[75px] h-[7px] bg-[#ffffff1a] rounded-2xl mt-1.5" />
                    </div>
                  </div>
                  
                  {/* Row 3 - opacity 60 */}
                  <div className="relative w-full h-[78px] bg-[#1a172699] rounded-[32px] border border-solid border-[#f8f9fa1a] backdrop-blur [-webkit-backdrop-filter:blur(8px)_brightness(100%)] opacity-60 shadow-lg">
                    <div className="flex w-[43px] h-[46px] items-center justify-center absolute top-[calc(50%_-_23px)] left-[15px] rounded-2xl bg-[linear-gradient(130deg,rgba(52,211,153,1)_0%,rgba(13,148,136,1)_100%)]">
                      <span className="text-white text-xl leading-6">🌍</span>
                    </div>
                    <div className="flex flex-col gap-[8px] absolute top-[26px] left-[71px] right-4">
                      <div className="w-[122px] h-[7px] bg-[#ffffff33] rounded-2xl" />
                      <div className="w-[60px] h-[7px] bg-[#ffffff1a] rounded-2xl mt-1.5" />
                    </div>
                  </div>
                  
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* - The Pulse Section - */}
        <section className="grid grid-cols-1 lg:grid-cols-2 w-full max-w-[1216px] px-8 gap-20 pt-16">
          {/* Left: text */}
          <div className="flex flex-col items-start gap-6 self-center">
            <span className="font-sans font-bold text-plasma-secondary text-sm tracking-[1.40px] leading-5 whitespace-nowrap">
              THE PULSE
            </span>
            <h2 className="font-display font-bold text-[#f8f9fa] text-4xl md:text-5xl leading-[1.1] self-stretch">
              Your Squad&apos;s Unified Activity Feed
            </h2>
            <p className="font-sans font-normal text-[#8a869c] text-lg leading-[29.2px] self-stretch">
              Real-time Steam activity, all in one place. The Pulse shows
              who&apos;s playing what—no clutter, no switching tabs.
            </p>
            <div className="flex flex-col items-start gap-4 pt-4 self-stretch">
              {pulseFeatures.map((feature, i) => (
                <div key={i} className="flex items-center self-stretch">
                  <div className="w-8 h-8 rounded-full bg-[#ff2a7a1a] border border-[#ff2a7a33] flex items-center justify-center shrink-0">
                    <span className="text-plasma-secondary text-sm">✓</span>
                  </div>
                  <span className="pl-4 font-sans font-medium text-[#f8f9fa] text-base leading-6 whitespace-nowrap">
                    {feature}
                  </span>
                </div>
              ))}
            </div>
          </div>
          
          {/* Right: live card */}
          <div className="relative flex flex-col items-start self-center w-full max-w-[500px] lg:max-w-none mx-auto">
            <div className="absolute w-[calc(100%_+_32px)] h-[calc(100%_+_32px)] -top-4 -left-4 rounded-2xl blur-[20px] bg-[linear-gradient(19deg,rgba(86,56,149,0.3)_0%,rgba(255,42,122,0.3)_100%)] opacity-50" />
            <Card className="relative self-stretch w-full bg-[#1a172699] rounded-2xl overflow-hidden border border-solid border-[#ffffff1a] shadow-[0px_25px_50px_-12px_#00000040] backdrop-blur [-webkit-backdrop-filter:blur(8px)_brightness(100%)] min-h-[300px]">
              <CardContent className="p-0">
                <div className="relative w-full h-[317px] opacity-80 bg-gradient-to-b from-[#28243D] to-[#0d0b14]" />
                <div className="absolute inset-0 bg-[linear-gradient(0deg,rgba(13,11,20,1)_0%,rgba(13,11,20,0)_100%)]" />
                <div className="flex flex-col w-[calc(100%_-_50px)] items-start p-4 absolute left-[25px] bottom-[25px] bg-[#1a172699] rounded-[48px] border border-solid border-[#f8f9fa1a] backdrop-blur [-webkit-backdrop-filter:blur(8px)_brightness(100%)]">
                  <div className="flex items-center self-stretch">
                    <div className="w-2.5 h-2.5 bg-plasma-success shadow-[0px_0px_10px_#2ECC71] rounded-full shrink-0" />
                    <span className="pl-4 font-sans font-semibold text-[#f8f9fa] text-xs sm:text-sm tracking-[1.20px] leading-4 whitespace-nowrap overflow-hidden text-ellipsis">
                      LIVE: ZEPHYR IS PLAYING CS 2
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </section>

        {/* - The Rally Section - */}
        <section className="grid grid-cols-1 lg:grid-cols-2 w-full max-w-[1216px] px-8 gap-20 pt-24">
          {/* Left: rally card */}
          <div className="relative flex flex-col items-start self-center order-2 lg:order-1 w-full max-w-[400px] lg:max-w-none mx-auto">
            <div className="bg-[linear-gradient(203deg,rgba(255,42,122,0.3)_0%,rgba(86,56,149,0.3)_100%)] absolute w-[calc(100%_+_32px)] h-[calc(100%_+_32px)] -top-4 -left-4 rounded-2xl blur-[20px] opacity-50" />
            <Card className="relative self-stretch w-full bg-[#1a172699] rounded-2xl border border-solid border-[#ffffff1a] backdrop-blur [-webkit-backdrop-filter:blur(8px)_brightness(100%)] shadow-2xl">
              <CardContent className="flex flex-col items-center p-8">
                {/* Calendar icon placeholder */}
                <div className="w-[104px] h-[104px] rounded-3xl bg-[linear-gradient(135deg,rgba(86,56,149,1)_0%,rgba(255,42,122,1)_100%)] flex items-center justify-center shadow-lg">
                  <span className="font-thin text-white text-5xl">📅</span>
                </div>
                <div className="flex flex-col items-center gap-2 pt-6">
                  <h3 className="font-display font-bold text-[#f8f9fa] text-2xl text-center leading-8 whitespace-nowrap">
                    Friday Night Raids
                  </h3>
                  <p className="font-sans font-normal text-[#8a869c] text-sm text-center leading-5 whitespace-nowrap">
                    Scheduled for Friday, 8:00 PM
                  </p>
                </div>
                {/* Avatars */}
                <div className="flex items-start pt-6">
                  {avatarColors.map((color, i) => (
                    <div
                      key={i}
                      className={`w-10 h-10 ${color} rounded-full border-2 border-solid border-[#1a1726] ${i > 0 ? "-ml-2" : ""}`}
                    />
                  ))}
                  <div className="flex w-10 h-10 items-center justify-center -ml-2 bg-[#1a172699] rounded-full border-2 border-solid border-[#1a1726] backdrop-blur [-webkit-backdrop-filter:blur(8px)_brightness(100%)]">
                    <span className="font-sans font-bold text-[#f8f9fa] text-[10px] text-center leading-[15px] whitespace-nowrap">
                      +5
                    </span>
                  </div>
                </div>
                {/* RSVP button */}
                <div className="flex flex-col items-center pt-8 self-stretch">
                  <div className="flex flex-col justify-center px-0 py-3 self-stretch bg-plasma-success/15 border border-plasma-success/30 rounded-[32px] items-center text-plasma-success shadow-[0_0_15px_rgba(46,204,113,0.15)]">
                    <span className="font-sans font-bold text-plasma-success text-sm text-center tracking-[1.40px] leading-5 whitespace-nowrap">
                      RSVP CONFIRMED
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
          
          {/* Right: text */}
          <div className="flex flex-col items-start gap-6 self-center order-1 lg:order-2">
            <span className="font-sans font-bold text-plasma-primary text-sm tracking-[1.40px] leading-5 whitespace-nowrap">
              THE RALLY
            </span>
            <h2 className="font-display font-bold text-[#f8f9fa] text-4xl md:text-5xl leading-[1.1] self-stretch">
              Never ask <br className="hidden lg:block"/>&quot;when are you free?&quot; again.
            </h2>
            <p className="font-sans font-normal text-[#8a869c] text-lg leading-[29.2px] self-stretch">
              The Rally is your dedicated scheduling engine. Coordinate
              timezones, set roles for the raid, and sync RSVPs directly to your
              mobile device.
            </p>
            <div className="grid grid-cols-2 gap-6 pt-6 self-stretch">
              <div className="flex flex-col items-start gap-2">
                <span className="font-display font-bold text-white text-xl leading-7 whitespace-nowrap">
                  Smart Sync
                </span>
                <p className="font-sans font-normal text-[#8a869c] text-sm leading-5">
                  Auto-detect timezones and find the perfect overlap for your squad.
                </p>
              </div>
              <div className="flex flex-col items-start gap-2">
                <span className="font-display font-bold text-white text-xl leading-7 whitespace-nowrap">
                  Role Drafting
                </span>
                <p className="font-sans font-normal text-[#8a869c] text-sm leading-5">
                  Assign Healers, Tanks, and DPS before the lobby even opens.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* - The Omni-Library Section - */}
        <section className="grid grid-cols-1 lg:grid-cols-2 w-full max-w-[1216px] px-8 gap-20 pt-24">
          {/* Left: text */}
          <div className="flex flex-col items-start gap-6 self-center">
            <span className="font-sans font-bold text-plasma-secondary text-xs tracking-[1.20px] leading-[18px]">
              THE OMNI-LIBRARY
            </span>
            <h2 className="font-display font-bold text-[#f8f9fa] text-4xl md:text-5xl leading-[1.1] self-stretch">
              Track Every Game You Play
            </h2>
            <p className="font-sans font-normal text-[#8a869c] text-lg leading-[29.2px] max-w-[440px]">
              Consolidate your entire collection. From Steam classics to
              non-Steam gems, Plasma&apos;s IGDB integration keeps your virtual
              shelf complete.
            </p>
            <div className="flex flex-col items-start gap-4 pt-4 self-stretch">
              {omniLibraryFeatures.map((feature, i) => (
                <div key={i} className="flex items-center self-stretch">
                  <div className="w-8 h-8 rounded-full bg-[#ff2a7a1a] border border-[#ff2a7a33] flex items-center justify-center shrink-0">
                    <span className="text-plasma-secondary text-sm">✓</span>
                  </div>
                  <span className="pl-4 font-sans font-medium text-[#f8f9fa] text-base leading-6 whitespace-nowrap">
                    {feature}
                  </span>
                </div>
              ))}
            </div>
          </div>
          
          {/* Right: placeholder visual */}
          <div className="relative flex flex-col items-start self-center w-full max-w-[500px] lg:max-w-none mx-auto">
            <div className="absolute w-[calc(100%_+_32px)] h-[calc(100%_+_32px)] -top-4 -left-4 rounded-2xl blur-[20px] bg-[linear-gradient(19deg,rgba(86,56,149,0.3)_0%,rgba(255,42,122,0.3)_100%)] opacity-50" />
            <Card className="relative self-stretch w-full bg-[#1a172699] rounded-2xl border border-solid border-[#ffffff1a] backdrop-blur [-webkit-backdrop-filter:blur(8px)_brightness(100%)]">
              <CardContent className="p-8">
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-6">
                  {[1, 2, 3, 4, 5, 6].map((n) => (
                    <div
                      key={n}
                      className={`h-[140px] bg-[#ffffff0d] rounded-2xl border border-solid border-[#ffffff1a] hover:bg-[#ffffff1a] transition-colors ${n === 1 ? 'bg-gradient-to-b from-[#563895]/50 to-transparent' : ''}`}
                    />
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </section>

        {/* - The Prestige Section - */}
        <section className="grid grid-cols-1 lg:grid-cols-2 w-full max-w-[1216px] px-8 gap-20 pt-24">
          {/* Left: achievements card */}
          <div className="relative flex flex-col items-start self-center order-2 lg:order-1 w-full max-w-[500px] lg:max-w-none mx-auto">
            <div className="bg-[linear-gradient(196deg,rgba(255,42,122,0.3)_0%,rgba(86,56,149,0.3)_100%)] absolute w-[calc(100%_+_32px)] h-[calc(100%_+_32px)] -top-4 -left-4 rounded-2xl blur-[20px] opacity-50" />
            <Card className="relative self-stretch w-full bg-[#1a172699] rounded-2xl border border-solid border-[#ffffff1a] backdrop-blur [-webkit-backdrop-filter:blur(8px)_brightness(100%)]">
              <CardContent className="flex flex-col items-start gap-8 p-8">
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 w-full">
                  {/* First achievement cell */}
                  <div className="relative w-full h-[113.5px] flex items-center justify-center bg-[#1a172699] rounded-3xl border border-solid border-plasma-secondary/50 backdrop-blur shadow-[0px_0px_20px_#ff2a7a33]">
                    <span className="font-thin text-[#ff2a7a] text-4xl">🏅</span>
                  </div>
                  {/* Remaining 3 achievement cells */}
                  {[2, 3, 4].map((n) => (
                    <div
                      key={n}
                      className="w-full h-[113.5px] bg-[#1a1726]/50 rounded-3xl border border-solid border-[#f8f9fa1a] flex items-center justify-center transition-colors hover:bg-[#ffffff1a]"
                    >
                      <span className="font-thin text-[#ffffff33] text-4xl">🔒</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
          
          {/* Right: text */}
          <div className="flex flex-col items-start gap-6 self-center order-1 lg:order-2">
            <span className="font-sans font-bold text-plasma-primary text-xs tracking-[1.20px] leading-[18px]">
              THE PRESTIGE
            </span>
            <h2 className="font-display font-bold text-[#f8f9fa] text-4xl md:text-5xl leading-[1.1] self-stretch">
              Your Achievements, Gamified
            </h2>
            <p className="font-sans font-normal text-[#8a869c] text-lg leading-[29.2px] max-w-[440px]">
              Turn every trophy into progress. Earn Plasma XP based on
              achievement rarity and climb the global leaderboards.
            </p>
            <div className="flex flex-col items-start gap-4 pt-4 self-stretch">
              {prestigeFeatures.map((feature, i) => (
                <div key={i} className="flex items-center self-stretch">
                  <div className="w-8 h-8 rounded-full bg-[#ff2a7a1a] border border-[#ff2a7a33] flex items-center justify-center shrink-0">
                    <span className="text-[#ff2a7a] text-sm">✓</span>
                  </div>
                  <span className="pl-4 font-sans font-medium text-[#f8f9fa] text-base leading-6 whitespace-nowrap">
                    {feature}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* - Intent Mode Section - */}
        <section className="flex flex-col items-start px-0 pt-32 pb-24 relative self-stretch w-full bg-[#1a1726]/30 border-y border-[#ffffff0a] mt-24">
          <div className="flex flex-col max-w-screen-xl items-center gap-16 px-8 py-0 relative w-full mx-auto">
            {/* Section header */}
            <div className="flex flex-col max-w-2xl w-full items-center gap-4">
              <h2 className="font-display font-bold text-[#f8f9fa] text-4xl md:text-5xl text-center leading-[1.1] self-stretch">
                Set Your Intent Mode
              </h2>
              <p className="font-sans font-normal text-[#8a869c] text-lg text-center leading-7 self-stretch mt-4">
                Communication without the noise. Set your Intent Mode to let
                your friends know exactly what you&apos;re looking for without
                typing a word.
              </p>
            </div>
            
            {/* Intent mode cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 w-full">
              {intentModes.map((mode, i) => (
                <div
                  key={i}
                  className="relative w-full h-[330px] bg-[#1a172699] rounded-3xl overflow-hidden border border-solid border-[#ffffff1a] backdrop-blur hover:-translate-y-2 transition-transform shadow-lg cursor-pointer"
                >
                  {/* Glow top-right */}
                  <div className={`${mode.glowBg} absolute top-[-39px] right-[-39px] w-32 h-32 rounded-full blur-[32px]`} />
                  
                  {/* Icon placeholder */}
                  <div className="absolute top-[41px] left-[41px] w-16 h-16 bg-[#ffffff0d] rounded-2xl border border-solid border-[#ffffff1a] flex items-center justify-center shadow-inner">
                    <span className="font-thin text-white text-3xl">
                      {i === 0 ? "🔥" : i === 1 ? "☕" : "🤝"}
                    </span>
                  </div>
                  
                  {/* Title */}
                  <div className="w-[calc(100%_-_82px)] items-start absolute top-[137px] left-[41px] flex flex-col">
                    <span className="font-display font-bold text-[#f8f9fa] text-3xl leading-8 whitespace-nowrap">
                      {mode.title}
                    </span>
                  </div>
                  
                  {/* Description */}
                  <div className="flex flex-col w-[calc(100%_-_82px)] items-start absolute top-[184px] left-[41px]">
                    <p className="font-sans font-normal text-[#8a869c] text-sm leading-[22px] whitespace-pre-line">
                      {mode.description}
                    </p>
                  </div>
                  
                  {/* Progress bar */}
                  <div className={`flex flex-col w-[calc(100%_-_82px)] h-1.5 items-start justify-center absolute ${mode.barTop} left-[41px] ${mode.barBg} rounded-full overflow-hidden`}>
                    <div className={`relative flex-[0.7] self-stretch w-full ${mode.barFill} rounded-full`} />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
        
        {/* - CTA Section - */}
        <section className="flex flex-col max-w-4xl w-[90%] lg:w-full items-start pt-24 pb-20 px-8 md:px-16 relative bg-[#1a172699] rounded-3xl overflow-hidden border border-solid border-[#ffffff1a] backdrop-blur [-webkit-backdrop-filter:blur(8px)_brightness(100%)] mx-auto mt-16 shadow-[0px_40px_100px_rgba(86,56,149,0.2)]">
          {/* Subtle gradient overlay */}
          <div className="absolute inset-0 bg-[linear-gradient(27deg,rgba(86,56,149,1)_0%,rgba(255,42,122,1)_100%)] opacity-10" />
          <div className="flex flex-col items-center gap-8 relative self-stretch w-full z-10">
            <h2 className="font-display font-bold text-[#f8f9fa] text-4xl md:text-5xl text-center leading-[1.1] self-stretch tracking-[-0.02em]">
              Your Squad is Already Playing.<br />Are You In?
            </h2>
            <p className="font-sans font-normal text-[#8a869c] text-xl text-center leading-7 max-w-2xl">
              Join Plasma - it&apos;s free. Connect your accounts and see the
              difference a dedicated second screen makes.
            </p>
            <div className="flex flex-col items-center pt-8 self-stretch">
              <Link
                href="/sign-up"
                className="flex w-auto px-12 py-5 rounded-full shadow-[0px_0px_40px_#ff2a7a4c] bg-primary-gradient items-center justify-center hover:scale-[1.05] transition-transform"
              >
                <span className="font-sans font-bold text-white text-lg text-center leading-7 whitespace-nowrap">
                  Get Started Now
                </span>
              </Link>
            </div>
          </div>
        </section>
      </div>
      
      {/* - Footer - */}
      <footer className="flex flex-col w-full items-center bg-[#0d0b14] border-t border-[#ffffff0d] z-10">
        <div className="flex flex-col max-w-screen-xl items-start gap-16 px-8 py-12 relative w-full">
          <div className="flex items-center justify-between relative self-stretch w-full">
            <span className="font-sans font-normal text-[#8a869c] text-sm leading-4 whitespace-nowrap">
              © 2026 Plasma Network. All rights reserved.
            </span>
            <span className="font-display font-black text-[#ffffff33] text-[12px] tracking-[2.00px] leading-[15px] whitespace-nowrap">
              POWERED BY IGDB & STEAMWORKS
            </span>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default function HeroPage() {
  return (
    <div className="flex flex-col w-full min-h-screen items-start relative selection:bg-plasma-primary selection:text-white" style={{ background: "radial-gradient(50% 50% at 50% 50%, rgba(86,56,149,0.2) 0%, rgba(13,11,20,1) 50%)" }}>
      <TopNavBarSubsection />
      <MainSubsection />
    </div>
  );
}

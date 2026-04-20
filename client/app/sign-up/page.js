"use client";

import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { CalendarIcon, Gamepad2, Calendar, Trophy, AlertCircle } from "lucide-react";
import { Button } from "../../components/ui/button";
import { Input } from "../../components/ui/input";
import { Label } from "../../components/ui/label";
import { useAuth } from "@/context/AuthContext";

// Removed hardcoded grid fields since we need controlled inputs

const SectionLeftSideSubsection = () => {
  const [formData, setFormData] = useState({
    username: "",
    email: "",
    steamID: ""
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const { login } = useAuth();
  const router = useRouter();

  const handleInputChange = (e) => {
    const { id, value } = e.target;
    setFormData((prev) => ({ ...prev, [id]: value }));
  };

  const handleSignUp = async (e) => {
    e.preventDefault();
    if (!formData.username || !formData.steamID) {
      setError("Please fill in Username and Steam ID");
      return;
    }

    try {
      setLoading(true);
      setError(null);
      // We use the dev-login endpoint which creates an account if it doesn't exist
      await login(formData.username, formData.steamID);
      router.push("/pulse");
    } catch (err) {
      setError(err.message || "Failed to create account");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col items-center justify-center px-6 py-12 flex-1 self-stretch grow z-[1] bg-plasma-bg">
      <div className="flex flex-col max-w-[460px] w-full items-start">
        {/* Logo area */}
        <div className="inline-flex flex-col items-start pt-8 pb-0 px-0">
          <Image src="/lockup.svg" alt="Plasma" width={150} height={32} className="h-8 w-auto brightness-0 invert" priority />
        </div>
        
        {/* Main content area */}
        <div className="flex flex-col items-start justify-between pl-0 pr-10 py-10 self-stretch w-full gap-6">
          {/* Heading section */}
          <div className="pt-6 pb-0 px-0 flex flex-col items-start self-stretch w-full gap-1">
            <h1 className="font-display font-bold text-plasma-text-heading text-[32px] tracking-[0] leading-8 self-stretch">
              Create Your Account
            </h1>
            <p className="font-sans font-medium text-plasma-text-muted text-sm tracking-[0] leading-5 self-stretch">
              Join the squad and sync your Steam library in seconds.
            </p>
          </div>
          
          {/* Form section */}
          <form onSubmit={handleSignUp} className="pt-6 pb-4 px-0 flex flex-col items-start self-stretch w-full">
            <div className="flex flex-col gap-4 self-stretch w-full">
              {error && (
                <div className="flex items-center gap-2 p-3 bg-plasma-error/10 border border-plasma-error/30 rounded-xl text-plasma-error text-sm">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <p>{error}</p>
                </div>
              )}

              <div className="grid grid-cols-2 gap-4 w-full">
                <div className="flex flex-col gap-1.5 w-full">
                  <Label htmlFor="username" className="font-sans font-medium text-plasma-text-muted text-[13px] leading-[19.5px] whitespace-nowrap pl-1">
                    Username
                  </Label>
                  <Input
                    id="username"
                    value={formData.username}
                    onChange={handleInputChange}
                    placeholder="pro_gamer"
                    className="bg-plasma-slate/50 text-white rounded-xl border border-solid border-plasma-text-muted/25 font-sans font-normal text-sm leading-normal placeholder:text-plasma-text-muted/40 py-[11px] px-4 min-h-[44px] transition-all focus-visible:border-plasma-primary"
                  />
                </div>
                <div className="flex flex-col gap-1.5 w-full">
                  <Label htmlFor="email" className="font-sans font-medium text-plasma-text-muted text-[13px] leading-[19.5px] whitespace-nowrap pl-1">
                    Email Address
                  </Label>
                  <Input
                    id="email"
                    type="email"
                    value={formData.email}
                    onChange={handleInputChange}
                    placeholder="name@example.com"
                    className="bg-plasma-slate/50 text-white rounded-xl border border-solid border-plasma-text-muted/25 font-sans font-normal text-sm leading-normal placeholder:text-plasma-text-muted/40 py-[11px] px-4 min-h-[44px] transition-all focus-visible:border-plasma-primary"
                  />
                </div>
              </div>

              <div className="flex flex-col gap-1.5 w-full">
                <Label htmlFor="steamID" className="font-sans font-medium text-plasma-text-muted text-[13px] leading-[19.5px] whitespace-nowrap pl-1">
                  Steam ID64 (Dev Account Creation)
                </Label>
                <Input
                  id="steamID"
                  value={formData.steamID}
                  onChange={handleInputChange}
                  placeholder="76561198..."
                  className="bg-plasma-slate/50 text-white rounded-xl border border-solid border-plasma-text-muted/25 font-sans font-normal text-sm leading-normal placeholder:text-plasma-text-muted/40 py-[11px] px-4 min-h-[44px] transition-all focus-visible:border-plasma-primary"
                />
              </div>
              
              {/* Submit button */}
              <Button 
                type="submit"
                disabled={loading}
                className="relative flex items-center justify-center px-0 py-6 mt-4 self-stretch w-full rounded-[32px] bg-primary-gradient shadow-card-glow font-sans font-bold text-white text-base text-center leading-6 whitespace-nowrap h-auto border-0 focus-visible:ring-0 hover:opacity-90 transition-all hover:scale-[1.02] disabled:opacity-70 disabled:cursor-not-allowed"
              >
                {loading ? "Creating Account..." : "Create Account"}
              </Button>
            </div>
            
            {/* Footer */}
            <footer className="flex flex-col items-center gap-3 pt-8 pb-0 px-0 self-stretch w-full bg-transparent">
              <div className="flex flex-col items-center self-stretch w-full">
                <Link
                  href="/login"
                  className="flex items-center justify-center font-sans font-normal text-[13px] text-center tracking-[0] leading-[19.5px] gap-1.5"
                >
                  <span className="text-plasma-text-muted">Already have an account?</span>
                  <span className="text-plasma-secondary hover:text-plasma-primary font-medium transition-colors">Sign In</span>
                </Link>
              </div>
              <div className="flex flex-col max-w-[280px] w-full items-center opacity-60">
                <p className="font-sans font-normal text-plasma-text-muted text-[11px] text-center tracking-[0] leading-[17.9px]">
                  <span>By joining, you agree to our </span>
                  <span className="underline cursor-pointer hover:text-white transition-colors">Terms</span>
                  <span> and </span>
                  <span className="underline cursor-pointer hover:text-white transition-colors">Privacy Policy</span>
                  <span>.</span>
                </p>
              </div>
            </footer>
          </form>
        </div>
      </div>
    </div>
  );
};

const SectionRightSideSubsection = () => {
  return (
    <div className="hidden lg:flex flex-col items-center justify-center relative flex-1 self-stretch grow z-0 bg-plasma-slate overflow-hidden">
      {/* Radial gradient background overlay */}
      <div className="absolute w-full h-full top-0 left-0" style={{ background: "radial-gradient(50% 50% at 50% 50%, rgba(86,56,149,0.15) 0%, rgba(86,56,149,0) 70%)" }} />
      
      {/* Large background Logo */}
      <div className="flex w-full h-full items-center justify-center absolute top-0 left-0 opacity-5 pointer-events-none select-none">
        <svg 
          xmlns="http://www.w3.org/2000/svg" 
          viewBox="0 0 394.31 468"
          className="w-[600px] h-auto ml-[-120px] text-plasma-primary"
          fill="currentColor"
        >
          <polygon points="0 0 0 99.37 96.23 99.37 100.17 99.37 292.56 99.37 292.56 241.68 197.16 241.68 197.16 331.59 197.16 331.98 197.16 338.66 297.59 338.66 299.5 336.34 394.31 241.86 394.31 0 0 0"/>
          <polygon points="100.17 273.23 100.17 265.82 100.17 130.93 96.23 130.93 0 226.82 0 350.71 0 375.33 0 468 170.22 467.27 265.79 370.81 100.17 370.21 100.17 273.23"/>
        </svg>
      </div>
      
      {/* Bottom-right watermark */}
      <div className="inline-flex flex-col items-start absolute right-8 bottom-8 opacity-20 pointer-events-none select-none">
        <div className="flex items-center w-[196px] h-6 font-display font-bold text-plasma-text-primary/30 text-base tracking-[1.60px] leading-6 whitespace-nowrap relative mt-[-1.00px]">
          NEON OBSERVATORY v2.4
        </div>
      </div>
      
      {/* Feature cards container */}
      <div className="flex flex-col items-center gap-8 relative self-stretch w-full flex-[0_0_auto] z-10 scale-90 xl:scale-100 pb-16">
        
        {/* Card 1: Squad live activity */}
        <div className="flex max-w-[280px] w-[280px] items-center gap-4 p-6 relative flex-[0_0_auto] bg-[#1a172699] rounded-2xl border border-solid border-white/10 backdrop-blur-md shadow-2xl transition-transform hover:-translate-y-1">
          <div className="flex w-10 h-10 items-center justify-center relative bg-[#ffb1c133] rounded-full shrink-0">
            <Gamepad2 className="w-5 h-5 text-[#ffb1c1]" />
          </div>
          <div className="inline-flex flex-col items-start relative flex-[0_0_auto]">
            <p className="font-sans font-medium text-plasma-text-primary text-sm tracking-[0] leading-[17.5px] relative mt-[-1.00px]">
              See your squad&apos;s live
              <br />
              activity
            </p>
          </div>
        </div>
        
        {/* Card 2: Schedule gaming sessions (offset right) */}
        <div className="flex flex-col max-w-[328px] w-[328px] items-start pl-12 pr-0 py-0 relative flex-[0_0_auto]">
          <div className="flex max-w-[280px] items-center gap-4 p-6 relative w-full flex-[0_0_auto] bg-[#1a172699] rounded-2xl border border-solid border-white/10 backdrop-blur-md shadow-2xl transition-transform hover:-translate-y-1">
            <div className="bg-[#d1bcff33] flex w-10 h-10 items-center justify-center relative rounded-full shrink-0">
              <Calendar className="w-5 h-5 text-[#d1bcff]" />
            </div>
            <div className="inline-flex flex-col items-start relative flex-[0_0_auto]">
              <p className="font-sans font-medium text-plasma-text-primary text-sm tracking-[0] leading-[17.5px] relative mt-[-1.00px]">
                Schedule gaming
                <br />
                sessions effortlessly
              </p>
            </div>
          </div>
        </div>
        
        {/* Card 3: Track achievements (offset left) */}
        <div className="relative max-w-[280px] w-[280px] h-[90px] -left-6">
          <div className="flex max-w-[280px] w-full items-center gap-4 p-6 relative bg-[#1a172699] rounded-2xl border border-solid border-white/10 backdrop-blur-md shadow-2xl transition-transform hover:-translate-y-1">
            <div className="bg-[#e4046833] flex w-10 h-10 items-center justify-center relative rounded-full shrink-0">
              <Trophy className="w-5 h-5 text-[#e40468]" />
            </div>
            <div className="inline-flex flex-col items-start relative flex-[0_0_auto]">
              <p className="font-sans font-medium text-plasma-text-primary text-sm tracking-[0] leading-[17.5px] relative mt-[-1.00px]">
                Track achievements
                <br />
                across all platforms
              </p>
            </div>
          </div>
        </div>
        
      </div>
    </div>
  );
};

// Sign Up screen — /sign-up route
export default function SignUpPage() {
  return (
    <main className="flex min-h-screen w-full flex-col lg:flex-row bg-plasma-bg overflow-hidden selection:bg-plasma-primary selection:text-white">
      <SectionLeftSideSubsection />
      <SectionRightSideSubsection />
    </main>
  );
}

"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import { AlertCircle } from "lucide-react";
import { Button } from "../../components/ui/button";
import { Input } from "../../components/ui/input";
import { Label } from "../../components/ui/label";
import AuthRightPanel from "../../components/ui/AuthRightPanel";
import LegalModal from "../../components/ui/LegalModal";
import { useAuth } from "@/context/AuthContext";

// Removed hardcoded grid fields since we need controlled inputs

const SectionLeftSideSubsection = () => {
  const [formData, setFormData] = useState({
    username: "",
    email: "",
    password: "",
    dateOfBirth: ""
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [legalModal, setLegalModal] = useState({ isOpen: false, type: null });
  const { register, isAuthenticated, loading: authLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!authLoading && isAuthenticated) {
      router.push("/pulse");
    }
  }, [isAuthenticated, authLoading, router]);

  const handleInputChange = (e) => {
    const { id, value } = e.target;
    setFormData((prev) => ({ ...prev, [id]: value }));
  };

  const handleSignUp = async (e) => {
    e.preventDefault();
    if (!formData.username || !formData.email || !formData.password || !formData.dateOfBirth) {
      setError("Please fill in all fields");
      return;
    }

    if (formData.password.length < 6) {
      setError("Password must be at least 6 characters long");
      return;
    }

    try {
      setLoading(true);
      setError(null);
      await register(formData.username, formData.email, formData.password, formData.dateOfBirth);
      router.push("/pulse");
    } catch (err) {
      setError(err.message || "Failed to create account");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col items-center justify-center px-6 py-12 flex-1 self-stretch z-[1] bg-plasma-bg">
      <div className="flex flex-col max-w-[460px] w-full items-start gap-[18px]">
        {/* Logo + heading */}
        <div className="pt-8 pb-0 px-0 inline-flex flex-col items-start flex-[0_0_auto]">
          <Link href="/">
            <svg
              viewBox="0 0 2013.09 468"
              className="mb-4 h-8 w-auto text-white hover:text-plasma-primary transition-colors cursor-pointer"
              fill="currentColor"
              xmlns="http://www.w3.org/2000/svg"
            >
              <polygon points="0 99.37 96.23 99.37 100.17 99.37 292.56 99.37 292.56 241.68 197.16 241.68 197.16 331.59 197.16 331.98 197.16 338.66 297.59 338.66 299.5 336.34 394.31 241.86 394.31 0 0 0 0 99.37" />
              <polygon points="100.17 273.23 100.17 265.82 100.17 130.93 96.23 130.93 0 226.82 0 350.71 0 375.33 0 468 170.22 467.27 265.79 370.81 100.17 370.21 100.17 273.23" />
              <path d="M576.96.34h-171.47v241.02h74.37v-68.86h97.1c44.07,0,62.67-18.59,62.67-62.67v-46.83c0-44.07-18.59-62.67-62.67-62.67ZM565.26,99.16c0,14.12-4.48,18.59-18.59,18.59h-66.8v-59.91h66.8c14.12,0,18.59,4.48,18.59,18.59v22.72Z" />
              <polygon points="738.79 .34 664.42 .34 664.42 241.36 858.62 241.36 858.62 175.59 738.79 175.59 738.79 .34" />
              <path d="M964.66.34l-101.23,241.02h78.5l13.43-37.53h98.82l13.43,37.53h82.29L1049.02.34h-84.36ZM973.96,152.53l30.99-85.39,30.64,85.39h-61.63Z" />
              <path d="M1342.72,95.71l-97.1-8.61c-11.36-1.03-15.15-4.13-15.15-15.15v-4.48c0-11.36,3.79-15.15,15.15-15.15h59.91c11.36,0,15.15,3.79,15.15,15.15v6.89h71.62v-19.63c0-37.53-17.22-54.4-54.4-54.4h-127.4c-37.19,0-54.4,16.87-54.4,54.4v32.37c0,36.84,15.84,50.61,54.4,54.4l97.1,8.61c12.05,1.03,15.15,3.79,15.15,15.15v8.61c0,11.36-3.79,15.15-15.15,15.15h-68.17c-11.36,0-15.15-3.79-15.15-15.15v-9.98h-71.62v23.07c0,37.53,17.22,54.4,54.4,54.4h135.66c37.19,0,54.4-16.87,54.4-54.4v-36.84c0-37.19-15.84-51.3-54.4-54.4Z" />
              <polygon points="1569.62 125.67 1492.49 .34 1427.07 .34 1427.07 241.36 1495.94 241.36 1495.94 120.5 1549.31 203.83 1587.18 203.83 1640.55 120.5 1640.55 241.36 1709.41 241.36 1709.41 .34 1647.09 .34 1569.62 125.67" />
              <path d="M1912.21.34h-84.36l-101.23,241.02h78.5l13.43-37.53h98.82l13.43,37.53h82.29L1912.21.34ZM1837.15,152.53l30.99-85.39,30.64,85.39h-61.63Z" />
            </svg>
          </Link>

          <div className="gap-[7px] inline-flex flex-col items-start flex-[0_0_auto]">
            <div className="flex flex-col items-start self-stretch w-full flex-[0_0_auto]">
              <h1 className="font-display font-bold text-plasma-text-primary text-[32px] tracking-[-0.70px] leading-[42px] whitespace-nowrap">
                Create Your Account
              </h1>
            </div>
            <div className="flex flex-col max-w-[380px] items-start w-full flex-[0_0_auto]">
              <p className="font-sans font-normal text-plasma-text-secondary text-[15px] tracking-[0] leading-[24px]">
                Join the squad and sync your Steam library
                <br />
                in seconds.
              </p>
            </div>
          </div>
        </div>

        <form onSubmit={handleSignUp} className="flex flex-col gap-[18px] w-full max-w-[380px]">
          {error && (
            <div className="flex items-center gap-2 p-3 bg-plasma-error/10 border border-plasma-error/30 rounded-xl text-plasma-error text-sm">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <p>{error}</p>
            </div>
          )}

          {/* Username field */}
          <div className="flex flex-col gap-1.5 self-stretch w-full">
            <Label
              htmlFor="username"
              className="font-sans font-medium text-plasma-text-muted text-[13px] tracking-[0] leading-[19.5px]"
            >
              Username
            </Label>
            <Input
              id="username"
              value={formData.username}
              onChange={handleInputChange}
              placeholder="pro_gamer"
              className="w-full bg-plasma-slate/50 text-white rounded-xl border border-solid border-plasma-text-muted/25 font-sans font-normal text-plasma-text-muted text-sm py-[11px] px-4 h-[44px] transition-all focus-visible:border-plasma-primary"
            />
          </div>

          {/* Email field */}
          <div className="flex flex-col gap-1.5 self-stretch w-full">
            <Label
              htmlFor="email"
              className="font-sans font-medium text-plasma-text-muted text-[13px] tracking-[0] leading-[19.5px]"
            >
              Email Address
            </Label>
            <Input
              id="email"
              type="email"
              value={formData.email}
              onChange={handleInputChange}
              placeholder="name@example.com"
              className="w-full bg-plasma-slate/50 text-white rounded-xl border border-solid border-plasma-text-muted/25 font-sans font-normal text-plasma-text-muted text-sm py-[11px] px-4 h-[44px] transition-all focus-visible:border-plasma-primary"
            />
          </div>

          {/* Password field */}
          <div className="flex flex-col gap-1.5 self-stretch w-full">
            <Label
              htmlFor="password"
              className="font-sans font-medium text-plasma-text-muted text-[13px] tracking-[0] leading-[19.5px]"
            >
              Password
            </Label>
            <Input
              id="password"
              type="password"
              value={formData.password}
              onChange={handleInputChange}
              placeholder="Enter your password"
              className="w-full bg-plasma-slate/50 text-white rounded-xl border border-solid border-plasma-text-muted/25 font-sans font-normal text-plasma-text-muted text-sm py-[11px] px-4 h-[44px] transition-all focus-visible:border-plasma-primary"
            />
          </div>

          {/* Date of Birth field */}
          <div className="flex flex-col gap-1.5 self-stretch w-full">
            <Label
              htmlFor="dateOfBirth"
              className="font-sans font-medium text-plasma-text-muted text-[13px] tracking-[0] leading-[19.5px]"
            >
              Date of Birth
            </Label>
            <Input
              id="dateOfBirth"
              type="date"
              value={formData.dateOfBirth}
              onChange={handleInputChange}
              className="w-full bg-plasma-slate/50 text-white rounded-xl border border-solid border-plasma-text-muted/25 font-sans font-normal text-plasma-text-muted text-sm py-[11px] px-4 h-[44px] transition-all focus-visible:border-plasma-primary [color-scheme:dark]"
            />
          </div>

          {/* Create Account button */}
          <Button
            type="submit"
            disabled={loading}
            className="self-stretch w-full h-[52px] bg-primary-gradient rounded-[32px] shadow-card-glow font-sans font-bold text-white text-base text-center tracking-[0] leading-6 border-0 hover:opacity-90 transition-all hover:scale-[1.02] disabled:opacity-70 disabled:cursor-not-allowed"
          >
            {loading ? "Creating Account..." : "Create Account"}
          </Button>
        </form>

        {/* Sign In link */}
        <div className="w-full pt-4 pb-0 px-0 flex flex-col max-w-[380px] items-start flex-[0_0_auto]">
          <div className="gap-[24px] w-full flex flex-col max-w-[380px] items-start flex-[0_0_auto]">
            <div className="flex flex-col w-full items-center flex-[0_0_auto]">
              <Link
                href="/login"
                className="font-sans font-medium text-plasma-primary text-[13px] text-center tracking-[0] leading-[19.5px] whitespace-nowrap hover:underline hover:text-plasma-secondary transition-colors"
              >
                Already have an Account? Sign In
              </Link>
            </div>
          </div>
        </div>

        {/* Terms and Privacy */}
        <div className="flex flex-wrap items-center justify-center text-center max-w-[380px] w-full mt-4">
          <span className="font-sans font-normal text-plasma-text-secondary text-xs leading-[19.5px]">
            By joining, you agree to our{" "}
          </span>
          <span
            onClick={() => setLegalModal({ isOpen: true, type: 'terms' })}
            className="font-sans font-medium text-plasma-primary text-xs leading-[19.5px] mx-1 cursor-pointer hover:underline"
          >
            Terms of Service
          </span>
          <span className="font-sans font-normal text-plasma-text-secondary text-xs leading-[19.5px]">
            and{" "}
          </span>
          <span
            onClick={() => setLegalModal({ isOpen: true, type: 'privacy' })}
            className="font-sans font-medium text-plasma-primary text-xs leading-[19.5px] mx-1 cursor-pointer hover:underline"
          >
            Privacy Policy
          </span>
        </div>
      </div>

      {/* Legal Modal */}
      <LegalModal
        isOpen={legalModal.isOpen}
        type={legalModal.type}
        onClose={() => setLegalModal({ isOpen: false, type: null })}
      />
    </div>
  );
};



// Sign Up screen — /sign-up route
export default function SignUpPage() {
  return (
    <main className="flex min-h-screen w-full flex-col lg:flex-row bg-plasma-bg overflow-hidden selection:bg-plasma-primary selection:text-white">
      <SectionLeftSideSubsection />
      <AuthRightPanel />
    </main>
  );
}

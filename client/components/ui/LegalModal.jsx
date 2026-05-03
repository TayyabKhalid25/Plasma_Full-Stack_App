import { X } from "lucide-react";

export default function LegalModal({ isOpen, onClose, type }) {
  if (!isOpen) return null;

  const isTerms = type === "terms";

  const title = isTerms ? "Terms of Service" : "Privacy Policy";

  const termsContent = (
    <div className="space-y-4 text-plasma-text-secondary text-sm">
      <p className="font-bold text-plasma-text-primary">Last Updated: 20/04/2026</p>
      
      <p>
        Welcome to Plasma! These Terms of Service (&quot;Terms&quot;) govern your access to and use of the Plasma website, applications, and services (collectively, the &quot;Service&quot;), operated by Tayyab Co. (&quot;we,&quot; &quot;us,&quot; or &quot;our&quot;).
      </p>
      
      <p>
        By accessing or using the Service, you agree to be bound by these Terms.
      </p>

      <h3 className="text-plasma-text-primary font-bold text-base mt-6 mb-2">1. Description of Service</h3>
      <p>
        Plasma is a social intelligence layer and data aggregation platform for PC gamers. The Service allows users to connect third-party gaming accounts, track activity, schedule events, and interact with other users via features like The Pulse, The Rally, The Omni-Library, and The Prestige.
      </p>

      <h3 className="text-plasma-text-primary font-bold text-base mt-6 mb-2">2. User Accounts and Authentication</h3>
      <p>
        <strong className="text-plasma-text-primary">Account Creation:</strong> To use Plasma, you must authenticate using a valid third-party gaming account (e.g., Steam via OpenID). You are responsible for maintaining the security of your third-party accounts.
      </p>
      <p>
        <strong className="text-plasma-text-primary">Eligibility:</strong> You must be at least 13 years old to use the Service. If you are under 18, you represent that you have your parent or guardian&apos;s permission to use the Service.
      </p>
      <p>
        <strong className="text-plasma-text-primary">Account Termination:</strong> We reserve the right to suspend or terminate your access to the Service at any time, without notice, for conduct that we believe violates these Terms or is harmful to other users, us, or third parties.
      </p>

      <h3 className="text-plasma-text-primary font-bold text-base mt-6 mb-2">3. User Conduct and Content</h3>
      <p>
        <strong className="text-plasma-text-primary">User-Generated Content:</strong> You retain ownership of any text, images, videos, or other content you post to The Pulse or other areas of the Service (&quot;User Content&quot;). By posting User Content, you grant us a non-exclusive, worldwide, royalty-free license to use, display, and distribute that content within the Service.
      </p>
      <p>
        <strong className="text-plasma-text-primary">Prohibited Conduct:</strong> You agree not to:
      </p>
      <ul className="list-disc pl-5 space-y-1">
        <li>Harass, abuse, or threaten other users.</li>
        <li>Bypass our &quot;Double Opt-In&quot; security measures for direct interaction.</li>
        <li>Post false, misleading, or inappropriate content.</li>
        <li>Attempt to manipulate the &quot;Plasma XP&quot; or Prestige achievement tracking systems.</li>
        <li>Use the Service for any illegal or unauthorized purpose.</li>
      </ul>

      <h3 className="text-plasma-text-primary font-bold text-base mt-6 mb-2">4. Third-Party Services and APIs</h3>
      <p>
        Plasma integrates with external services, including the Steam Web API and the IGDB API.
      </p>
      <p>
        Your use of the Service is also subject to the terms and conditions of these third-party providers.
      </p>
      <p>
        We are not responsible for the availability, accuracy, or reliability of data provided by third-party APIs. Disruptions in these external services may affect the functionality of Plasma.
      </p>

      <h3 className="text-plasma-text-primary font-bold text-base mt-6 mb-2">5. Intellectual Property</h3>
      <p>
        The Plasma name, logo, and the proprietary design of our platform (excluding User Content and third-party game assets) are the intellectual property of Tayyab Co. and are protected by copyright and trademark laws.
      </p>

      <h3 className="text-plasma-text-primary font-bold text-base mt-6 mb-2">6. Limitation of Liability</h3>
      <p>
        To the maximum extent permitted by law, Tayyab Co. shall not be liable for any indirect, incidental, special, consequential, or punitive damages, or any loss of profits or revenues, whether incurred directly or indirectly, or any loss of data, use, goodwill, or other intangible losses, resulting from your use of the Service.
      </p>

      <h3 className="text-plasma-text-primary font-bold text-base mt-6 mb-2">7. Changes to these Terms</h3>
      <p>
        We may modify these Terms at any time. If we make material changes, we will notify you by updating the date at the top of these Terms and, where appropriate, providing additional notice through the Service.
      </p>
    </div>
  );

  const privacyContent = (
    <div className="space-y-4 text-plasma-text-secondary text-sm">
      <p className="font-bold text-plasma-text-primary">Last Updated: 20/04/2026</p>
      
      <p>
        This Privacy Policy explains how Tayyab Co. (&quot;Plasma,&quot; &quot;we,&quot; &quot;us,&quot; or &quot;our&quot;) collects, uses, and discloses information about you when you access or use our website and platform.
      </p>

      <h3 className="text-plasma-text-primary font-bold text-base mt-6 mb-2">1. Information We Collect</h3>
      <p>
        <strong className="text-plasma-text-primary">Information from Third-Party Services:</strong> When you authenticate via Steam (OpenID), we collect your unique identifier (SteamID64), your public profile name, avatar, and publicly available data regarding your game library, playtimes, and achievements.
      </p>
      <p>
        <strong className="text-plasma-text-primary">User-Provided Information:</strong> We collect information you directly provide, such as your email address (if provided for account recovery), manual entries to the Omni-Library, RSVPs to Rally events, Intent Mode settings, and any text or media you post to The Pulse.
      </p>
      <p>
        <strong className="text-plasma-text-primary">Usage Data:</strong> We automatically collect standard diagnostic data, including your IP address, browser type, operating system, and how you interact with the Service (e.g., timestamps of API requests).
      </p>

      <h3 className="text-plasma-text-primary font-bold text-base mt-6 mb-2">2. How We Use Your Information</h3>
      <p>We use the collected information to:</p>
      <ul className="list-disc pl-5 space-y-1">
        <li>Provide, maintain, and improve the core Plasma functionalities (e.g., rendering your social feed, calculating timezones for events, and computing Plasma XP).</li>
        <li>Display your public gaming identity to your approved network.</li>
        <li>Send you technical notices, security alerts, and event notifications (e.g., 15-minute push notifications for scheduled Rallies).</li>
        <li>Monitor and analyze trends and usage to prevent API rate limiting and optimize platform performance.</li>
      </ul>

      <h3 className="text-plasma-text-primary font-bold text-base mt-6 mb-2">3. How We Share Your Information</h3>
      <p>
        <strong className="text-plasma-text-primary">With Other Users:</strong> By design, Plasma is a social platform. Your profile information, active Intent Mode, Omni-Library data, and Pulse posts are visible to users within your approved network.
      </p>
      <p>
        <strong className="text-plasma-text-primary">Service Providers:</strong> We may share data with trusted vendors that perform services on our behalf (e.g., cloud hosting providers like AWS, database management, and caching services like Redis).
      </p>
      <p>
        <strong className="text-plasma-text-primary">Legal Requirements:</strong> We may disclose your information if required to do so by law or in response to valid requests by public authorities.
      </p>

      <h3 className="text-plasma-text-primary font-bold text-base mt-6 mb-2">4. Third-Party Integrations</h3>
      <p>
        Our application queries external databases (such as IGDB) to fetch metadata. When you search for a game to add to your manual library, the search terms are processed by these external APIs. Please review the privacy policies of Twitch/IGDB and Valve Corporation (Steam) for more details on their data handling practices.
      </p>

      <h3 className="text-plasma-text-primary font-bold text-base mt-6 mb-2">5. Data Retention and Your Rights</h3>
      <p>
        We store your data for as long as your account is active.
      </p>
      <p>
        <strong className="text-plasma-text-primary">Right to be Forgotten:</strong> You may delete your account at any time via the user settings. Upon initiating account deletion, Plasma will permanently scrub your SteamID64, social connections, posts, and Rally history from our primary databases within 30 days.
      </p>

      <h3 className="text-plasma-text-primary font-bold text-base mt-6 mb-2">6. Security</h3>
      <p>
        We implement reasonable security measures, including HTTPS/TLS encryption for all data transmissions, to protect your personal information from unauthorized access, alteration, or destruction. However, no internet transmission is entirely secure, and we cannot guarantee absolute security.
      </p>

      <h3 className="text-plasma-text-primary font-bold text-base mt-6 mb-2">7. Contact Us</h3>
      <p>
        If you have any questions about these Terms or this Privacy Policy, please contact us at:<br/>
        <a href="mailto:l230501@lhr.nu.edu.pk" className="text-plasma-primary hover:underline">l230501@lhr.nu.edu.pk</a>
      </p>
    </div>
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      {/* Modal Container */}
      <div 
        className="relative w-full max-w-lg max-h-[85vh] flex flex-col bg-[#1a1726] border border-white/10 rounded-2xl shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200"
      >
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-white/10">
          <h2 className="text-xl font-display font-bold text-plasma-text-primary">
            {title}
          </h2>
          <button
            onClick={onClose}
            className="p-2 rounded-full hover:bg-white/10 transition-colors text-plasma-text-secondary hover:text-white"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
        
        {/* Scrollable Content */}
        <div className="p-6 overflow-y-auto custom-scrollbar">
          {isTerms ? termsContent : privacyContent}
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-white/10 flex justify-end bg-black/20">
          <button
            onClick={onClose}
            className="px-6 py-2 bg-plasma-primary hover:bg-plasma-primary/90 text-white font-medium rounded-full transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}

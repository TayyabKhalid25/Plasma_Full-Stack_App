import { useState } from "react";
import { ModalWrapper } from "../ui/ModalWrapper";
import { Loader2, Eye, EyeOff } from "lucide-react";
import { apiService } from "@/services/apiService";

export function ChangePasswordModal({ isOpen, onClose }) {
  const [formData, setFormData] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: ""
  });
  const [showPwd, setShowPwd] = useState({ current: false, new: false, confirm: false });
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const handleSubmit = async () => {
    setLoading(true);
    setErrors({});
    try {
      await apiService.changePassword(formData);
      setSuccess(true);
      setTimeout(() => {
        setSuccess(false);
        setFormData({ currentPassword: "", newPassword: "", confirmPassword: "" });
        onClose();
      }, 1500);
    } catch (err) {
      if (err.errors) setErrors(err.errors);
      else setErrors({ main: "Failed to change password." });
    } finally {
      setLoading(false);
    }
  };

  const toggleShow = (field) => {
    setShowPwd(prev => ({ ...prev, [field]: !prev[field] }));
  };

  const footer = (
    <div className="flex justify-end gap-3">
      <button onClick={onClose} className="px-5 py-2 rounded-xl text-sm font-bold text-plasma-text-secondary hover:text-white transition-colors">
        Cancel
      </button>
      <button 
        onClick={handleSubmit} 
        disabled={loading || success}
        className={`px-6 py-2 rounded-xl text-white text-sm font-bold flex items-center gap-2 transition-all disabled:opacity-50 ${success ? "bg-plasma-success" : "bg-primary-gradient hover:shadow-card-glow"}`}
      >
        {loading && <Loader2 className="w-4 h-4 animate-spin" />}
        {success ? "Changed!" : "Save Password"}
      </button>
    </div>
  );

  return (
    <ModalWrapper isOpen={isOpen} onClose={onClose} title="Change Password" footer={footer}>
      <div className="space-y-4">
        {errors.main && <div className="p-3 bg-plasma-error/10 border border-plasma-error/30 rounded-lg text-plasma-error text-sm">{errors.main}</div>}
        
        <div>
          <label className="text-xs font-bold text-plasma-text-secondary uppercase tracking-wider mb-2 block">Current Password</label>
          <div className="relative">
            <input 
              type={showPwd.current ? "text" : "password"}
              value={formData.currentPassword}
              onChange={e => setFormData({...formData, currentPassword: e.target.value})}
              className={`w-full bg-plasma-bg border ${errors.currentPassword ? 'border-plasma-error' : 'border-white/10'} rounded-lg py-2.5 pl-4 pr-10 text-sm text-plasma-text-primary outline-none focus:border-plasma-primary`}
            />
            <button onClick={() => toggleShow('current')} className="absolute right-3 top-1/2 -translate-y-1/2 text-plasma-text-secondary hover:text-white">
              {showPwd.current ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>
          {errors.currentPassword && <span className="text-xs text-plasma-error mt-1">{errors.currentPassword}</span>}
        </div>

        <div>
          <label className="text-xs font-bold text-plasma-text-secondary uppercase tracking-wider mb-2 block">New Password</label>
          <div className="relative">
            <input 
              type={showPwd.new ? "text" : "password"}
              value={formData.newPassword}
              onChange={e => setFormData({...formData, newPassword: e.target.value})}
              className={`w-full bg-plasma-bg border ${errors.newPassword ? 'border-plasma-error' : 'border-white/10'} rounded-lg py-2.5 pl-4 pr-10 text-sm text-plasma-text-primary outline-none focus:border-plasma-primary`}
            />
            <button onClick={() => toggleShow('new')} className="absolute right-3 top-1/2 -translate-y-1/2 text-plasma-text-secondary hover:text-white">
              {showPwd.new ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>
          {errors.newPassword && <span className="text-xs text-plasma-error mt-1">{errors.newPassword}</span>}
        </div>

        <div>
          <label className="text-xs font-bold text-plasma-text-secondary uppercase tracking-wider mb-2 block">Confirm New Password</label>
          <div className="relative">
            <input 
              type={showPwd.confirm ? "text" : "password"}
              value={formData.confirmPassword}
              onChange={e => setFormData({...formData, confirmPassword: e.target.value})}
              className={`w-full bg-plasma-bg border ${errors.confirmPassword ? 'border-plasma-error' : 'border-white/10'} rounded-lg py-2.5 pl-4 pr-10 text-sm text-plasma-text-primary outline-none focus:border-plasma-primary`}
            />
            <button onClick={() => toggleShow('confirm')} className="absolute right-3 top-1/2 -translate-y-1/2 text-plasma-text-secondary hover:text-white">
              {showPwd.confirm ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>
          {errors.confirmPassword && <span className="text-xs text-plasma-error mt-1">{errors.confirmPassword}</span>}
        </div>
      </div>
    </ModalWrapper>
  );
}

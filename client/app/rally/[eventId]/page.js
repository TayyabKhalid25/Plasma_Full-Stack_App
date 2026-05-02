"use client";

import { useState, useEffect, use, useRef } from "react";
import { useAuth, API_BASE } from "@/context/AuthContext";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import {
    Calendar, Clock, MapPin, Users as UsersIcon, ChevronLeft,
    Share2, Shield, Target, Medal, Trophy, CheckCircle2, Loader2,
    MessageSquare, UserPlus, Info, Settings, Link as LinkIcon,
    ArrowLeft, MoreVertical, Send, UserCheck, Zap, UserMinus
} from "lucide-react";
import Link from "next/link";
import { getIntentStyle } from "@/lib/intentStyles";
import { getAvatarUrl } from "@/lib/utils";
import { useModal } from "@/hooks/useModal";
import { RsvpRoleModal } from "@/components/modals/RsvpRoleModal";
import { CreateRallyModal } from "@/components/modals/CreateRallyModal";
import { ConfirmKickModal } from "@/components/modals/ConfirmKickModal";
import { ShareModal } from "@/components/modals/ShareModal";

export default function RallyDetail({ params }) {
    const resolvedParams = params instanceof Promise ? use(params) : params;
    const eventId = resolvedParams?.eventId || resolvedParams?.id;

    const { token, user } = useAuth();
    const [rally, setRally] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const rsvpModal = useModal();
    const createRallyModal = useModal();
    const kickModal = useModal();
    const shareModal = useModal();

    const fetchRallyDetails = async () => {
        if (!token || !eventId) return;
        setLoading(true);
        try {
            const res = await fetch(`${API_BASE}/api/rallies/${eventId}`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            const data = await res.json();
            if (data.success) {
                setRally(data.data);
            } else {
                setError(data.message || "Rally not found");
            }
        } catch (err) {
            console.error("Failed to fetch rally details", err);
            setError("Failed to load rally details");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchRallyDetails();
    }, [token, eventId]);

    const toggleRSVP = async () => {
        if (!rally) return;
        if (rally.hasRsvpd) {
            try {
                await fetch(`${API_BASE}/api/rallies/${eventId}/rsvp`, {
                    method: "DELETE",
                    headers: { Authorization: `Bearer ${token}` }
                });
                fetchRallyDetails();
            } catch (err) {
                console.error("RSVP cancel failed", err);
            }
        } else {
            rsvpModal.open(rally);
        }
    };

    const kickAttendee = async (targetUserId) => {
        try {
            const res = await fetch(`${API_BASE}/api/rallies/${eventId}/kick/${targetUserId}`, {
                method: "POST",
                headers: { Authorization: `Bearer ${token}` }
            });
            const data = await res.json();
            if (data.success) {
                fetchRallyDetails();
            }
        } catch (err) {
            console.error("Kick failed", err);
        }
    };

    if (loading) {
        return (
            <DashboardLayout>
                <div className="flex items-center justify-center min-h-[60vh]">
                    <Loader2 className="w-10 h-10 text-plasma-primary animate-spin" />
                </div>
            </DashboardLayout>
        );
    }

    if (error || !rally) {
        return (
            <DashboardLayout>
                <div className="max-w-4xl mx-auto pt-20 px-10 text-center">
                    <div className="bg-plasma-slate/40 backdrop-blur-md rounded-2xl p-12 border border-white/5">
                        <Info className="w-16 h-16 text-plasma-error/50 mx-auto mb-6" />
                        <h1 className="text-3xl font-display font-bold text-plasma-text-primary mb-4">{error || "Rally Not Found"}</h1>
                        <p className="text-plasma-text-secondary mb-8">The event you are looking for might have been deleted, is private, or has an invalid ID format.</p>
                        <Link href="/rally" className="px-8 py-3 bg-plasma-slate hover:bg-plasma-slate-hover text-white rounded-full font-bold transition-all inline-flex items-center gap-2">
                            <ChevronLeft className="w-4 h-4" /> Back to Rally
                        </Link>
                    </div>
                </div>
            </DashboardLayout>
        );
    }

    const intentStyle = getIntentStyle(rally.requiredIntent);
    const startDate = new Date(rally.scheduledStartUTC);
    const formattedDate = startDate.toLocaleDateString([], { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' });
    const formattedTime = startDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

    return (
        <DashboardLayout>
            <div className="relative z-10 pt-12 px-8 md:px-20 pb-32 max-w-7xl mx-auto space-y-8">

                {/* Top Navigation */}
                <div className="flex flex-col gap-6">
                    <div className="flex items-center justify-between">
                        <h1 className="text-4xl font-display font-bold text-plasma-text-primary">The Rally</h1>
                        {(user?.plasmaUserID === rally.organizerID || user?.id === rally.organizerID) && (
                            <button
                                onClick={() => createRallyModal.open(rally)}
                                className="flex items-center gap-2 px-6 py-2.5 bg-white/5 hover:bg-white/10 border border-white/5 rounded-xl text-xs font-black tracking-widest uppercase text-plasma-text-secondary hover:text-plasma-primary transition-all cursor-pointer group/edit shadow-lg"
                            >
                                <Settings className="w-4 h-4 group-hover/edit:rotate-90 transition-all duration-500" />
                                Edit Rally
                            </button>
                        )}
                    </div>
                    <Link href="/rally" className="w-fit group flex items-center gap-3 text-plasma-text-secondary hover:text-plasma-text-primary transition-colors">
                        <ArrowLeft className="w-8 h-8 group-hover:-translate-x-1 transition-transform" />
                    </Link>
                    <nav className="flex items-center gap-2 text-[10px] font-black text-plasma-text-secondary uppercase tracking-[0.2em]">
                        <Link href="/rally" className="hover:text-plasma-primary transition-colors">The Rally</Link>
                        <span className="opacity-30">›</span>
                        <span className="text-plasma-text-primary opacity-60">{rally.title}</span>
                    </nav>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

                    {/* LEFT COLUMN: Main Info & Intel */}
                    <div className="lg:col-span-2 space-y-8">

                        {/* MAIN RALLY CARD */}
                        <div className="bg-plasma-slate/60 backdrop-blur-xl rounded-[2rem] p-8 border border-white/5 relative overflow-hidden shadow-2xl">
                            <div className="absolute top-0 right-0 p-8">
                                <span className={`px-4 py-1.5 rounded-full text-[10px] font-black tracking-widest border uppercase shadow-lg ${intentStyle.badge}`}>
                                    {rally.requiredIntent}
                                </span>
                            </div>

                            <div className="flex flex-col md:flex-row gap-8 relative z-10">
                                <div className="w-full md:w-48 aspect-[3/4] rounded-2xl overflow-hidden shadow-2xl border border-white/10 shrink-0">
                                    <img
                                        src={rally.coverArtURL || "https://images.unsplash.com/photo-1542751371-adc38448a05e?q=80&w=800"}
                                        alt={rally.gameTitle}
                                        className="w-full h-full object-cover"
                                    />
                                </div>

                                <div className="flex-1 flex flex-col justify-between py-2">
                                    <div className="space-y-4">
                                        <div>
                                            <h2 className="text-4xl font-display font-bold text-plasma-text-primary leading-tight mb-1">{rally.title}</h2>
                                            <p className="text-plasma-primary font-bold uppercase tracking-widest text-sm">{rally.gameTitle || "General Operation"}</p>
                                        </div>

                                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-4">
                                            <div className="flex items-center gap-3 text-plasma-text-secondary">
                                                <Calendar className="w-5 h-5 text-plasma-primary" />
                                                <span className="text-sm font-medium">{formattedDate}</span>
                                            </div>
                                            <div className="flex items-center gap-3 text-plasma-text-secondary">
                                                <Clock className="w-5 h-5 text-plasma-primary" />
                                                <span className="text-sm font-medium">{formattedTime}</span>
                                            </div>
                                        </div>

                                        <div className="flex items-center gap-4 pt-4">
                                            <div className="text-[10px] font-black text-plasma-text-secondary uppercase tracking-widest">Hosted By</div>
                                            <Link href={`/profile/${rally.organizerID}`} className="flex items-center gap-2 group bg-white/5 hover:bg-white/10 px-3 py-1.5 rounded-full transition-all border border-white/5">
                                                <img src={getAvatarUrl(rally.organizerAvatar, rally.organizerName)} className="w-6 h-6 rounded-full border border-plasma-primary/30" />
                                                <span className="text-xs font-bold text-plasma-text-primary group-hover:text-plasma-primary transition-colors">{rally.organizerName}</span>
                                            </Link>
                                        </div>
                                    </div>

                                    <div className="flex items-center gap-6 mt-10">
                                        <button
                                            onClick={toggleRSVP}
                                            className={`px-10 py-4 rounded-2xl font-bold text-sm tracking-widest transition-all flex items-center justify-center gap-3 active:scale-[0.98] cursor-pointer shadow-xl ${rally.hasRsvpd
                                                ? "bg-plasma-success/15 text-plasma-success border border-plasma-success/30 hover:bg-plasma-error/20 hover:text-plasma-error hover:border-plasma-error/30 group/cancel"
                                                : "bg-primary-gradient text-white hover:shadow-card-glow hover:scale-[1.02]"
                                                }`}
                                        >
                                            {rally.hasRsvpd ? (
                                                <>
                                                    <span className="group-hover/cancel:hidden uppercase">RSVP'd</span>
                                                    <span className="hidden group-hover/cancel:inline">CANCEL RSVP</span>
                                                </>
                                            ) : (
                                                "RSVP"
                                            )}
                                        </button>

                                        <div className="flex flex-col">
                                            <span className="text-[10px] font-black text-plasma-text-secondary uppercase tracking-[0.2em] mb-1">Availability</span>
                                            <span className="text-lg font-display font-bold text-plasma-text-primary">{rally.currentAttendees} / {rally.maxCapacity} Slots Filled</span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* SECONDARY INFO GRID */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                            {/* OBJECTIVE CARD */}
                            <div className="bg-plasma-slate/40 backdrop-blur-md rounded-3xl p-8 border border-white/5 space-y-6">
                                <h3 className="text-sm font-black text-plasma-text-secondary uppercase tracking-[0.3em]">Objective</h3>
                                <div className="relative">
                                    <span className="absolute -top-4 -left-4 text-6xl text-plasma-primary opacity-20 font-serif">"</span>
                                    <p className="text-plasma-text-secondary leading-relaxed text-lg font-medium relative z-10 italic">
                                        {rally.description || "No mission briefing provided for this operation."}
                                    </p>
                                </div>
                            </div>

                            {/* ROLE ROSTER CARD */}
                            <div className="bg-plasma-slate/40 backdrop-blur-md rounded-3xl p-8 border border-white/5 space-y-8">
                                <h3 className="text-sm font-black text-plasma-text-secondary uppercase tracking-[0.3em]">Role Roster</h3>
                                <div className="space-y-6">
                                    {(rally.roles && rally.roles.length > 0) ? rally.roles.map((role, idx) => {
                                        const roleAttendees = rally.attendees?.filter(a => a.role === role.name) || [];
                                        const slots = Array(role.totalSlots).fill(null);
                                        roleAttendees.forEach((a, i) => { if (i < slots.length) slots[i] = a; });

                                        return (
                                            <div key={idx} className="space-y-3">
                                                <div className="flex justify-between items-center">
                                                    <span className="text-[10px] font-black text-plasma-primary uppercase tracking-widest">{role.name}</span>
                                                    <span className="text-[10px] font-bold text-plasma-text-secondary opacity-60">{roleAttendees.length}/{role.totalSlots}</span>
                                                </div>
                                                <div className="flex gap-3">
                                                    {slots.map((att, sIdx) => (
                                                        <div key={sIdx} className={`w-10 h-10 rounded-full border-2 transition-all flex items-center justify-center overflow-hidden ${att ? 'border-plasma-primary/50' : 'border-dashed border-white/10 bg-white/5'
                                                            }`}>
                                                            {att ? (
                                                                <img src={getAvatarUrl(att.avatarURL, att.username)} className="w-full h-full object-cover" />
                                                            ) : (
                                                                <Plus className="w-4 h-4 text-white/20" />
                                                            )}
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        );
                                    }) : (
                                        <div className="space-y-3">
                                            <div className="flex justify-between items-center">
                                                <span className="text-[10px] font-black text-plasma-primary uppercase tracking-widest">Open Slots</span>
                                                <span className="text-[10px] font-bold text-plasma-text-secondary opacity-60">{rally.currentAttendees}/{rally.maxCapacity}</span>
                                            </div>
                                            <div className="flex flex-wrap gap-3">
                                                {Array(rally.maxCapacity).fill(null).map((_, i) => {
                                                    const att = rally.attendees?.[i];
                                                    return (
                                                        <div key={i} className={`w-10 h-10 rounded-full border-2 transition-all flex items-center justify-center overflow-hidden ${att ? 'border-plasma-primary/50' : 'border-dashed border-white/10 bg-white/5'
                                                            }`}>
                                                            {att ? (
                                                                <img src={getAvatarUrl(att.avatarURL, att.username)} className="w-full h-full object-cover" />
                                                            ) : (
                                                                <Plus className="w-4 h-4 text-white/20" />
                                                            )}
                                                        </div>
                                                    );
                                                })}
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>

                    </div>

                    {/* RIGHT COLUMN: Attendees Sidebar */}
                    <div className="space-y-8">
                        <div className="bg-plasma-slate/60 backdrop-blur-xl rounded-[2.5rem] p-8 border border-white/5 shadow-2xl sticky top-24">
                            <div className="space-y-10">
                                <div className="flex items-center justify-between">
                                    <div className="flex flex-col">
                                        <span className="text-[10px] font-black text-plasma-text-secondary uppercase tracking-[0.3em] mb-1">Squad Roster</span>
                                        <h3 className="text-2xl font-display font-bold text-plasma-text-primary flex items-center gap-3">
                                            Attendees
                                            <span className="text-plasma-primary">({rally.currentAttendees})</span>
                                        </h3>
                                    </div>
                                    <UsersIcon className="w-6 h-6 text-plasma-text-secondary opacity-30" />
                                </div>

                                <div className="space-y-6">
                                    {rally.attendees?.length > 0 ? rally.attendees.map((att, idx) => {
                                        const status = att.status || "OFFLINE";
                                        const statusColor = status === "IN-GAME" ? "bg-plasma-secondary/20 text-plasma-secondary border-plasma-secondary/30" : status === "ONLINE" ? "bg-plasma-success/20 text-plasma-success border-plasma-success/30" : "bg-white/5 text-plasma-text-secondary border-white/10";

                                        return (
                                            <div key={idx} className="flex items-center justify-between group">
                                                <Link href={`/profile/${att.userID}`} className="flex items-center gap-4 group/user">
                                                    <div className="relative">
                                                        <img src={getAvatarUrl(att.avatarURL, att.username)} className="w-12 h-12 rounded-xl border border-white/10 group-hover/user:border-plasma-primary transition-all" />
                                                        <div className={`absolute -bottom-1 -right-1 w-4 h-4 rounded-full border-2 border-plasma-slate shadow-glow ${status === 'OFFLINE' ? 'bg-plasma-text-secondary' : 'bg-plasma-success'}`} />
                                                    </div>
                                                    <div className="flex flex-col">
                                                        <span className="text-sm font-bold text-plasma-text-primary group-hover/user:text-plasma-primary transition-colors uppercase tracking-wider">{att.username}</span>
                                                        <span className="text-[10px] font-black text-plasma-text-secondary opacity-40 uppercase tracking-widest">{att.role || "Attendee"}</span>
                                                    </div>
                                                </Link>
                                                <div className="flex items-center gap-3">
                                                    <span className={`text-[8px] font-black px-2 py-1 rounded-md border tracking-widest uppercase ${statusColor}`}>
                                                        {status}
                                                    </span>
                                                    {(user?.plasmaUserID === rally.organizerID || user?.id === rally.organizerID) && att.userID !== rally.organizerID && (
                                                        <button
                                                            onClick={() => kickModal.open(att)}
                                                            className="p-1.5 text-plasma-text-secondary hover:text-plasma-error transition-all cursor-pointer bg-white/5 rounded-lg border border-white/5 hover:border-plasma-error/30"
                                                            title="Kick from Rally"
                                                        >
                                                            <UserMinus className="w-3.5 h-3.5" />
                                                        </button>
                                                    )}
                                                </div>
                                            </div>
                                        );
                                    }) : (
                                        <div className="py-12 text-center space-y-4">
                                            <UsersIcon className="w-12 h-12 mx-auto text-white/5" />
                                            <p className="text-xs text-plasma-text-secondary italic">Waiting for squad to assemble...</p>
                                        </div>
                                    )}
                                </div>

                                <button 
                                    onClick={() => shareModal.open()}
                                    className="w-full py-4 rounded-3xl border-2 border-dashed border-white/10 text-plasma-text-secondary hover:text-plasma-primary hover:border-plasma-primary/30 transition-all text-xs font-black tracking-widest uppercase flex items-center justify-center gap-3 group cursor-pointer"
                                >
                                    <UserPlus className="w-4 h-4 group-hover:scale-110 transition-transform" />
                                    Invite a Friend
                                </button>
                            </div>
                        </div>
                    </div>

                </div>
            </div>

            <RsvpRoleModal
                isOpen={rsvpModal.isOpen}
                onClose={rsvpModal.close}
                event={rally}
                onRsvp={fetchRallyDetails}
            />

            <CreateRallyModal
                isOpen={createRallyModal.isOpen}
                onClose={createRallyModal.close}
                onRallyCreated={fetchRallyDetails}
                initialData={createRallyModal.modalData}
            />

            <ConfirmKickModal
                isOpen={kickModal.isOpen}
                onClose={kickModal.close}
                username={kickModal.modalData?.username}
                onConfirm={() => kickAttendee(kickModal.modalData?.userID)}
            />

            <ShareModal 
                isOpen={shareModal.isOpen}
                onClose={shareModal.close}
                shareType="rally"
                shareId={eventId}
            />
        </DashboardLayout>
    );
}

const Plus = ({ className }) => (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M12 4v16m8-8H4" />
    </svg>
);
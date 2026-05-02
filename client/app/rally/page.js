"use client";

import { useState, useEffect } from "react";
import { useAuth, API_BASE } from "@/context/AuthContext";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { PlusCircle, ChevronLeft, ChevronRight, ChevronDown, Calendar, Settings } from "lucide-react";
import { useModal } from "@/hooks/useModal";
import { CreateRallyModal } from "@/components/modals/CreateRallyModal";
import { RsvpRoleModal } from "@/components/modals/RsvpRoleModal";
import { getIntentStyle } from "@/lib/intentStyles";

const MONTHS = ["January","February","March","April","May","June","July","August","September","October","November","December"];
const DAYS_IN_MONTH = [31,28,31,30,31,30,31,31,30,31,30,31];

function getFirstDayOfMonth(year, month) {
  return new Date(year, month, 1).getDay();
}

function getDaysInMonth(year, month) {
  if (month === 1 && ((year % 4 === 0 && year % 100 !== 0) || year % 400 === 0)) return 29;
  return DAYS_IN_MONTH[month];
}

const intentOptions = ["All Intents", "COMP", "CHILL"];


// --- SKELETON ---
function RallySkeleton() {
  return (
    <div className="bg-plasma-slate/40 backdrop-blur-md rounded-2xl p-6 border border-white/5 animate-pulse">
      <div className="flex flex-col sm:flex-row gap-6">
        <div className="w-full sm:w-32 h-40 rounded-lg bg-plasma-slate-hover flex-shrink-0" />
        <div className="flex-1 space-y-3">
          <div className="flex gap-3">
            <div className="w-14 h-5 rounded bg-plasma-slate-hover" />
            <div className="w-20 h-5 rounded bg-plasma-slate-hover" />
          </div>
          <div className="w-3/4 h-6 rounded bg-plasma-slate-hover" />
          <div className="w-full h-2 rounded bg-plasma-slate-hover" />
          <div className="w-2/3 h-2 rounded bg-plasma-slate-hover" />
          <div className="flex justify-between items-center pt-4">
            <div className="flex -space-x-2">
              {[1,2,3].map(i => <div key={i} className="w-7 h-7 rounded-full bg-plasma-slate-hover border-2 border-plasma-slate" />)}
            </div>
            <div className="w-24 h-8 rounded-full bg-plasma-slate-hover" />
          </div>
        </div>
      </div>
    </div>
  );
}

export default function Rally() {
  const { token, user } = useAuth();
  const [view, setView] = useState("calendar");
  const now = new Date();
  const [currentMonth, setCurrentMonth] = useState(now.getMonth());
  const [currentYear, setCurrentYear] = useState(now.getFullYear());
  const [selectedDay, setSelectedDay] = useState(now.getDate());
  const [intentFilter, setIntentFilter] = useState("All Intents");
  const [showIntentDropdown, setShowIntentDropdown] = useState(false);
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);

  const createRallyModal = useModal();
  const rsvpModal = useModal();

  // Fetch rallies from API
  const fetchRallies = async () => {
    if (!token) return;
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/api/rallies`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      if (data.success) {
        setEvents(data.data.map(e => {
          const filled = parseInt(e.currentAttendees) || 0;
          const total = e.maxCapacity;
          const roleCounts = e.roleCounts || {};
          
          return {
            id: e.eventID,
            title: e.title,
            description: e.description,
            date: new Date(e.scheduledStartUTC),
            time: new Date(e.scheduledStartUTC).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            dateLabel: new Date(e.scheduledStartUTC).toLocaleDateString([], { month: 'short', day: 'numeric' }),
            intent: e.requiredIntent,
            intentColor: getIntentStyle(e.requiredIntent).badge,
            slotsFilled: filled,
            slotsTotal: total,
            organizerName: e.organizerName,
            organizerID: e.organizerID,
            rsvpd: e.hasRsvpd === true || e.hasRsvpd === 't',
            image: e.coverArtURL || "https://images.unsplash.com/photo-1542751371-adc38448a05e?q=80&w=800&auto=format&fit=crop",
            roles: e.roles && e.roles.length > 0 
              ? e.roles.map(r => {
                  const roleFilled = roleCounts[r.name] || 0;
                  return { 
                    ...r, 
                    filled: roleFilled, 
                    total: r.totalSlots, 
                    percent: r.totalSlots > 0 ? Math.min(100, Math.round((roleFilled / r.totalSlots) * 100)) : 0 
                  };
                })
              : [],
            gameTitle: e.gameTitle,
            players: [],
            gameID: e.gameID,
            openSlotsFilled: roleCounts['Open Slots'] || 0
          };
        }));
      }
    } catch (err) {
      console.error("Failed to fetch rallies", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchRallies(); }, [token]);

  const toggleRSVP = async (eventId) => {
    const event = events.find(e => e.id === eventId);
    if (!event) return;

    // Optimistic update
    setEvents(prev => prev.map(e => e.id === eventId
      ? { ...e, rsvpd: !e.rsvpd, slotsFilled: e.rsvpd ? e.slotsFilled - 1 : e.slotsFilled + 1 }
      : e
    ));

    try {
      if (event.rsvpd) {
        await fetch(`${API_BASE}/api/rallies/${eventId}/rsvp`, {
          method: "DELETE",
          headers: { Authorization: `Bearer ${token}` }
        });
      } else {
        await fetch(`${API_BASE}/api/rallies/${eventId}/rsvp`, {
          method: "POST",
          headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
          body: JSON.stringify({})
        });
      }
      fetchRallies(); // Refetch to get accurate role counts
    } catch (err) {
      console.error("RSVP failed", err);
      // Revert on error
      setEvents(prev => prev.map(e => e.id === eventId
        ? { ...e, rsvpd: !e.rsvpd, slotsFilled: e.rsvpd ? e.slotsFilled - 1 : e.slotsFilled + 1 }
        : e
      ));
    }
  };

  const prevMonth = () => {
    if (currentMonth === 0) { setCurrentMonth(11); setCurrentYear(currentYear - 1); }
    else setCurrentMonth(currentMonth - 1);
  };

  const nextMonth = () => {
    if (currentMonth === 11) { setCurrentMonth(0); setCurrentYear(currentYear + 1); }
    else setCurrentMonth(currentMonth + 1);
  };

  const daysInMonth = getDaysInMonth(currentYear, currentMonth);
  const firstDay = getFirstDayOfMonth(currentYear, currentMonth);
  const startOffset = firstDay === 0 ? 6 : firstDay - 1;

  // Determine which days have events
  const eventDaySet = new Set();
  events.forEach(e => {
    if (e.date.getMonth() === currentMonth && e.date.getFullYear() === currentYear) {
      eventDaySet.add(e.date.getDate());
    }
  });

  const isCurrentMonthViewed = currentMonth === now.getMonth() && currentYear === now.getFullYear();

  // Filter events
  const filteredEvents = events.filter((e) => {
    if (intentFilter !== "All Intents") {
      const i = e.intent?.toUpperCase();
      if (intentFilter === "COMP" && i !== "COMPETITIVE" && i !== "COMP") return false;
      if (intentFilter === "CHILL" && i !== "CHILL") return false;
      if (intentFilter === "CHILL" && i !== "CHILL") return false;
    }
    return true;
  });

  const selectedDayEvents = filteredEvents.filter(e => 
    e.date.getDate() === selectedDay && 
    e.date.getMonth() === currentMonth && 
    e.date.getFullYear() === currentYear
  );

  // Group events for list view
  const groupedEvents = [];
  const todayStr = now.toDateString();
  const todayEvents = filteredEvents.filter(e => e.date.toDateString() === todayStr);
  if (todayEvents.length > 0) groupedEvents.push({ category: `Today — ${MONTHS[now.getMonth()]} ${now.getDate()}`, items: todayEvents });
  const weekEvents = filteredEvents.filter(e => {
    const diff = (e.date - now) / (1000 * 60 * 60 * 24);
    return diff > 0 && diff <= 7 && e.date.toDateString() !== todayStr;
  });
  if (weekEvents.length > 0) groupedEvents.push({ category: "This Week", items: weekEvents });
  const laterEvents = filteredEvents.filter(e => (e.date - now) / (1000 * 60 * 60 * 24) > 7);
  if (laterEvents.length > 0) groupedEvents.push({ category: "Later", items: laterEvents });

  return (
    <DashboardLayout showRightRail={false}>
      <div className="pt-8 px-10 pb-20 max-w-6xl mx-auto">
        
        {/* Header Section */}
        <header className="flex justify-between items-end mb-10">
          <div className="space-y-1">
            <nav className="flex gap-2 text-xs font-bold text-plasma-text-secondary mb-2">
              <span className="hover:text-plasma-primary cursor-pointer transition-colors">EVENTS</span>
              <span>/</span>
              <span className="text-plasma-text-primary uppercase">{view}</span>
            </nav>
            <h1 className="text-5xl font-display font-bold text-plasma-text-primary tracking-tight">The Rally</h1>
            {view === "list" && (
              <p className="text-plasma-text-secondary font-medium mt-2">Coordinate, assemble, and conquer with your squad.</p>
            )}
          </div>
          <button 
            onClick={() => createRallyModal.open()}
            className="px-8 py-3 bg-primary-gradient rounded-full text-sm font-bold text-white shadow-[0_8px_30px_rgba(86,56,149,0.3)] flex items-center gap-2 hover:brightness-110 active:scale-95 transition-all cursor-pointer"
          >
            <PlusCircle className="w-4 h-4" />
            CREATE RALLY
          </button>
        </header>

        {/* Controls Row */}
        <div className="flex justify-between items-center mb-8 pb-4 border-b border-white/5">
          <div className="flex bg-plasma-slate rounded-lg p-1 gap-1 border border-white/5">
            <button 
              onClick={() => setView("calendar")}
              className={`px-6 py-2 rounded-lg text-xs font-bold tracking-widest uppercase transition-all cursor-pointer ${
                view === "calendar" ? "bg-plasma-primary text-white shadow-lg" : "text-plasma-text-secondary hover:text-plasma-text-primary"
              }`}
            >
              Calendar
            </button>
            <button 
              onClick={() => setView("list")}
              className={`px-6 py-2 rounded-lg text-xs font-bold tracking-widest uppercase transition-all cursor-pointer ${
                view === "list" ? "bg-plasma-primary text-white shadow-lg" : "text-plasma-text-secondary hover:text-plasma-text-primary"
              }`}
            >
              List
            </button>
          </div>
          <div className="relative">
            <button 
              onClick={() => setShowIntentDropdown(!showIntentDropdown)}
              className="flex items-center gap-3 px-5 py-2.5 bg-plasma-slate rounded-xl border border-white/5 text-sm font-medium hover:bg-plasma-slate-hover transition-colors cursor-pointer text-plasma-text-primary"
            >
              <span className="text-xs font-bold tracking-widest text-plasma-text-primary">{intentFilter}</span>
              <ChevronDown className="w-4 h-4 text-plasma-text-secondary" />
            </button>
            {showIntentDropdown && (
              <div className="absolute right-0 top-12 bg-plasma-slate border border-white/10 rounded-xl shadow-2xl z-50 overflow-hidden min-w-[160px]">
                {intentOptions.map((opt) => (
                  <button
                    key={opt}
                    onClick={() => { setIntentFilter(opt); setShowIntentDropdown(false); }}
                    className={`w-full text-left px-4 py-2.5 text-sm font-medium transition-colors cursor-pointer ${
                      intentFilter === opt ? "bg-plasma-primary/15 text-plasma-primary" : "text-plasma-text-secondary hover:bg-white/5 hover:text-white"
                    }`}
                  >
                    {opt}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Dynamic Views */}
        {view === "calendar" ? (
          <div className="flex gap-10 items-start flex-col xl:flex-row">
            
            {/* Calendar Grid Container */}
            <div className="flex-shrink-0 w-full xl:w-[750px]">
              <div className="flex justify-between items-center mb-6 px-4">
                <h2 className="font-display text-2xl font-bold tracking-wider text-plasma-text-primary">
                  {MONTHS[currentMonth].toUpperCase()} {currentYear}
                </h2>
                <div className="flex gap-4">
                  <button onClick={prevMonth} className="p-1 hover:text-plasma-primary transition-colors cursor-pointer text-plasma-text-secondary"><ChevronLeft /></button>
                  <button onClick={nextMonth} className="p-1 hover:text-plasma-primary transition-colors cursor-pointer text-plasma-text-secondary"><ChevronRight /></button>
                </div>
              </div>
              
              <div className="grid grid-cols-7 text-center text-[10px] font-bold text-plasma-text-secondary mb-4 min-w-[700px] xl:min-w-0">
                <div>MON</div><div>TUE</div><div>WED</div><div>THU</div><div>FRI</div><div>SAT</div><div>SUN</div>
              </div>
              
              <div className="grid grid-cols-7 border-l border-t border-white/5 min-w-[700px] xl:min-w-0">
                {Array.from({ length: 42 }).map((_, i) => {
                  const day = i - startOffset + 1;
                  const isCurrentMonth = day > 0 && day <= daysInMonth;
                  const isToday = isCurrentMonthViewed && day === now.getDate();
                  const isSelected = isCurrentMonth && day === selectedDay;
                  const hasEvents = eventDaySet.has(day);
                  
                  if (i >= startOffset + daysInMonth && i >= 35) return null;

                  return (
                    <div 
                      key={i}
                      onClick={() => isCurrentMonth && setSelectedDay(day)}
                      className={`h-24 border-r border-b border-white/5 p-3 relative flex flex-col items-center justify-center cursor-pointer transition-all ${
                        !isCurrentMonth ? "bg-plasma-bg/50 text-plasma-text-secondary/30" : "bg-plasma-slate hover:bg-plasma-slate-hover"
                      } ${isToday ? "bg-plasma-primary/10 border-plasma-primary shadow-[inset_0_0_15px_rgba(86,56,149,0.5)]" : ""}
                      ${isSelected && !isToday ? "bg-plasma-secondary/10 border-plasma-secondary/30" : ""}`}
                    >
                      <span className={`absolute top-3 left-3 text-sm ${
                        isSelected ? "font-bold text-plasma-secondary" : isToday ? "font-bold text-plasma-primary" : "text-plasma-text-primary"
                      }`}>
                        {isCurrentMonth ? day : ""}
                      </span>
                      
                      {hasEvents && (
                        <div className="flex gap-1.5 mt-4">
                          <div className="w-2 h-2 rounded-full bg-plasma-primary"></div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Details Panel */}
            <div className="flex-1 w-full space-y-6">
              <div className="flex justify-between items-center mb-2">
                <h3 className="text-lg font-display font-bold text-plasma-text-primary">
                  {MONTHS[currentMonth]} {selectedDay} — {selectedDayEvents.length} Event{selectedDayEvents.length !== 1 && "s"}
                </h3>
              </div>
              
              {/* Loading Skeleton */}
              {loading && (
                <>
                  <RallySkeleton />
                  <RallySkeleton />
                </>
              )}

              {/* Event Cards */}
              {!loading && selectedDayEvents.length > 0 ? (
                selectedDayEvents.map(event => (
                  <div key={event.id} className="bg-plasma-slate/40 backdrop-blur-md rounded-2xl p-6 relative overflow-hidden group border border-white/5">
                    <div className="flex flex-col sm:flex-row gap-6">
                      <div className="w-full sm:w-32 h-40 rounded-lg overflow-hidden flex-shrink-0 relative">
                        <div className="w-full h-full bg-cover bg-center" style={{ backgroundImage: `url(${event.image})` }} />
                        <div className="absolute inset-0 bg-gradient-to-t from-plasma-bg/80 to-transparent"></div>
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center justify-between mb-1">
                           <div className="flex items-center gap-3">
                             <span className={`text-[10px] font-bold px-2 py-0.5 rounded border ${event.intentColor}`}>{event.intent}</span>
                             <span className="text-xs font-medium text-plasma-text-secondary">{event.time}</span>
                           </div>
                           {(user?.plasmaUserID === event.organizerID || user?.id === event.organizerID) && (
                              <button 
                                onClick={() => createRallyModal.open(event)}
                                className="p-2 -mr-2 -mt-2 text-plasma-text-secondary hover:text-plasma-primary transition-colors cursor-pointer group/edit"
                                title="Edit Rally"
                              >
                                <Settings className="w-4 h-4 group-hover/edit:rotate-90 transition-transform duration-300" />
                              </button>
                            )}
                        </div>
                        <h4 className="text-xl font-display font-bold mb-1 text-plasma-text-primary">{event.title}</h4>
                        <div className="flex flex-col mb-3">
                          {event.gameTitle && <p className="text-xs font-bold text-plasma-primary uppercase tracking-widest">{event.gameTitle}</p>}
                          <p className="text-[10px] text-plasma-text-secondary">Host: <span className="text-plasma-text-primary font-bold">{event.organizerName}</span></p>
                        </div>
                        
                        <div className="space-y-3 mb-6">
                          {event.roles.length > 0 ? (
                            event.roles.map((role, idx) => (
                              <button 
                                key={idx} 
                                onClick={() => !event.rsvpd && rsvpModal.open({ ...event, preselectedRoleIdx: idx })}
                                disabled={event.rsvpd || role.filled >= role.total}
                                className="w-full text-left group/role cursor-pointer disabled:cursor-default"
                              >
                                <div className="flex justify-between text-[10px] font-bold mb-1">
                                  <span className="text-plasma-text-secondary uppercase group-hover/role:text-plasma-primary transition-colors">{role.name} ({role.filled} / {role.total} Slots)</span>
                                  {role.filled >= role.total && <span className="text-plasma-error uppercase">Full</span>}
                                </div>
                                <div className="w-full h-1.5 bg-white/5 rounded-full overflow-hidden border border-white/5">
                                  <div 
                                    className={`h-full transition-all duration-500 ${role.filled >= role.total ? 'bg-plasma-error/50' : 'bg-plasma-primary'}`} 
                                    style={{ width: `${role.percent}%` }}
                                  ></div>
                                </div>
                              </button>
                            ))
                          ) : (
                            <button 
                              onClick={() => !event.rsvpd && rsvpModal.open({ ...event, preselectedRoleIdx: -1 })}
                              disabled={event.rsvpd || event.slotsFilled >= event.slotsTotal}
                              className="w-full text-left group/role cursor-pointer disabled:cursor-default"
                            >
                               <div className="flex justify-between text-[10px] font-bold mb-1">
                                 <span className="text-plasma-text-secondary uppercase group-hover/role:text-plasma-primary transition-colors">Open Slots ({event.slotsFilled} / {event.slotsTotal} Slots)</span>
                                 {event.slotsFilled >= event.slotsTotal && <span className="text-plasma-error uppercase">Full</span>}
                               </div>
                               <div className="w-full h-1.5 bg-white/5 rounded-full overflow-hidden border border-white/5">
                                 <div 
                                  className={`h-full transition-all duration-500 ${event.slotsFilled >= event.slotsTotal ? 'bg-plasma-error/50' : 'bg-plasma-primary'}`}
                                  style={{ width: `${(event.slotsFilled / event.slotsTotal) * 100}%` }}
                                 ></div>
                               </div>
                            </button>
                          )}
                        </div>
                        
                        <div className="flex justify-between items-center">
                          <div className="flex items-center gap-4 text-xs text-plasma-text-secondary">
                            <span>{event.slotsFilled}/{event.slotsTotal} slots filled</span>
                          </div>
                          <button 
                            onClick={() => event.rsvpd ? toggleRSVP(event.id) : rsvpModal.open(event)}
                            className={`px-6 py-2 rounded-full text-xs font-bold transition-all cursor-pointer ${
                              event.rsvpd
                                ? "bg-plasma-success/15 text-plasma-success border border-plasma-success/30"
                                : "bg-primary-gradient text-white shadow-lg shadow-plasma-secondary/20 hover:scale-105 active:scale-95"
                            }`}
                          >
                            {event.rsvpd ? "✓ RSVP'd" : "RSVP Now"}
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                ))
              ) : !loading && (
                <div className="text-center py-12 bg-plasma-slate/20 rounded-2xl">
                  <Calendar className="w-12 h-12 mx-auto text-plasma-slate-hover mb-3" strokeWidth={1} />
                  <p className="text-plasma-text-secondary text-sm">No events match this filter.</p>
                </div>
              )}
            </div>
          </div>
        ) : (
          /* LIST VIEW */
          <div className="space-y-12 pb-20 animate-fade-in">
            {loading ? (
              <div className="space-y-4">
                {[1,2,3].map(i => (
                  <div key={i} className="bg-plasma-slate rounded-xl p-5 flex items-center justify-between animate-pulse">
                    <div className="flex items-center gap-6">
                      <div className="w-14 h-14 rounded-lg bg-plasma-slate-hover" />
                      <div className="space-y-2">
                        <div className="w-40 h-5 rounded bg-plasma-slate-hover" />
                        <div className="w-28 h-3 rounded bg-plasma-slate-hover" />
                      </div>
                    </div>
                    <div className="w-20 h-8 rounded-lg bg-plasma-slate-hover" />
                  </div>
                ))}
              </div>
            ) : groupedEvents.length > 0 ? (
              groupedEvents.map((section, sIdx) => (
                <article key={sIdx} className="space-y-4">
                  <h2 className="text-xs font-black text-plasma-text-secondary tracking-[0.3em] uppercase flex items-center gap-4">
                    {section.category}
                    <span className="h-[1px] flex-grow bg-white/5"></span>
                  </h2>
                  <div className="space-y-3">
                    {section.items.map(item => (
                      <div key={item.id} className="bg-plasma-slate rounded-xl p-5 flex flex-col md:flex-row items-start md:items-center justify-between group hover:bg-plasma-slate-hover transition-all border border-transparent hover:border-white/5 gap-6 md:gap-0">
                        <div className="flex items-center gap-6 relative w-full md:w-auto">
                          <div className="w-14 h-14 rounded-lg flex items-center justify-center overflow-hidden flex-shrink-0 bg-plasma-slate-hover border border-white/5 relative">
                            {item.image ? (
                              <img src={item.image} alt="" className="w-full h-full object-cover" />
                            ) : (
                              <Calendar className="w-6 h-6 text-plasma-primary" />
                            )}
                          </div>
                           <div>
                             <div className="flex items-center justify-between">
                                <h3 className="font-display font-bold text-xl text-plasma-text-primary">{item.title}</h3>
                                {(user?.plasmaUserID === item.organizerID || user?.id === item.organizerID) && (
                                  <button 
                                    onClick={() => createRallyModal.open(item)}
                                    className="p-1.5 text-plasma-text-secondary hover:text-plasma-primary transition-colors cursor-pointer group/edit"
                                    title="Edit Rally"
                                  >
                                    <Settings className="w-3.5 h-3.5 group-hover/edit:rotate-90 transition-transform duration-300" />
                                  </button>
                                )}
                             </div>
                             <div className="flex flex-col">
                               {item.gameTitle && <p className="text-[10px] font-bold text-plasma-primary uppercase tracking-widest">{item.gameTitle}</p>}
                               <p className="text-[10px] text-plasma-text-secondary">Host: <span className="text-plasma-text-primary font-bold">{item.organizerName}</span></p>
                             </div>
                            <div className="flex items-center gap-3 text-sm text-plasma-text-secondary font-medium mt-1">
                              <span>{item.dateLabel}</span>
                              <span className="w-1 h-1 rounded-full bg-plasma-text-secondary/30"></span>
                              <span>{item.time}</span>
                            </div>
                          </div>
                          <div className="hidden md:block ml-4">
                            <span className={`text-[10px] font-black px-3 py-1 rounded-full tracking-widest border uppercase ${item.intentColor}`}>{item.intent}</span>
                          </div>
                        </div>
                        
                        <div className="flex items-center gap-10 w-full md:w-auto justify-between md:justify-end border-t md:border-t-0 border-white/5 pt-4 md:pt-0 mt-2 md:mt-0">
                          <div className="md:hidden block">
                            <span className={`text-[10px] font-black px-3 py-1 rounded-full tracking-widest border uppercase ${item.intentColor}`}>{item.intent}</span>
                          </div>
                          <div className="flex items-center gap-6 md:gap-10">
                            <div className="text-center flex flex-col items-center">
                              <p className="text-[10px] text-plasma-text-secondary font-black tracking-widest uppercase mb-1">Slots</p>
                              <div className="flex items-center gap-1">
                                <span className="text-lg font-display font-bold text-plasma-text-primary">{item.slotsFilled}</span>
                                <span className="text-sm text-plasma-text-secondary font-bold">/ {item.slotsTotal}</span>
                              </div>
                            </div>
                            <button 
                              onClick={() => item.rsvpd ? toggleRSVP(item.id) : rsvpModal.open(item)}
                              className={`px-6 py-2.5 rounded-lg text-xs font-bold tracking-widest transition-all border uppercase cursor-pointer ${
                                item.rsvpd
                                  ? "bg-plasma-success/15 text-plasma-success border-plasma-success/30"
                                  : "bg-white/5 hover:bg-white/10 text-plasma-text-primary border-white/10"
                              }`}
                            >
                              {item.rsvpd ? "✓ RSVP'd" : "RSVP"}
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </article>
              ))
            ) : (
              <div className="text-center py-16">
                <p className="text-plasma-text-secondary text-sm">No events match this intent filter.</p>
              </div>
            )}
          </div>
        )}

      </div>
      
      <CreateRallyModal 
        isOpen={createRallyModal.isOpen} 
        onClose={createRallyModal.close}
        onRallyCreated={() => { fetchRallies(); }}
        initialData={createRallyModal.modalData}
      />
      <RsvpRoleModal 
        isOpen={rsvpModal.isOpen} 
        onClose={rsvpModal.close}
        event={rsvpModal.modalData}
        onRsvp={() => { fetchRallies(); }}
      />
    </DashboardLayout>
  );
}

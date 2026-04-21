"use client";

import { useState } from "react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { PlusCircle, ChevronLeft, ChevronRight, ChevronDown } from "lucide-react";
import { rallyEvents as initialEvents, rallyListEvents } from "@/data/dummy";
import { useModal } from "@/hooks/useModal";
import { CreateRallyModal } from "@/components/modals/CreateRallyModal";
import { RsvpRoleModal } from "@/components/modals/RsvpRoleModal";

const MONTHS = ["January","February","March","April","May","June","July","August","September","October","November","December"];
const DAYS_IN_MONTH = [31,28,31,30,31,30,31,31,30,31,30,31];

function getFirstDayOfMonth(year, month) {
  return new Date(year, month, 1).getDay();
}

function getDaysInMonth(year, month) {
  if (month === 1 && ((year % 4 === 0 && year % 100 !== 0) || year % 400 === 0)) return 29;
  return DAYS_IN_MONTH[month];
}

const intentOptions = ["All Intents", "COMP", "CHILL", "LFG"];

export default function Rally() {
  const [view, setView] = useState("calendar");
  const [currentMonth, setCurrentMonth] = useState(2); // March (0-indexed)
  const [currentYear, setCurrentYear] = useState(2026);
  const [selectedDay, setSelectedDay] = useState(22);
  const [intentFilter, setIntentFilter] = useState("All Intents");
  const [showIntentDropdown, setShowIntentDropdown] = useState(false);
  const [events, setEvents] = useState(initialEvents);

  const createRallyModal = useModal();
  const rsvpModal = useModal();

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
  // Adjust so Monday is 0
  const startOffset = firstDay === 0 ? 6 : firstDay - 1;

  const eventDays = [22, 25, 28]; // days with events in March
  const isCurrentMonthMarch = currentMonth === 2 && currentYear === 2026;

  const toggleRSVP = (eventId) => {
    setEvents((prev) =>
      prev.map((e) => (e.id === eventId ? { ...e, rsvpd: !e.rsvpd } : e))
    );
  };

  // Filter events
  const filteredEvents = events.filter((e) => {
    if (intentFilter === "All Intents") return true;
    return e.intent === intentFilter;
  });

  const filteredListEvents = rallyListEvents.map((section) => ({
    ...section,
    items: section.items.filter((item) => {
      if (intentFilter === "All Intents") return true;
      return item.intent === intentFilter;
    }),
  })).filter((s) => s.items.length > 0);

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
            <div className="flex-shrink-0 w-full xl:w-auto">
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
                  const isToday = isCurrentMonthMarch && day === 21;
                  const isSelected = isCurrentMonthMarch && day === selectedDay;
                  const hasEvents = isCurrentMonthMarch && eventDays.includes(day);
                  
                  if (i >= startOffset + daysInMonth && i >= 35) return null; // Don't render extra row

                  return (
                    <div 
                      key={i}
                      onClick={() => isCurrentMonth && isCurrentMonthMarch && setSelectedDay(day)}
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
                          <div className={`w-2 h-2 rounded-full ${day === 22 ? 'bg-plasma-primary' : day === 25 ? 'bg-plasma-success' : 'bg-yellow-500'}`}></div>
                          {day === 22 && <div className="w-2 h-2 bg-plasma-secondary rounded-full"></div>}
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
                  {isCurrentMonthMarch ? `March ${selectedDay}` : MONTHS[currentMonth]} — {filteredEvents.length} Event{filteredEvents.length !== 1 && "s"}
                </h3>
                {isCurrentMonthMarch && (
                  <span className="text-xs font-bold text-plasma-text-secondary bg-plasma-slate px-3 py-1 rounded-full">TODAY IS MAR 21</span>
                )}
              </div>
              
              {/* Event Cards */}
              {filteredEvents.length > 0 ? (
                filteredEvents.map(event => (
                  <div key={event.id} className="bg-plasma-slate/40 backdrop-blur-md rounded-2xl p-6 relative overflow-hidden group border border-white/5">
                    <div className="flex flex-col sm:flex-row gap-6">
                      <div className="w-full sm:w-32 h-40 rounded-lg overflow-hidden flex-shrink-0 relative">
                        <div className="w-full h-full bg-cover bg-center" style={{ backgroundImage: `url(${event.image})` }} />
                        <div className="absolute inset-0 bg-gradient-to-t from-plasma-bg/80 to-transparent"></div>
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-1">
                          <span className={`text-[10px] font-bold px-2 py-0.5 rounded border ${event.intentColor}`}>{event.intent}</span>
                          <span className="text-xs font-medium text-plasma-text-secondary">{event.time}</span>
                        </div>
                        <h4 className="text-xl font-display font-bold mb-4 text-plasma-text-primary">{event.title}</h4>
                        
                        <div className="space-y-3 mb-6">
                          {event.roles.map((role, idx) => (
                            <div key={idx}>
                              <div className="flex justify-between text-[10px] font-bold mb-1">
                                <span className="text-plasma-text-secondary uppercase">{role.name} ({role.filled}/{role.total})</span>
                              </div>
                              <div className="w-full h-1 bg-white/5 rounded-full overflow-hidden">
                                <div className="h-full bg-plasma-primary" style={{ width: `${role.percent}%` }}></div>
                              </div>
                            </div>
                          ))}
                        </div>
                        
                        <div className="flex justify-between items-center">
                          <div className="flex -space-x-2">
                            {event.players.map((avatar, idx) => (
                              <img key={idx} src={avatar} alt="Player" className="w-7 h-7 rounded-full border-2 border-plasma-slate bg-plasma-slate" />
                            ))}
                            <div className="w-7 h-7 rounded-full border-2 border-plasma-slate bg-plasma-slate-hover flex items-center justify-center text-[8px] font-bold text-plasma-text-primary">+2</div>
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
              ) : (
                <div className="text-center py-12 bg-plasma-slate/20 rounded-2xl">
                  <p className="text-plasma-text-secondary text-sm">No events match this filter.</p>
                </div>
              )}
            </div>
          </div>
        ) : (
          /* LIST VIEW */
          <div className="space-y-12 pb-20 animate-fade-in">
            {filteredListEvents.length > 0 ? (
              filteredListEvents.map((section, sIdx) => (
                <article key={sIdx} className="space-y-4">
                  <h2 className="text-xs font-black text-plasma-text-secondary tracking-[0.3em] uppercase flex items-center gap-4">
                    {section.category}
                    <span className="h-[1px] flex-grow bg-white/5"></span>
                  </h2>
                  <div className="space-y-3">
                    {section.items.map(item => (
                      <div key={item.id} className="bg-plasma-slate rounded-xl p-5 flex flex-col md:flex-row items-start md:items-center justify-between group hover:bg-plasma-slate-hover transition-all border border-transparent hover:border-white/5 gap-6 md:gap-0">
                        <div className="flex items-center gap-6 relative w-full md:w-auto">
                          {item.isTomorrow && (
                            <span className="absolute -top-2 -left-2 z-10 bg-plasma-secondary text-white px-2 py-0.5 rounded text-[8px] font-black uppercase shadow-lg">TOMORROW</span>
                          )}
                          <div className="w-14 h-14 rounded-lg flex items-center justify-center overflow-hidden flex-shrink-0" style={{ backgroundImage: `url(${item.icon})`, backgroundSize: 'cover' }}>
                          </div>
                          <div>
                            <h3 className="font-display font-bold text-xl text-plasma-text-primary">{item.title}</h3>
                            <div className="flex items-center gap-3 text-sm text-plasma-text-secondary font-medium">
                              <span>{item.game}</span>
                              {item.date && (
                                <>
                                  <span className="w-1 h-1 rounded-full bg-plasma-text-secondary/30"></span>
                                  <span>{item.date}</span>
                                </>
                              )}
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
                            <div className="text-center">
                              <p className="text-[10px] text-plasma-text-secondary font-black tracking-widest uppercase mb-1">Slots</p>
                              <div className="flex items-center gap-1">
                                <span className="text-lg font-display font-bold text-plasma-text-primary">{item.slotsFilled}</span>
                                <span className="text-sm text-plasma-text-secondary font-bold">/ {item.slotsTotal}</span>
                              </div>
                            </div>
                            <button 
                              onClick={() => rsvpModal.open(item)}
                              className="bg-white/5 hover:bg-white/10 text-plasma-text-primary px-6 py-2.5 rounded-lg text-xs font-bold tracking-widest transition-all border border-white/10 uppercase cursor-pointer"
                            >
                              RSVP
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
        onRallyCreated={(rally) => {
          // Dummy update list with new rally
        }}
      />
      <RsvpRoleModal 
        isOpen={rsvpModal.isOpen} 
        onClose={rsvpModal.close}
        event={rsvpModal.modalData}
        onRsvp={(eventId, roleId) => {
          // Add to RSVPs or handle role filling
          toggleRSVP(eventId);
        }}
      />
    </DashboardLayout>
  );
}

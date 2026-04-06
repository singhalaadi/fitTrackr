import { useEffect, useState, useMemo } from "react";
import Layout from "../components/common/Layout";
import Card from "../components/common/Card";
import Button from "../components/common/Button";
import {
  Trophy,
  Activity,
  TrendingUp,
  Flame,
  ArrowRight,
  Bell,
  BellRing,
  CheckCircle,
  AlertTriangle
} from "lucide-react";
import { useUser } from "../contexts/UserContext";
import { useNavigate } from "react-router-dom";
import { collection, query, where, orderBy, onSnapshot } from "firebase/firestore";
import { db } from "../config/firebase";
import { useAuth } from "../contexts/AuthContext";
import { requestNotificationPermission, onMessageListener } from "../services/notification.jsx";
import { calculateBurn, getTotalSets } from "../utils/fitness";
import toast from "react-hot-toast";

// Modular Components
import StatCard from "../components/dashboard/StatCard";
import PRItem from "../components/dashboard/PRItem";
import WeeklyChart from "../components/dashboard/WeeklyChart";

export default function Dashboard() {
  const { userData, loading, updateProfile } = useUser();
  const navigate = useNavigate();
  const { currentUser } = useAuth();

  const [workouts, setWorkouts] = useState([]);
  const [workoutsLoading, setWorkoutsLoading] = useState(true);
  const [activeBar, setActiveBar] = useState(null);
  const [weekOffset, setWeekOffset] = useState(0);

  const hasWeight = useMemo(() => !!userData?.weight && parseFloat(userData.weight) > 0, [userData]);

  const healthyRange = useMemo(() => {
    if (!userData?.heightFt) return null;
    const ft = Math.abs(parseInt(userData.heightFt)) || 0;
    const inch = Math.abs(parseInt(userData.heightIn)) || 0;
    const totalInches = (ft * 12) + inch;
    const heightM = totalInches * 0.0254;

    if (heightM > 0) {
      const minW = 18.5 * (heightM * heightM);
      const maxW = 25.0 * (heightM * heightM);
      return { min: minW.toFixed(1), max: maxW.toFixed(1) };
    }
    return null;
  }, [userData]);

  useEffect(() => {
    if (!loading && userData && !userData.profileComplete) {
      navigate("/onboarding");
    }

    const savedSession = localStorage.getItem("ft_active_session");
    if (savedSession && currentUser) {
      try {
        const data = JSON.parse(savedSession);
        const isToday = new Date(data.updatedAt).toDateString() === new Date().toDateString();
        if (data.userId === currentUser.uid && isToday) {
          navigate("/workout");
        }
      } catch (e) { }
    }

    if (userData?.profileComplete) {
      onMessageListener().catch(err => {
        // console.error(err);
      });
    }
  }, [userData, loading, navigate, currentUser]);


  useEffect(() => {
    if (!currentUser) return;
    const q = query(
      collection(db, "workouts"),
      where("userId", "==", currentUser.uid),
      orderBy("timestamp", "desc")
    );
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const workoutData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setWorkouts(workoutData);
      setWorkoutsLoading(false);
    });
    return () => unsubscribe();
  }, [currentUser]);

  const stats = useMemo(() => {
    const totalWorkouts = workouts.length;
    const totalWeight = workouts.reduce((acc, w) =>
      acc + w.exercises.reduce((exAcc, ex) =>
        exAcc + ex.sets.reduce((sAcc, s) => sAcc + parseFloat(s.weight || 0), 0), 0), 0);

    const peakStrength = workouts.reduce((acc, w) => {
      const sessionPeak = Math.max(...w.exercises.flatMap(ex => ex.sets.map(s => parseFloat(s.weight || 0))), 0);
      return Math.max(acc, sessionPeak);
    }, 0);

    const totalAllSets = workouts.reduce((acc, w) => acc + getTotalSets(w.exercises), 0);

    const energyBurn = workouts.reduce((acc, w) => {
      const sessionSets = getTotalSets(w.exercises);
      return acc + calculateBurn(sessionSets, userData?.weight, w.intensity || 'MODERATE');
    }, 0);

    return { totalWorkouts, totalWeight, peakStrength, energyBurn };
  }, [workouts, userData?.weight]);

  const weeklyData = useMemo(() => {
    const data = [
      { day: "Mon", weight: 0, peakWeight: 0, topEx: "", cal: 0, reps: 0 },
      { day: "Tue", weight: 0, peakWeight: 0, topEx: "", cal: 0, reps: 0 },
      { day: "Wed", weight: 0, peakWeight: 0, topEx: "", cal: 0, reps: 0 },
      { day: "Thu", weight: 0, peakWeight: 0, topEx: "", cal: 0, reps: 0 },
      { day: "Fri", weight: 0, peakWeight: 0, topEx: "", cal: 0, reps: 0 },
      { day: "Sat", weight: 0, peakWeight: 0, topEx: "", cal: 0, reps: 0 },
      { day: "Sun", weight: 0, peakWeight: 0, topEx: "", cal: 0, reps: 0 },
    ];

    const weekStartPref = userData?.weekStartDay || 1;
    const d = new Date();
    d.setDate(d.getDate() + (weekOffset * 7));
    const day = d.getDay();
    const diff = (day < weekStartPref ? 7 : 0) + day - weekStartPref;
    d.setDate(d.getDate() - diff);
    d.setHours(0, 0, 0, 0);
    const startOfWeek = d;

    const endOfWeek = new Date(startOfWeek);
    endOfWeek.setDate(endOfWeek.getDate() + 7);

    workouts.forEach(w => {
      const wDate = w.timestamp?.toDate ? w.timestamp.toDate() : new Date(w.timestamp);
      if (wDate >= startOfWeek && wDate < endOfWeek) {
        const dayName = wDate.toLocaleDateString('en-US', { weekday: 'short' });
        const dayItem = data.find(item => item.day === dayName);
        if (dayItem) {
          const sessionWeight = w.exercises.reduce((acc, ex) => acc + ex.sets.reduce((sAcc, s) => sAcc + parseFloat(s.weight || 0), 0), 0);
          const sessionReps = w.exercises.reduce((acc, ex) => acc + ex.sets.reduce((sAcc, s) => sAcc + parseInt(s.reps || 0), 0), 0);
          const sessionSets = getTotalSets(w.exercises);

          dayItem.weight += sessionWeight;
          dayItem.reps += sessionReps;
          dayItem.cal += calculateBurn(sessionSets, userData?.weight, w.intensity || 'MODERATE');

          w.exercises.forEach(ex => {
            const exPeak = Math.max(...ex.sets.map(s => parseFloat(s.weight || 0)));
            if (exPeak > dayItem.peakWeight) {
              dayItem.peakWeight = exPeak;
              dayItem.topEx = ex.name;
            }
          });
        }
      }
    });

    return { data, startOfWeek, endOfWeek };
  }, [workouts, weekOffset, userData?.weekStartDay, userData?.weight]);

  const gains = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const lastWeekSameDay = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);
    const lastWeekEnd = new Date(lastWeekSameDay.getTime() + 24 * 60 * 60 * 1000);

    const todayWorkouts = workouts.filter(w => {
      const d = w.timestamp?.toDate ? w.timestamp.toDate() : new Date(w.timestamp);
      d.setHours(0, 0, 0, 0);
      return d.getTime() === today.getTime();
    });

    const prevWorkouts = workouts.filter(w => {
      const d = w.timestamp?.toDate ? w.timestamp.toDate() : new Date(w.timestamp);
      return d >= lastWeekSameDay && d < lastWeekEnd;
    });

    const results = [];
    if (todayWorkouts.length > 0 && prevWorkouts.length > 0) {
      todayWorkouts[0].exercises.forEach(currEx => {
        const prevEx = prevWorkouts[0].exercises.find(e => e.name.toLowerCase() === currEx.name.toLowerCase());
        if (prevEx) {
          const currMax = Math.max(...currEx.sets.map(s => parseFloat(s.weight || 0)));
          const prevMax = Math.max(...prevEx.sets.map(s => parseFloat(s.weight || 0)));
          if (currMax >= prevMax) {
            results.push({ name: currEx.name, delta: (currMax - prevMax).toFixed(1), curr: currMax, prev: prevMax });
          }
        }
      });
    }
    return results;
  }, [workouts]);

  const { allTimePRs, prList } = useMemo(() => {
    const allTime = {};
    const thisMonth = {};
    const monthStart = new Date();
    monthStart.setDate(1);
    monthStart.setHours(0, 0, 0, 0);

    workouts.forEach(w => {
      const wDate = w.timestamp?.toDate ? w.timestamp.toDate() : new Date(w.timestamp);
      w.exercises.forEach(ex => {
        const name = ex.name.toUpperCase();
        const maxWeight = Math.max(...ex.sets.map(s => parseFloat(s.weight || 0)));
        if (!allTime[name] || maxWeight > allTime[name].weight) allTime[name] = { weight: maxWeight, date: wDate };
        if (wDate >= monthStart && (!thisMonth[name] || maxWeight > thisMonth[name].weight)) thisMonth[name] = { weight: maxWeight, date: wDate };
      });
    });

    const list = Object.entries(allTime).slice(0, 3).map(([name, data]) => ({
      name,
      weight: data.weight,
      isNew: thisMonth[name]?.weight === data.weight
    }));

    return { allTimePRs: allTime, prList: list };
  }, [workouts]);

  const handleEnableNotifications = async () => {
    const token = await requestNotificationPermission();
    if (token) {
      await updateProfile({ fcmToken: token, notificationsEnabled: true, notificationSyncedAt: new Date().toISOString() });
      toast.success("Notifications enabled!");
    } else {
      toast.error("Permission was not granted.");
    }
  };

  if (loading) return (
    <Layout>
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="w-12 h-12 rounded-full border-4 border-primary/20 border-t-primary animate-spin" />
      </div>
    </Layout>
  );

  const maxWeeklyPeak = Math.max(...weeklyData.data.map(d => d.peakWeight)) || 1;

  return (
    <Layout>
      <div className="space-y-12 animate-in fade-in slide-in-from-bottom-4 duration-500 max-w-full overflow-hidden pb-12">
        <header className="flex flex-col lg:flex-row lg:items-end justify-between gap-6 pb-2 border-b border-white/5 mb-2">
          <div className="space-y-3">
            <h1 className="text-4xl md:text-6xl font-black italic uppercase tracking-tighter leading-none">
              Your <span className="text-primary italic">Dashboard</span>
            </h1>
            <div className="flex flex-wrap items-center gap-4 text-surface-variant font-label uppercase tracking-widest text-[9.5px] sm:text-[11px] ml-1 font-bold">
              <span>Goal: <span className="text-primary underline decoration-primary/30 underline-offset-4">{userData?.goal?.toUpperCase() || "UNSET"}</span></span>
              <span className="hidden sm:inline w-1 h-1 bg-surface-variant/30 rounded-full" />
              <span>Weight: <span className={`${hasWeight ? 'text-primary' : 'text-error'} font-black`}>{hasWeight ? `${userData.weight}KG` : 'MISSING'}</span></span>
              <span className="hidden sm:inline w-1 h-1 bg-surface-variant/30 rounded-full" />
              <span>BMI: <span className={`${userData?.bmi >= 18.5 && userData?.bmi <= 25 ? 'text-primary' : 'text-orange-500'} font-black`}>{userData?.bmi || 0}</span></span>
              {healthyRange && (
                <>
                  <span className="hidden sm:inline w-1 h-1 bg-surface-variant/70 rounded-full" />
                  <span className="text-[9px] text-surface-variant opacity-90">Ideal Range: <span className="text-on-surface-variant">{healthyRange.min} - {healthyRange.max}KG</span></span>
                </>
              )}
            </div>
          </div>
        </header>

        <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          <StatCard title="Workouts" value={stats.totalWorkouts} unit="Sessions" icon={Activity} color="var(--color-primary)" trend="+100%" />
          <StatCard title="Peak Strength" value={stats.peakStrength.toLocaleString()} unit="KG" icon={Trophy} color="var(--color-primary)" trend="PR" />
          <StatCard title="Total Load" value={stats.totalWeight.toLocaleString()} unit="KG" icon={TrendingUp} color="var(--color-primary)" trend="Total" />
          <StatCard
            title="Energy Burn"
            value={hasWeight ? stats.energyBurn.toFixed(0) : "---"}
            unit={hasWeight ? "Kcal" : "SET WEIGHT"}
            icon={hasWeight ? Flame : AlertTriangle}
            color={hasWeight ? "var(--color-primary)" : "#ef4444"}
            trend={hasWeight ? "Est." : "Action Required"}
          />
        </section>

        {/* Weekly Gains */}
        {gains.length > 0 && (
          <section className="space-y-6 animate-in fade-in zoom-in duration-700">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-bold flex items-center gap-3 italic text-surface-variant">
                <span className="text-primary font-black">STRENGTH</span> GAINS
              </h2>
              <span className="text-[10px] font-label text-surface-variant uppercase tracking-widest font-black">Vs Last Week Same Day</span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {gains.map((gain, i) => (
                <Card key={i} className="p-4 bg-surface-container-low/40 border-white/5 relative overflow-hidden group hover:border-primary/20 transition-colors">
                  <div className="flex items-center justify-between relative z-10">
                    <div>
                      <h4 className="text-[11px] font-black italic uppercase tracking-wider text-surface-variant mb-1">{gain.name}</h4>
                      <div className="flex items-baseline gap-2">
                        <span className="text-2xl font-black italic text-white tracking-tighter">{gain.curr}</span>
                        <span className="text-[9px] uppercase font-label text-surface-variant font-bold">KG</span>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="flex items-center gap-1 text-primary mb-1 justify-end">
                        <TrendingUp className="w-3 h-3" />
                        <span className="text-xs font-black italic">+{gain.delta} KG</span>
                      </div>
                      <span className="text-[9px] font-label text-surface-variant uppercase tracking-[0.2em] font-black opacity-60">Prev: {gain.prev}kg</span>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          </section>
        )}

        <section className="animate-in slide-in-from-right-4 duration-700">
          <Card className="bg-linear-to-r from-primary/10 to-primary/5 border border-primary/20 p-6 sm:p-8 rounded-3xl relative overflow-hidden group">
            <div className="flex flex-col md:flex-row items-center justify-between gap-8 relative z-10 transition-all">
              <div className="flex items-center gap-6">
                <div className={`w-16 h-16 rounded-2xl flex items-center justify-center transition-all duration-500 shadow-xl ${userData?.notificationsEnabled ? 'bg-primary text-on-primary shadow-primary/30' : 'bg-surface-container-high text-surface-variant group-hover:text-primary scale-95 hover:scale-100'}`}>
                  {userData?.notificationsEnabled ? <BellRing className="w-8 h-8 animate-bounce" /> : <Bell className="w-8 h-8" />}
                </div>
                <div className="space-y-1">
                  <h2 className="text-xl sm:text-2xl font-black italic uppercase tracking-tight leading-none">Workout <span className="text-primary italic">Reminders</span></h2>
                  <p className="text-[10px] sm:text-xs font-label uppercase tracking-widest text-surface-variant font-bold">Get notified about your next scheduled session</p>
                </div>
              </div>
              {userData?.notificationsEnabled ? (
                <div className="flex items-center gap-3 bg-primary/10 px-8 py-3 rounded-full border border-primary/20">
                  <CheckCircle className="text-primary w-5 h-5" />
                  <span className="text-[10px] font-black italic uppercase tracking-widest text-primary">Status: Active</span>
                </div>
              ) : (
                <Button onClick={handleEnableNotifications} className="px-12 py-3 text-[10px] sm:text-xs font-black italic uppercase tracking-widest leading-none">
                  Enable Notifications <ArrowRight className="ml-2 w-4 h-4" />
                </Button>
              )}
            </div>
          </Card>
        </section>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <Card className="lg:col-span-2 space-y-8 bg-surface-container-low/40 relative">
            <WeeklyChart
              weeklyData={weeklyData.data}
              activeBar={activeBar}
              setActiveBar={setActiveBar}
              hasDataOverall={workouts.length > 0}
              startOfWeek={weeklyData.startOfWeek}
              endOfWeek={weeklyData.endOfWeek}
              setWeekOffset={setWeekOffset}
              weekOffset={weekOffset}
              maxWeeklyPeak={maxWeeklyPeak}
            />
          </Card>

          <Card className="space-y-6 bg-primary/5 border border-primary/10 flex flex-col justify-between">
            <div className="space-y-6">
              <h2 className="text-xl sm:text-2xl font-black italic uppercase tracking-tight">Your <span className="text-primary italic">Records</span></h2>
              <div className="space-y-4">
                {prList.length > 0 ? prList.map((pr, idx) => (
                  <PRItem key={idx} exercise={pr.name} weight={pr.weight} unit="KG" isNew={pr.isNew} />
                )) : (
                  <p className="text-[10px] font-label uppercase tracking-widest text-surface-variant italic font-black text-center py-10 opacity-40">No records found</p>
                )}
              </div>
            </div>
            <button onClick={() => navigate("/history")} className="w-full flex items-center justify-center gap-2 text-primary font-label text-[10px] uppercase tracking-widest pt-5 font-black">
              Full History <ArrowRight className="w-4 h-4" />
            </button>
          </Card>
        </div>
      </div>
    </Layout>
  );
}
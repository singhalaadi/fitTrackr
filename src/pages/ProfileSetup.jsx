import React, { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { useUser } from "../contexts/UserContext";
import { useAuth } from "../contexts/AuthContext";
import toast from "react-hot-toast";
import Button from "../components/common/Button";
import Card from "../components/common/Card";
import {
  Trophy,
  Target,
  Flame,
  Zap,
  ArrowRight,
  TrendingUp,
  Activity,
  Camera,
  UploadCloud,
  CheckCircle2,
  Trash2,
  ChevronLeft
} from "lucide-react";

const goals = [
  { id: "cut", title: "CUT", label: "Reduce Body Fat", icon: Flame, color: "#f97316" },
  { id: "bulk", title: "BULK", label: "Build Muscle Mass", icon: TrendingUp, color: "#ea580c" },
  { id: "gain", title: "GAIN", label: "Strength & Power", icon: Zap, color: "#fdba74" },
  { id: "weight_loss", title: "LOSE", label: "Weight Management", icon: Activity, color: "#fcd34d" },
];

export default function ProfileSetup() {
  const { userData, updateProfile, loading } = useUser();
  const { currentUser } = useAuth();
  const [name, setName] = useState("");
  const [age, setAge] = useState("");
  const [selectedGoal, setSelectedGoal] = useState("");
  const [profileImage, setProfileImage] = useState("");
  const [weight, setWeight] = useState("");
  const [heightFt, setHeightFt] = useState("");
  const [heightIn, setHeightIn] = useState("");
  const [sex, setSex] = useState("");
  const [bmi, setBmi] = useState(null);
  const [idealRange, setIdealRange] = useState(null);
  const [uploadLoading, setUploadLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const fileInputRef = useRef(null);
  const isInitialized = useRef(false);
  const navigate = useNavigate();

  useEffect(() => {
    if (userData && !isInitialized.current) {
      setName(userData.name || currentUser?.displayName || "");
      setAge(userData.age?.toString() || "");
      setSelectedGoal(userData.goal || "");
      setProfileImage(userData.photoURL || "");
      setWeight(userData.weight?.toString() || "");
      setHeightFt(userData.heightFt?.toString() || "");
      setHeightIn(userData.heightIn?.toString() || "");
      setSex(userData.sex || "");
      isInitialized.current = true;
    }
  }, [userData, currentUser]);

  const isDirty =
    name !== (userData?.name || currentUser?.displayName || "") ||
    age !== (userData?.age?.toString() || "") ||
    selectedGoal !== (userData?.goal || "") ||
    profileImage !== (userData?.photoURL || "") ||
    weight !== (userData?.weight?.toString() || "") ||
    heightFt !== (userData?.heightFt?.toString() || "") ||
    heightIn !== (userData?.heightIn?.toString() || "") ||
    sex !== (userData?.sex || "");

  useEffect(() => {
    if (heightFt && heightIn !== "") {
      // Force absolute values to prevent '-7' type bugs
      const ft = Math.abs(parseInt(heightFt)) || 0;
      const inch = Math.abs(parseInt(heightIn)) || 0;

      const totalInches = (ft * 12) + inch;
      const heightM = totalInches * 0.0254;

      if (heightM > 0) {
        if (weight) {
          const weightKg = parseFloat(weight);
          const calculatedBmi = weightKg / (heightM * heightM);
          setBmi(calculatedBmi.toFixed(1));
        } else {
          setBmi(null);
        }

        // Standard healthy BMI range: 18.5 - 25.0
        const minW = 18.5 * (heightM * heightM);
        const maxW = 25.0 * (heightM * heightM);
        setIdealRange({ min: minW.toFixed(1), max: maxW.toFixed(1) });
      }
    } else {
      setBmi(null);
      setIdealRange(null);
    }
  }, [weight, heightFt, heightIn]);

  const handleBack = () => {
    if (isDirty) {
      if (window.confirm("Discard unsaved changes?")) {
        navigate("/");
      }
    } else {
      navigate("/");
    }
  };

  const handleImageUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setUploadLoading(true);
    const formData = new FormData();
    formData.append("file", file);
    formData.append("upload_preset", import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET?.trim());

    try {
      const response = await fetch(
        `https://api.cloudinary.com/v1_1/${import.meta.env.VITE_CLOUDINARY_CLOUD_NAME}/image/upload`,
        { method: "POST", body: formData }
      );
      const data = await response.json();
      if (data.secure_url) {
        setProfileImage(data.secure_url);
        toast.success("Profile picture updated.");
      } else {
        throw new Error(data.error?.message || "Upload failed. Verify Cloudinary preset is 'Unsigned'.");
      }
    } catch (error) {
      toast.error("Upload error: " + error.message);
    } finally {
      setUploadLoading(false);
    }
  };

  async function handleSave(e) {
    if (e) e.preventDefault();
    if (!name || !selectedGoal || !weight || !heightFt || !sex) {
      toast.error("Please fill in all core fitness data.");
      return;
    }

    setIsSubmitting(true);
    try {
      await updateProfile({
        name,
        age: parseInt(age || 0),
        goal: selectedGoal,
        photoURL: profileImage,
        weight: parseFloat(weight),
        heightFt: Math.abs(parseInt(heightFt)),
        heightIn: Math.abs(parseInt(heightIn || 0)),
        sex,
        bmi: parseFloat(bmi),
        profileComplete: true,
        updatedAt: new Date().toISOString()
      });
      toast.success("Profile saved successfully!");
      navigate("/");
    } catch (error) {
      toast.error("Save failed: " + error.message);
    } finally {
      setIsSubmitting(false);
    }
  }

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="animate-pulse flex flex-col items-center gap-4">
        <div className="h-1 w-48 bg-primary/20 rounded-full overflow-hidden">
          <div className="h-full bg-primary animate-progress" style={{ width: '40%' }} />
        </div>
        <p className="text-[10px] font-label uppercase tracking-widest text-surface-variant font-bold italic">Loading profile...</p>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-background text-on-background py-10 sm:py-16 px-4 sm:px-6 relative overflow-hidden">
      {/* Background decoration */}
      <div className="absolute top-0 right-0 w-[300px] sm:w-[500px] h-[300px] sm:h-[500px] bg-primary/5 blur-[120px] rounded-full -translate-y-1/2 translate-x-1/2" />

      <div className="max-w-4xl mx-auto space-y-10 sm:space-y-12 relative z-10">
        <div className="space-y-4 sm:space-y-6">
          <div className="flex items-center justify-between">
            {/* Top Progress Bar */}
            <div className="flex items-center gap-3 sm:gap-4 text-surface-variant">
              <div className="w-16 sm:w-24 h-1 bg-surface-container-highest rounded-full overflow-hidden">
                <div
                  className="h-full bg-primary shadow-[0_0_10px_var(--color-primary)] transition-all duration-1000"
                  style={{ width: name && weight && heightFt && sex && selectedGoal ? '100%' : '60%' }}
                />
              </div>
              <span className="text-[9px] sm:text-[10px] font-label uppercase tracking-widest font-black whitespace-nowrap">Progress Complete</span>
            </div>

            {userData?.profileComplete && (
              <button
                type="button"
                onClick={handleBack}
                className="flex items-center gap-1 group text-surface-variant hover:text-primary transition-all pr-1"
              >
                <ChevronLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
                <span className="text-[9px] font-black italic uppercase tracking-[0.15em]">Back</span>
              </button>
            )}
          </div>

          <header className="space-y-6 sm:space-y-8 flex flex-col sm:flex-row sm:items-end justify-between border-b border-white/5 pb-8 sm:pb-12">
            <div>
              <h1 className="text-4xl sm:text-6xl font-black italic uppercase tracking-tighter leading-none">
                Profile <span className="text-primary italic">Setup</span>
              </h1>
              <p className="text-surface-variant font-label uppercase tracking-widest text-[9px] sm:text-[10px] font-bold ml-1 mt-2 sm:mt-0">
                Tell us a bit about yourself to get started
              </p>
            </div>

            <div className="flex items-center gap-8 sm:gap-12 flex-wrap">
              {idealRange && (
                <div className="flex flex-col items-start sm:items-end gap-1 animate-in slide-in-from-right-4 duration-500">
                  <span className="text-[9px] sm:text-[10px] font-label text-surface-variant uppercase tracking-widest font-black">Healthy Weight Range</span>
                  <div className="flex items-baseline gap-1">
                    <span className="text-2xl sm:text-3xl font-black italic text-surface-variant/40 leading-none">{idealRange.min} - {idealRange.max}</span>
                    <span className="text-[9px] font-label uppercase text-primary font-black italic tracking-widest">KG</span>
                  </div>
                </div>
              )}
              {bmi && (
                <div className="flex items-center sm:flex-col sm:items-end justify-between sm:justify-start gap-4 sm:gap-0 animate-in fade-in zoom-in translate-y-0 sm:translate-y-2">
                  <span className="text-[9px] sm:text-[10px] font-label text-surface-variant uppercase tracking-widest font-black">Current BMI</span>
                  <span className="text-4xl sm:text-5xl font-black italic text-primary leading-none">{bmi}</span>
                </div>
              )}
            </div>
          </header>
        </div>

        <form onSubmit={handleSave} className="space-y-10 sm:space-y-16">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-12 sm:gap-20">
            {/* Left side: Photo & Name */}
            <div className="space-y-10 sm:space-y-12">
              <section className="space-y-6 flex flex-col">
                <h2 className="text-lg font-bold flex items-center gap-3 italic">
                  <span className="text-primary font-black">01 /</span> Profile Picture
                </h2>
                <div className="relative group w-full aspect-square max-w-[240px] sm:max-w-[280px] mx-auto sm:mx-0">
                  <div className={`
                            w-full h-full rounded-3xl overflow-hidden border-2 border-dashed transition-all duration-500
                            ${profileImage ? "border-primary" : "border-white/10 hover:border-primary"}
                            bg-surface-container-low flex items-center justify-center
                        `}>
                    {profileImage ? (
                      <img src={profileImage} alt="Profile" className="w-full h-full object-cover" />
                    ) : (
                      <div className="flex flex-col items-center gap-3 text-surface-variant">
                        <Camera className="w-10 h-10 sm:w-12 sm:h-12 opacity-20" />
                        <span className="text-[9px] sm:text-[10px] font-label uppercase tracking-widest font-black opacity-30">No Data</span>
                      </div>
                    )}
                  </div>
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="absolute -bottom-3 -right-3 sm:-bottom-4 sm:-right-4 p-4 sm:p-5 rounded-2xl bg-primary text-on-primary shadow-xl shadow-primary/30 hover:scale-110 active:scale-95 transition-all"
                  >
                    <UploadCloud className="w-5 h-5 sm:w-6 sm:h-6" />
                  </button>
                  <input type="file" className="hidden" ref={fileInputRef} onChange={handleImageUpload} accept="image/*" />
                </div>
              </section>

              <section className="space-y-6">
                <h2 className="text-lg font-bold flex items-center gap-3 italic">
                  <span className="text-primary font-black">02 /</span> Full Name
                </h2>
                <input
                  type="text"
                  name="athlete-name"
                  autoComplete="off"
                  required
                  placeholder="ENTER NAME"
                  className="w-full bg-transparent border-0 border-b-2 border-white/10 focus:border-primary px-0 py-3 sm:py-4 text-2xl sm:text-3xl font-black text-on-background transition-all focus:outline-none placeholder:text-surface-variant/20 tracking-tighter italic uppercase"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                />
              </section>
            </div>

            {/* Right side: Body Stats */}
            <div className="space-y-10 sm:space-y-12">
              <section className="space-y-6 sm:space-y-8">
                <h2 className="text-lg font-bold flex items-center gap-3 italic">
                  <span className="text-primary font-black">03 /</span> Body Stats
                </h2>

                <div className="grid grid-cols-2 gap-6 sm:gap-8">
                  {/* Sex */}
                  <div className="col-span-2 space-y-3">
                    <label className="text-[9px] sm:text-[10px] font-label text-surface-variant uppercase tracking-widest font-black">Sex Assigned at Birth</label>
                    <div className="flex gap-4">
                      {['male', 'female'].map(s => (
                        <button
                          key={s}
                          type="button"
                          onClick={() => setSex(s)}
                          className={`
                                            flex-1 py-3 sm:py-4 rounded-xl font-black italic uppercase transition-all border-2 text-sm sm:text-base
                                            ${sex === s ? "bg-primary text-on-primary border-primary" : "bg-surface-container-low border-transparent text-surface-variant hover:bg-white/5"}
                                        `}
                        >
                          {s}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Weight */}
                  <div className="space-y-3">
                    <label className="text-[9px] sm:text-[10px] font-label text-surface-variant uppercase tracking-widest font-black">Weight (KG)</label>
                    <input
                      type="number"
                      name="athlete-weight"
                      autoComplete="off"
                      required
                      step="0.1"
                      placeholder="00.0"
                      className="w-full bg-surface-container-low border-0 border-b-2 border-white/5 focus:border-primary p-4 sm:p-5 text-2xl sm:text-3xl font-black italic transition-all focus:outline-none rounded-t-xl"
                      value={weight}
                      onChange={(e) => setWeight(e.target.value)}
                    />
                  </div>

                  {/* Height Feet & Inches */}
                  <div className="space-y-3">
                    <label className="text-[9px] sm:text-[10px] font-label text-surface-variant uppercase tracking-widest font-black">Height (FT & IN)</label>
                    <div className="flex gap-2 sm:gap-3 h-[58px] sm:h-[74px]">
                      <div className="relative flex-1">
                        <input
                          type="number"
                          name="athlete-height-ft"
                          autoComplete="off"
                          required
                          placeholder="FT"
                          className="w-full h-full bg-surface-container-low border-0 border-b-2 border-white/5 focus:border-primary p-2 sm:p-5 pt-5 sm:pt-7 text-2xl sm:text-3xl font-black italic transition-all focus:outline-none rounded-t-xl text-center"
                          value={heightFt}
                          onChange={(e) => setHeightFt(e.target.value)}
                        />
                        <span className="absolute top-1 sm:top-2 left-1/2 -translate-x-1/2 text-[7px] sm:text-[9px] font-black uppercase text-primary tracking-widest pointer-events-none">Feet</span>
                      </div>
                      <div className="relative flex-1">
                        <input
                          type="number"
                          name="athlete-height-in"
                          autoComplete="off"
                          placeholder="IN"
                          className="w-full h-full bg-surface-container-low border-0 border-b-2 border-white/5 focus:border-primary p-2 sm:p-5 pt-5 sm:pt-7 text-2xl sm:text-3xl font-black italic transition-all focus:outline-none rounded-t-xl text-center"
                          value={heightIn}
                          onChange={(e) => setHeightIn(e.target.value)}
                        />
                        <span className="absolute top-1 sm:top-2 left-1/2 -translate-x-1/2 text-[7px] sm:text-[9px] font-black uppercase text-primary tracking-widest pointer-events-none">Inches</span>
                      </div>
                    </div>
                  </div>
                </div>
              </section>

              <section className="space-y-8">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-8">
                  <div className="space-y-6">
                    <h2 className="text-lg font-bold flex items-center gap-3 italic">
                      <span className="text-primary font-black">04 /</span> Fitness Goal
                    </h2>
                    <div className="grid grid-cols-2 gap-4">
                      {goals.map((goal) => (
                        <button
                          key={goal.id}
                          type="button"
                          onClick={() => setSelectedGoal(goal.id)}
                          className={`
                                            p-6 rounded-2xl border-2 flex flex-col items-center justify-center gap-3 transition-all text-center group relative overflow-hidden
                                            ${selectedGoal === goal.id ? "border-primary bg-primary/5 shadow-[0_0_20px_rgba(249,115,22,0.1)]" : "border-transparent bg-surface-container-low/60 hover:bg-white/5"}
                                        `}
                        >
                          <goal.icon className={`w-8 h-8 ${selectedGoal === goal.id ? "text-primary scale-110" : "text-surface-variant"} transition-transform`} />
                          <span className={`text-xl font-black italic uppercase leading-none ${selectedGoal === goal.id ? "text-primary" : "text-white"}`}>{goal.title}</span>
                          {selectedGoal === goal.id && (
                            <div className="absolute top-3 right-3 animate-pulse">
                                <CheckCircle2 className="w-3 h-3 text-primary" />
                            </div>
                          )}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="space-y-6">
                    <h2 className="text-lg font-bold flex items-center gap-3 italic">
                      <span className="text-primary font-black">05 /</span> Age
                    </h2>
                    <input
                      type="number"
                      name="athlete-age"
                      autoComplete="off"
                      required
                      min="1"
                      max="120"
                      placeholder="YOUR AGE"
                      className="w-full bg-surface-container-low border-0 border-b-2 border-white/5 focus:border-primary p-4 sm:p-5 text-2xl sm:text-3xl font-black italic transition-all focus:outline-none rounded-t-xl"
                      value={age}
                      onChange={(e) => setAge(e.target.value)}
                    />
                    <p className="text-[10px] font-label text-surface-variant uppercase tracking-widest font-bold">Standard fitness assessments vary based on age</p>
                  </div>
                </div>
              </section>
            </div>
          </div>

          <footer className="pt-12 border-t border-white/10 flex flex-col sm:flex-row items-center justify-between gap-10">
            <div className="flex items-center gap-4 text-surface-variant">
              <div className="w-12 h-1 bg-surface-container-highest rounded-full overflow-hidden">
                <div
                  className="h-full bg-primary shadow-[0_0_10px_var(--color-primary)] transition-all duration-1000"
                  style={{ width: name && weight && heightFt && sex && selectedGoal ? '100%' : '60%' }}
                />
              </div>
              <span className="text-[10px] font-label uppercase tracking-widest font-black">Progress Complete</span>
            </div>

            <Button
              type="submit"
              className="w-1/2 sm:w-auto h-20 sm:h-24 px-12 sm:px-20 text-2xl sm:text-3xl font-black italic uppercase shadow-2xl shadow-primary/20 tracking-wider group flex items-center justify-center shrink-0"
              disabled={isSubmitting || (userData?.profileComplete && !isDirty)}
              size="lg"
            >
              {isSubmitting ? "Syncing..." : (
                !userData?.profileComplete ? "Save Profile" :
                  isDirty ? "Save Changes" : "Profile Up to Date"
              )}
              {!isSubmitting && isDirty && <ArrowRight className="ml-3 w-6 h-6 sm:w-8 sm:h-8 group-hover:translate-x-2 transition-transform" />}
              {!isSubmitting && !isDirty && userData?.profileComplete && <CheckCircle2 className="ml-3 w-6 h-6 sm:w-8 sm:h-8 text-primary/50" />}
            </Button>
          </footer>
        </form>
      </div>
    </div>
  );
}

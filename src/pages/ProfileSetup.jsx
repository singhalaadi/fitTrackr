import { useState, useEffect, useRef, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { useUser } from "../contexts/UserContext";
import { useAuth } from "../contexts/AuthContext";
import toast from "react-hot-toast";
import Button from "../components/common/Button";
import {
  Flame,
  Zap,
  ArrowRight,
  TrendingUp,
  Activity,
  CheckCircle2
} from "lucide-react";

// Modular Components
import ProfileHeader from "../components/profile/ProfileHeader";
import PhotoSection from "../components/profile/PhotoSection";
import BodyStatsSection from "../components/profile/BodyStatsSection";
import GoalSection from "../components/profile/GoalSection";
import PreferencesSection from "../components/profile/PreferencesSection";

const goals = [
  { id: "cut", title: "CUT", label: "Reduce Body Fat", icon: Flame, color: "#f97316" },
  { id: "bulk", title: "BULK", label: "Build Muscle Mass", icon: TrendingUp, color: "#ea580c" },
  { id: "gain", title: "GAIN", label: "Strength & Power", icon: Zap, color: "#fdba74" },
  { id: "weight_loss", title: "LOSE", label: "Weight Management", icon: Activity, color: "#fcd34d" },
];

export default function ProfileSetup() {
  const { userData, updateProfile, loading } = useUser();
  const { currentUser } = useAuth();
  const navigate = useNavigate();
  const fileInputRef = useRef(null);
  const isInitialized = useRef(false);

  const [name, setName] = useState("");
  const [age, setAge] = useState("");
  const [selectedGoal, setSelectedGoal] = useState("");
  const [profileImage, setProfileImage] = useState("");
  const [weight, setWeight] = useState("");
  const [heightFt, setHeightFt] = useState("");
  const [heightIn, setHeightIn] = useState("");
  const [gender, setGender] = useState("");
  const [weekStartDay, setWeekStartDay] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [uploadLoading, setUploadLoading] = useState(false);

  useEffect(() => {
    if (userData && !isInitialized.current) {
      setName(userData.name || currentUser?.displayName || "");
      setAge(userData.age?.toString() || "");
      setSelectedGoal(userData.goal || "");
      setProfileImage(userData.photoURL || "");
      setWeight(userData.weight?.toString() || "");
      setHeightFt(userData.heightFt?.toString() || "");
      setHeightIn(userData.heightIn?.toString() || "");
      setGender(userData.gender || userData.sex || "");
      setWeekStartDay(userData.weekStartDay || 1);
      isInitialized.current = true;
    }
  }, [userData, currentUser]);

  const { bmi, idealRange } = useMemo(() => {
    if (heightFt && heightIn !== "") {
      const ft = Math.abs(parseInt(heightFt)) || 0;
      const inch = Math.abs(parseInt(heightIn)) || 0;
      const totalInches = (ft * 12) + inch;
      const heightM = totalInches * 0.0254;
      if (heightM > 0) {
        const minW = 18.5 * (heightM * heightM);
        const maxW = 25.0 * (heightM * heightM);
        const calcBmi = weight ? (parseFloat(weight) / (heightM * heightM)).toFixed(1) : null;
        return { bmi: calcBmi, idealRange: { min: minW.toFixed(1), max: maxW.toFixed(1) } };
      }
    }
    return { bmi: null, idealRange: null };
  }, [weight, heightFt, heightIn]);

  const isDirty = useMemo(() => (
    name !== (userData?.name || currentUser?.displayName || "") ||
    age !== (userData?.age?.toString() || "") ||
    selectedGoal !== (userData?.goal || "") ||
    profileImage !== (userData?.photoURL || "") ||
    weight !== (userData?.weight?.toString() || "") ||
    heightFt !== (userData?.heightFt?.toString() || "") ||
    heightIn !== (userData?.heightIn?.toString() || "") ||
    gender !== (userData?.gender || userData?.sex || "") ||
    weekStartDay !== (userData?.weekStartDay || 1)
  ), [name, age, selectedGoal, profileImage, weight, heightFt, heightIn, gender, weekStartDay, userData, currentUser]);

  const handleImageUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setUploadLoading(true);
    const formData = new FormData();
    formData.append("file", file);
    formData.append("upload_preset", import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET?.trim());
    try {
      const response = await fetch(`https://api.cloudinary.com/v1_1/${import.meta.env.VITE_CLOUDINARY_CLOUD_NAME}/image/upload`, { method: "POST", body: formData });
      const data = await response.json();
      if (data.secure_url) {
        setProfileImage(data.secure_url);
        toast.success("Profile photo updated.");
      } else throw new Error(data.error?.message || "Upload failed.");
    } catch (error) { toast.error("Upload error: " + error.message); } finally { setUploadLoading(false); }
  };

  const handleSave = async (e) => {
    if (e) e.preventDefault();
    if (!name || !selectedGoal || !weight || !heightFt || !gender) {
      toast.error("Required fields missing.");
      return;
    }
    setIsSubmitting(true);
    try {
      await updateProfile({
        name, age: parseInt(age || 0), goal: selectedGoal, photoURL: profileImage,
        weight: parseFloat(weight), heightFt: Math.abs(parseInt(heightFt)),
        heightIn: Math.abs(parseInt(heightIn || 0)), gender, weekStartDay,
        bmi: parseFloat(bmi), profileComplete: true, updatedAt: new Date().toISOString()
      });
      toast.success("Profile synchronized!");
      navigate("/");
    } catch (error) { toast.error("Save failed: " + error.message); } finally { setIsSubmitting(false); }
  };

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="w-12 h-12 rounded-full border-4 border-primary/20 border-t-primary animate-spin" />
    </div>
  );

  return (
    <div className="min-h-screen bg-background text-on-background py-10 sm:py-16 px-4 sm:px-6 relative overflow-hidden">
      <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-primary/5 blur-[120px] rounded-full -translate-y-1/2 translate-x-1/2" />

      <div className="max-w-4xl mx-auto space-y-10 sm:space-y-12 relative z-10">
        <ProfileHeader 
          userData={userData} 
          handleBack={() => isDirty ? window.confirm("Discard changes?") && navigate("/") : navigate("/")} 
          idealRange={idealRange} 
          bmi={bmi} 
          isComplete={name && weight && heightFt && gender && selectedGoal} 
        />

        <form onSubmit={handleSave} className="space-y-10 sm:space-y-16">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-12 sm:gap-20">
            <div className="space-y-10 sm:space-y-12">
              <PhotoSection 
                profileImage={profileImage} 
                fileInputRef={fileInputRef} 
                handleImageUpload={handleImageUpload} 
              />
              <section className="space-y-6">
                <h2 className="text-lg font-bold flex items-center gap-3 italic">
                  <span className="text-primary font-black">02 /</span> Full Name
                </h2>
                <input
                  type="text"
                  placeholder="ENTER NAME"
                  className="w-full bg-transparent border-0 border-b-2 border-white/10 focus:border-primary px-0 py-3 sm:py-4 text-2xl sm:text-3xl font-black text-on-background transition-all focus:outline-none placeholder:text-surface-variant/20 tracking-tighter italic uppercase"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                />
              </section>
            </div>

            <div className="space-y-10 sm:space-y-12">
              <BodyStatsSection 
                gender={gender} setGender={setGender} weight={weight} setWeight={setWeight} 
                heightFt={heightFt} setHeightFt={setHeightFt} heightIn={heightIn} setHeightIn={setHeightIn} 
              />
              <div className="space-y-12">
                <GoalSection goals={goals} selectedGoal={selectedGoal} setSelectedGoal={setSelectedGoal} />
                <PreferencesSection age={age} setAge={setAge} weekStartDay={weekStartDay} setWeekStartDay={setWeekStartDay} />
              </div>
            </div>
          </div>

          <footer className="pt-12 border-t border-white/10 flex flex-col sm:flex-row items-center justify-between gap-10">
            <div className="flex items-center gap-4 text-surface-variant">
              <div className="w-12 h-1 bg-surface-container-highest rounded-full overflow-hidden">
                <div className="h-full bg-primary shadow-[0_0_10px_var(--color-primary)] transition-all duration-1000" style={{ width: isDirty ? '60%' : '100%' }} />
              </div>
              <span className="text-[10px] font-label uppercase tracking-widest font-black">Profile Sync Status</span>
            </div>

            <Button
              type="submit"
              className="w-1/2 sm:w-auto h-20 sm:h-24 px-12 sm:px-20 text-2xl sm:text-3xl font-black italic uppercase shadow-2xl shadow-primary/20 tracking-wider group flex items-center justify-center shrink-0"
              disabled={isSubmitting || (userData?.profileComplete && !isDirty)}
              size="lg"
            >
              {isSubmitting ? "Syncing..." : (isDirty ? "Save Changes" : "Up to Date")}
              {!isSubmitting && isDirty && <ArrowRight className="ml-3 w-6 h-6 sm:w-8 sm:h-8 group-hover:translate-x-2 transition-transform" />}
              {!isSubmitting && !isDirty && userData?.profileComplete && <CheckCircle2 className="ml-3 w-6 h-6 sm:w-8 sm:h-8 text-primary/50" />}
            </Button>
          </footer>
        </form>
      </div>
    </div>
  );
}

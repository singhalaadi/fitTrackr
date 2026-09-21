import { useEffect, useState } from "react";
import { auth, googleProvider, db } from "../config/firebase";
import {
  onAuthStateChanged,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  signInWithPopup,
  updateProfile
} from "firebase/auth";
import { doc, setDoc } from "firebase/firestore";
import AuthContext from "./AuthContext";

export default function AuthProvider({ children }) {
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(true);

  async function signup(email, password, name) {
    const res = await createUserWithEmailAndPassword(auth, email, password);
    await updateProfile(res.user, { displayName: name });

    await setDoc(doc(db, "users", res.user.uid), {
      name,
      email,
      uid: res.user.uid,
      profileComplete: false,
      createdAt: new Date().toISOString()
    });

    return res.user;
  }

  function login(email, password) {
    return signInWithEmailAndPassword(auth, email, password);
  }

  async function signInWithGoogle() {
  try {
    const result = await signInWithPopup(auth, googleProvider);

    const user = result.user;

    // Ensure the Firestore user document exists
    await setDoc(
      doc(db, "users", user.uid),
      {
        uid: user.uid,
        email: user.email || "",
        updatedAt: new Date().toISOString(),
      },
      { merge: true }
    );

    return user;
  } catch (error) {
    console.error("🔥 Google sign-in failed");
    console.error("Code:", error.code);
    console.error("Message:", error.message);
    console.error("Full error:", error);

    throw error;
  }
}

  function logout() {
    return signOut(auth);
  }

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setCurrentUser(user);
      setLoading(false);
    });

    return unsubscribe;
  }, []);

  const value = {
    currentUser,
    signup,
    login,
    logout,
    signInWithGoogle
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
}
import { createContext, useContext, useEffect, useState } from "react";
import { db } from "../config/firebase";
import { doc, onSnapshot, setDoc, updateDoc } from "firebase/firestore";
import { useAuth } from "./AuthContext";

const UserContext = createContext();

export function useUser() {
  return useContext(UserContext);
}

export function UserProvider({ children }) {
  const { currentUser } = useAuth();
  const [userData, setUserData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!currentUser) {
      setUserData(null);
      setLoading(false);
      return;
    }

    const userRef = doc(db, "users", currentUser.uid);
    const unsubscribe = onSnapshot(userRef, (snapshot) => {
      if (snapshot.exists()) {
        setUserData(snapshot.data());
      } else {
        setUserData(null);
      }
      setLoading(false);
    });

    return unsubscribe;
  }, [currentUser]);

  function updateProfile(data) {
    if (!currentUser) return;
    const userRef = doc(db, "users", currentUser.uid);
    return setDoc(userRef, data, { merge: true });
  }

  const value = {
    userData,
    updateProfile,
    loading
  };

  return (
    <UserContext.Provider value={value}>
      {children}
    </UserContext.Provider>
  );
}

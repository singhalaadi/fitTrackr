import { useEffect, useState } from "react";
import { db } from "../config/firebase";
import { doc, onSnapshot, setDoc } from "firebase/firestore";
import { useAuth } from "./useAuth";
import UserContext from "./UserContext";

export default function UserProvider({ children }) {
  const { currentUser } = useAuth();

  const [userState, setUserState] = useState({
    uid: null,
    data: null,
    loading: true,
  });

  useEffect(() => {
    if (!currentUser) {
      return;
    }

    const userRef = doc(db, "users", currentUser.uid);

    const unsubscribe = onSnapshot(
      userRef,
      (snapshot) => {
        setUserState({
          uid: currentUser.uid,
          data: snapshot.exists() ? snapshot.data() : null,
          loading: false,
        });
      },
      (error) => {
        console.error("Firestore listener error:", error);

        setUserState({
          uid: currentUser.uid,
          data: null,
          loading: false,
        });
      },
    );

    return unsubscribe;
  }, [currentUser]);

  const updateProfile = (data) => {
    if (!currentUser) return;

    const userRef = doc(db, "users", currentUser.uid);

    return setDoc(userRef, data, { merge: true });
  };

  const isCurrentUserData = currentUser && userState.uid === currentUser.uid;

  const value = {
    userData: isCurrentUserData ? userState.data : null,
    updateProfile,
    loading: currentUser ? !isCurrentUserData || userState.loading : false,
  };

  return <UserContext.Provider value={value}>{children}</UserContext.Provider>;
}

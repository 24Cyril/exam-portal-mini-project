import React, { createContext, useContext, useEffect, useState } from 'react';
import { onAuthStateChanged, signOut, type User } from 'firebase/auth';

import { auth, db } from './firebase';
import { doc, getDoc } from 'firebase/firestore';

interface UserContextType {
    user: User | null;
    role: 'student' | 'teacher' | 'admin' | null;
    loading: boolean;
    logout: () => Promise<void>;
}

const AuthContext = createContext<UserContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [user, setUser] = useState<User | null>(null);
    const [role, setRole] = useState<'student' | 'teacher' | 'admin' | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, async (user) => {
            setLoading(true);
            if (user) {
                setUser(user);

                // Fetch the user role from Firestore
                try {
                    const userRef = doc(db, 'users', user.uid);
                    const userSnap = await getDoc(userRef);
                    if (userSnap.exists()) {
                        setRole(userSnap.data().role);
                    }
                } catch (error) {
                    console.error("Error fetching user role:", error);
                }

                // Also ensure token is saved to localStorage for the axios interceptor later
                const token = await user.getIdToken();
                localStorage.setItem('token', token);
            } else {
                setUser(null);
                setRole(null);
                localStorage.removeItem('token');
            }
            setLoading(false);
        });

        return unsubscribe;
    }, []);

    const logout = async () => {
        await signOut(auth);
        localStorage.removeItem('token');
    };

    return (
        <AuthContext.Provider value={{ user, role, loading, logout }}>
            {!loading && children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
};

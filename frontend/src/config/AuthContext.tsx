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
            console.log('Auth state changed:', user?.email);
            setLoading(true);
            if (user) {
                setUser(user);

                try {
                    // 1. Check custom claims first (fastest)
                    const idTokenResult = await user.getIdTokenResult();
                    const claimRole = idTokenResult.claims.role as 'student' | 'teacher' | 'admin' | undefined;

                    if (claimRole) {
                        console.log('Role found in claims:', claimRole);
                        setRole(claimRole);
                    } else {
                        // 2. Fallback to Firestore
                        console.log('No role in claims, checking Firestore...');
                        const userRef = doc(db, 'users', user.uid);
                        const userSnap = await getDoc(userRef);
                        if (userSnap.exists()) {
                            const dbRole = userSnap.data().role;
                            console.log('Role found in Firestore:', dbRole);
                            setRole(dbRole);
                        } else {
                            console.warn('No user document found in Firestore for UID:', user.uid);
                            setRole(null);
                        }
                    }

                    // Ensure token is saved
                    const token = await user.getIdToken();
                    localStorage.setItem('token', token);
                } catch (error) {
                    console.error("Error fetching user role:", error);
                    setRole(null);
                }
            } else {
                console.log('User logged out');
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
            {children}
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

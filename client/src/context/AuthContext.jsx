import React, { createContext, useState, useEffect, useContext } from 'react';
import { loginUser, registerUser, verifyRegistrationOtp, updateProfile as updateProfileRequest } from '../api';

const AuthContext = createContext();

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const storedUser = localStorage.getItem('user');
        if (storedUser) {
            setUser(JSON.parse(storedUser));
        }
        setLoading(false);
    }, []);

    const login = async (username, password) => {
        try {
            const data = await loginUser(username, password);
            setUser(data);
            localStorage.setItem('user', JSON.stringify(data));
            return data;
        } catch (error) {
            throw error.response?.data?.message || 'Login failed';
        }
    };

    const register = async (userData) => {
        try {
            const data = await registerUser(userData);
            return data;
        } catch (error) {
            throw error.response?.data?.message || 'Registration failed';
        }
    };

    const verifyRegistration = async (registrationId, otp) => {
        try {
            const data = await verifyRegistrationOtp(registrationId, otp);
            setUser(data);
            localStorage.setItem('user', JSON.stringify(data));
            return data;
        } catch (error) {
            throw error.response?.data?.message || 'Email verification failed';
        }
    };

    const logout = () => {
        setUser(null);
        localStorage.removeItem('user');
    };

    const updateProfile = async (profileData) => {
        try {
            const data = await updateProfileRequest(profileData);
            setUser(data);
            localStorage.setItem('user', JSON.stringify(data));
            return data;
        } catch (error) {
            throw error.response?.data?.message || 'Profile update failed';
        }
    };

    return (
        <AuthContext.Provider value={{ user, login, register, verifyRegistration, updateProfile, logout, loading }}>
            {children}
        </AuthContext.Provider>
    );
};

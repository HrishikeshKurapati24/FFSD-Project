import React, { createContext, useState, useContext, useEffect } from 'react';
import { API_BASE_URL } from '../services/api';

const CustomerContext = createContext();

export const useCustomer = () => {
    const context = useContext(CustomerContext);
    if (!context) {
        throw new Error('useCustomer must be used within a CustomerProvider');
    }
    return context;
};

export const CustomerProvider = ({ children }) => {
    const [customer, setCustomer] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    // Initialize customer on mount
    useEffect(() => {
        const initializeCustomer = async () => {
            // If there is no auth token cookie, skip verify to avoid unnecessary 401 logs
            try {
                if (!document?.cookie || !document.cookie.includes('token=')) {
                    setLoading(false);
                    return;
                }

                const response = await fetch(`${API_BASE_URL}/auth/verify`, {
                    method: 'GET',
                    credentials: 'include',
                    headers: {
                        'Accept': 'application/json'
                    }
                });

                if (response.ok) {
                    const data = await response.json();
                    if (data.authenticated && data.user?.userType === 'customer') {
                        setCustomer(data.user);
                    }
                }
            } catch (error) {
                // Only log unexpected errors (network issues, parse errors)
                console.error('Error initializing customer:', error);
            } finally {
                setLoading(false);
            }
        };

        initializeCustomer();
    }, []);

    // Initialize customer with provided data
    const initializeCustomer = async (customerData) => {
        try {
            setCustomer(customerData);
            setError(null);
        } catch (error) {
            console.error('Error setting customer data:', error);
            setError(error.message);
        }
    };

    // Update customer profile
    const updateCustomerProfile = async (updatedData) => {
        try {
            const response = await fetch(`${API_BASE_URL}/customer/profile`, {
                method: 'PUT',
                credentials: 'include',
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json'
                },
                body: JSON.stringify(updatedData)
            });

            if (!response.ok) {
                throw new Error('Failed to update customer profile');
            }

            const data = await response.json();
            setCustomer(data.customer);
            setError(null);
            return data;
        } catch (error) {
            console.error('Error updating customer profile:', error);
            setError(error.message);
            throw error;
        }
    };

    // Logout customer
    const logout = () => {
        setCustomer(null);
        setError(null);
    };

    const value = {
        customer,
        loading,
        error,
        initializeCustomer,
        updateCustomerProfile,
        logout
    };

    return (
        <CustomerContext.Provider value={value}>
            {children}
        </CustomerContext.Provider>
    );
};

export default CustomerContext;

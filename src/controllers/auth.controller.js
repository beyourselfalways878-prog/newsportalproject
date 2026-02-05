import { firebaseConfig } from '../firebase.js'; // Import config only
import { generateToken } from '../config/jwt.js';
import { initializeApp, deleteApp } from "firebase/app";
import { getAuth, signInWithEmailAndPassword, createUserWithEmailAndPassword, signOut } from "firebase/auth";
import { getFirestore, doc, setDoc, getDoc } from "firebase/firestore";

const DB_ID = 'news_db'; // Not needed for Firebase but good context
const USERS_COLLECTION = 'users';

// Helper to perform auth actions with a temporary isolated app instance
// This prevents state (currentUser) from leaking between concurrent requests on the server
const performSafeAuthAction = async (action) => {
    const appName = `auth-worker-${Date.now()}-${Math.random().toString(36).substring(7)}`;
    const app = initializeApp(firebaseConfig, appName);
    const auth = getAuth(app);
    const db = getFirestore(app);

    try {
        return await action(auth, db);
    } finally {
        await deleteApp(app);
    }
};

export const authController = {
    // Register new user
    register: async (req, res) => {
        try {
            const { email, password, name } = req.body;

            // Validate input
            if (!email || !password || !name) {
                return res.status(400).json({
                    success: false,
                    error: 'Email, password, and name are required'
                });
            }

            const result = await performSafeAuthAction(async (auth, db) => {
                // 1. Create user in Firebase Auth
                const userCredential = await createUserWithEmailAndPassword(auth, email, password);
                const user = userCredential.user;

                // 2. Create user document in Firestore
                const userDocRef = doc(db, USERS_COLLECTION, user.uid);
                await setDoc(userDocRef, {
                    auth_uid: user.uid,
                    email: user.email,
                    name: name,
                    role: 'user',
                    created_at: new Date().toISOString()
                });

                // Verify doc was created (sanity check)
                const verifySnap = await getDoc(userDocRef);
                if (!verifySnap.exists()) {
                    throw new Error("Failed to verify user document creation");
                }

                return { user, name };
            });

            // 3. Generate JWT token
            const token = generateToken({
                userId: result.user.uid,
                email: result.user.email,
                name: result.name,
                role: 'user'
            });

            // 4. Send response
            res.status(201).json({
                success: true,
                message: 'User registered successfully',
                data: {
                    userId: result.user.uid,
                    email: result.user.email,
                    name: result.name,
                    token: token,
                    expiresIn: process.env.JWT_EXPIRES_IN || '24h'
                }
            });
        } catch (error) {
            console.error('Registration error:', error);
            // Firebase error handling
            let errorMessage = 'Registration failed';
            if (error.code === 'auth/email-already-in-use') {
                errorMessage = 'Email already in use';
            }
            res.status(400).json({
                success: false,
                error: errorMessage
            });
        }
    },

    // Login user
    login: async (req, res) => {
        try {
            const { email, password } = req.body;

            // Validate input
            if (!email || !password) {
                return res.status(400).json({
                    success: false,
                    error: 'Email and password are required'
                });
            }

            const result = await performSafeAuthAction(async (auth, db) => {
                // 1. SignIn to verify credentials
                const userCredential = await signInWithEmailAndPassword(auth, email, password);
                const user = userCredential.user;

                // 2. Get user role from database
                let userRole = 'user';
                let userName = '';
                try {
                    const userDocSnap = await getDoc(doc(db, USERS_COLLECTION, user.uid));
                    if (userDocSnap.exists()) {
                        const userData = userDocSnap.data();
                        userRole = userData.role || 'user';
                        userName = userData.name || '';
                    }
                } catch (err) {
                    // User document might not exist
                    console.log("Error fetching user doc", err);
                }

                // Force admin role for the owner email
                if (user.email === 'pushkarraj207@gmail.com') {
                    userRole = 'admin';
                }

                return { user, userRole, userName };
            });

            // 3. Generate JWT token
            const token = generateToken({
                userId: result.user.uid,
                email: result.user.email,
                name: result.userName,
                role: result.userRole
            });

            // 4. Send response
            res.json({
                success: true,
                message: 'Login successful',
                data: {
                    userId: result.user.uid,
                    email: result.user.email,
                    name: result.userName,
                    role: result.userRole,
                    token: token,
                    expiresIn: process.env.JWT_EXPIRES_IN || '24h'
                }
            });
        } catch (error) {
            console.error('Login error details:', error);
            res.status(401).json({
                success: false,
                error: 'Invalid email or password'
            });
        }
    },

    // Get current user profile
    getProfile: async (req, res) => {
        try {
            // Priority: params.userId > req.user.userId
            const userId = req.params.userId || req.user.userId;

            if (!userId) {
                return res.status(401).json({ success: false, error: 'User ID not found in token' });
            }

            // Fetch user doc using a fresh app instance to be consistent (or just raw REST if needed)
            // Using performSafeAction ensures we have a clean db instance
            const result = await performSafeAuthAction(async (auth, db) => {
                const userDocSnap = await getDoc(doc(db, USERS_COLLECTION, userId));
                if (!userDocSnap.exists()) {
                    throw new Error("User document not found");
                }
                return userDocSnap.data();
            });

            res.json({
                success: true,
                data: {
                    userId: userId,
                    email: result.email,
                    name: result.name,
                    role: (result.email === 'pushkarraj207@gmail.com') ? 'admin' : (result.role || 'user'),
                    createdAt: result.created_at,
                    metadata: result.metadata || {}
                }
            });
        } catch (error) {
            console.error('Get profile error:', error);
            res.status(401).json({
                success: false,
                error: 'User not found'
            });
        }
    },

    // Logout
    logout: async (req, res) => {
        // Stateless logout (client destroys token)
        // No server-side session to destroy
        res.json({
            success: true,
            message: 'Logged out successfully'
        });
    },

    // Refresh token
    refreshToken: async (req, res) => {
        try {
            const userId = req.user.userId;

            const result = await performSafeAuthAction(async (auth, db) => {
                const userDocSnap = await getDoc(doc(db, USERS_COLLECTION, userId));
                if (!userDocSnap.exists()) {
                    throw new Error("User not found");
                }
                return userDocSnap.data();
            });

            // Generate new token
            const newToken = generateToken({
                userId: userId,
                email: result.email,
                name: result.name,
                role: result.role || 'user'
            });

            res.json({
                success: true,
                data: {
                    token: newToken,
                    expiresIn: process.env.JWT_EXPIRES_IN || '24h'
                }
            });
        } catch (error) {
            console.error('Token refresh error:', error);
            res.status(401).json({
                success: false,
                error: 'Token refresh failed'
            });
        }
    }
};

import { firebaseConfig } from '../firebase.js';
import { initializeApp, deleteApp } from "firebase/app";
import { getFirestore, collection, getDocs, getDoc, addDoc, updateDoc, deleteDoc, doc, query, where, orderBy, limit as limitDoc } from "firebase/firestore";
import { getStorage, ref, uploadString, getDownloadURL } from "firebase/storage";

const ARTICLES_COLLECTION = 'articles';

// Safe helper for stateless execution
const performSafeAction = async (action) => {
    const appName = `worker-${Date.now()}-${Math.random().toString(36).substring(7)}`;
    const app = initializeApp(firebaseConfig, appName);
    const db = getFirestore(app);
    const storage = getStorage(app);

    try {
        return await action(db, storage);
    } finally {
        await deleteApp(app);
    }
};

export const articleController = {
    // List articles with filters
    list: async (req, res) => {
        try {
            const { category, limit, offset, featured } = req.query;

            const data = await performSafeAction(async (db) => {
                let q = collection(db, ARTICLES_COLLECTION);
                let constraints = [];

                if (category && category !== 'all') {
                    constraints.push(where('category', '==', category));
                }

                if (featured === 'true') {
                    constraints.push(where('is_featured', '==', true));
                }

                // Default sort by date desc
                constraints.push(orderBy('published_at', 'desc'));

                if (limit) {
                    constraints.push(limitDoc(parseInt(limit)));
                }

                const finalQuery = query(q, ...constraints);
                const querySnapshot = await getDocs(finalQuery);

                return querySnapshot.docs.map(doc => ({
                    id: doc.id,
                    ...doc.data()
                }));
            });

            res.json({ success: true, data });
        } catch (error) {
            console.error('List articles error:', error);
            res.status(500).json({ success: false, error: 'Failed to fetch articles' });
        }
    },

    // Get trending topics
    getTrending: async (req, res) => {
        try {
            const data = await performSafeAction(async (db) => {
                const q = query(
                    collection(db, ARTICLES_COLLECTION),
                    orderBy('published_at', 'desc'),
                    limitDoc(5)
                );
                const querySnapshot = await getDocs(q);
                return querySnapshot.docs.map(doc => ({
                    id: doc.id,
                    ...doc.data()
                }));
            });
            res.json({ success: true, data });
        } catch (error) {
            console.error('Trending error:', error);
            res.status(500).json({ success: false, error: 'Failed to fetch trending topics' });
        }
    },

    // Get single article
    get: async (req, res) => {
        try {
            const { id } = req.params;
            const data = await performSafeAction(async (db) => {
                const docRef = doc(db, ARTICLES_COLLECTION, id);
                const docSnap = await getDoc(docRef);
                if (!docSnap.exists()) return null;
                return { id: docSnap.id, ...docSnap.data() };
            });

            if (!data) {
                return res.status(404).json({ success: false, error: 'Article not found' });
            }

            res.json({ success: true, data });
        } catch (error) {
            console.error('Get article error:', error);
            res.status(500).json({ success: false, error: 'Failed to fetch article' });
        }
    },

    // Create article
    create: async (req, res) => {
        try {
            const articleData = req.body;
            const userId = req.user.userId;

            const result = await performSafeAction(async (db) => {
                const newArticle = {
                    ...articleData,
                    author_id: userId,
                    is_featured: articleData.is_featured || false,
                    is_breaking: articleData.is_breaking || false,
                    views: 0,
                    published_at: articleData.published_at || new Date().toISOString(),
                    created_at: new Date().toISOString(),
                    updated_at: new Date().toISOString()
                };

                const docRef = await addDoc(collection(db, ARTICLES_COLLECTION), newArticle);
                return { id: docRef.id, ...newArticle };
            });

            res.status(201).json({ success: true, data: result });
        } catch (error) {
            console.error('Create article error:', error);
            res.status(500).json({ success: false, error: 'Failed to create article' });
        }
    },

    // Update article
    update: async (req, res) => {
        try {
            const { id } = req.params;
            const updateData = req.body;

            const result = await performSafeAction(async (db) => {
                const docRef = doc(db, ARTICLES_COLLECTION, id);
                const docSnap = await getDoc(docRef);

                if (!docSnap.exists()) {
                    return null;
                }

                const updatedArticle = {
                    ...updateData,
                    updated_at: new Date().toISOString()
                };

                await updateDoc(docRef, updatedArticle);
                return { id, ...docSnap.data(), ...updatedArticle };
            });

            if (!result) {
                return res.status(404).json({ success: false, error: 'Article not found' });
            }

            res.json({ success: true, data: result });
        } catch (error) {
            console.error('Update article error:', error);
            res.status(500).json({ success: false, error: 'Failed to update article' });
        }
    },

    // Delete article
    delete: async (req, res) => {
        try {
            const { id } = req.params;

            await performSafeAction(async (db) => {
                const docRef = doc(db, ARTICLES_COLLECTION, id);
                const docSnap = await getDoc(docRef);

                if (!docSnap.exists()) {
                    throw new Error('NOT_FOUND');
                }

                await deleteDoc(docRef);
            });

            res.json({ success: true, message: 'Article deleted successfully' });
        } catch (error) {
            if (error.message === 'NOT_FOUND') {
                return res.status(404).json({ success: false, error: 'Article not found' });
            }
            console.error('Delete article error:', error);
            res.status(500).json({ success: false, error: 'Failed to delete article' });
        }
    },

    // Toggle featured status
    toggleFeatured: async (req, res) => {
        try {
            const { id } = req.params;

            const result = await performSafeAction(async (db) => {
                const docRef = doc(db, ARTICLES_COLLECTION, id);
                const docSnap = await getDoc(docRef);

                if (!docSnap.exists()) {
                    return null;
                }

                const currentData = docSnap.data();
                const newFeaturedStatus = !currentData.is_featured;

                await updateDoc(docRef, {
                    is_featured: newFeaturedStatus,
                    updated_at: new Date().toISOString()
                });

                return { id, ...currentData, is_featured: newFeaturedStatus };
            });

            if (!result) {
                return res.status(404).json({ success: false, error: 'Article not found' });
            }

            res.json({ success: true, data: result });
        } catch (error) {
            console.error('Toggle featured error:', error);
            res.status(500).json({ success: false, error: 'Failed to toggle featured status' });
        }
    },

    // Upload image
    uploadImage: async (req, res) => {
        try {
            const { filename, content_type, data } = req.body;

            const url = await performSafeAction(async (db, storage) => {
                const storageRef = ref(storage, `article-images/${Date.now()}-${filename}`);
                await uploadString(storageRef, data, 'base64', { contentType: content_type });
                return await getDownloadURL(storageRef);
            });

            res.json({ success: true, url });
        } catch (error) {
            console.error('Upload image error:', error);
            res.status(500).json({ success: false, error: 'Image upload failed' });
        }
    },

    // Upload video
    uploadVideo: async (req, res) => {
        try {
            const { filename, content_type, data } = req.body;

            if (!data) {
                return res.status(400).json({ success: false, error: 'Video data is required' });
            }

            const url = await performSafeAction(async (db, storage) => {
                const storageRef = ref(storage, `article-videos/${Date.now()}-${filename}`);
                await uploadString(storageRef, data, 'base64', { contentType: content_type });
                return await getDownloadURL(storageRef);
            });

            res.json({ success: true, url });
        } catch (error) {
            console.error('Upload video error:', error);
            res.status(500).json({ success: false, error: 'Video upload failed' });
        }
    }
};


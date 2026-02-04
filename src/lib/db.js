// Database query helper for frontend
// All queries go through API endpoints

export async function fetchArticles(filters = {}) {
    const params = new URLSearchParams();
    if (filters.category) params.append('category', filters.category);
    if (filters.limit) params.append('limit', filters.limit);
    if (filters.offset) params.append('offset', filters.offset);
    if (filters.featured) params.append('featured', filters.featured);

    const response = await fetch(`/api/articles?${params}`);
    if (!response.ok) throw new Error('Failed to fetch articles');
    const json = await response.json();
    return json.data || []; // Extract data array from response
}

export async function fetchArticle(id) {
    const response = await fetch(`/api/articles/${id}`);
    if (!response.ok) throw new Error('Failed to fetch article');
    const json = await response.json();
    return json.data; // Extract data from response
}

export async function fetchTrendingTopics() {
    const response = await fetch('/api/trending-topics');
    if (!response.ok) throw new Error('Failed to fetch trending topics');
    const json = await response.json();
    return json.data || []; // Extract data array from response
}

export async function createArticle(articleData, token) {
    const response = await fetch('/api/create-article', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(articleData),
    });

    if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to create article');
    }

    const json = await response.json();
    return json.data;
}

export async function updateArticle(id, articleData, token) {
    const response = await fetch(`/api/articles/${id}`, {
        method: 'PUT',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(articleData),
    });

    if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to update article');
    }

    const json = await response.json();
    return json.data;
}

export async function deleteArticle(id, token) {
    const response = await fetch(`/api/articles/${id}`, {
        method: 'DELETE',
        headers: {
            'Authorization': `Bearer ${token}`,
        },
    });

    if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to delete article');
    }

    return true;
}

export async function toggleFeatured(id, token) {
    const response = await fetch(`/api/articles/${id}/featured`, {
        method: 'PATCH',
        headers: {
            'Authorization': `Bearer ${token}`,
        },
    });

    if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to toggle featured status');
    }

    const json = await response.json();
    return json.data;
}

export async function uploadImage(file, token) {
    const reader = new FileReader();
    return new Promise((resolve, reject) => {
        reader.onload = async () => {
            const base64 = reader.result.split(',')[1];
            try {
                const response = await fetch('/api/upload-image', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${token}`,
                    },
                    body: JSON.stringify({
                        filename: file.name,
                        content_type: file.type,
                        data: base64,
                    }),
                });

                if (!response.ok) {
                    const error = await response.json();
                    throw new Error(error.error || 'Failed to upload image');
                }

                resolve(await response.json());
            } catch (error) {
                reject(error);
            }
        };
        reader.onerror = () => reject(new Error('Failed to read file'));
        reader.readAsDataURL(file);
    });
}

export async function uploadVideo(file, token) {
    const reader = new FileReader();
    return new Promise((resolve, reject) => {
        reader.onload = async () => {
            const base64 = reader.result.split(',')[1];
            try {
                const response = await fetch('/api/upload-video', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${token}`,
                    },
                    body: JSON.stringify({
                        filename: file.name,
                        content_type: file.type,
                        data: base64,
                    }),
                });

                if (!response.ok) {
                    const error = await response.json();
                    throw new Error(error.error || 'Failed to upload video');
                }

                resolve(await response.json());
            } catch (error) {
                reject(error);
            }
        };
        reader.onerror = () => reject(new Error('Failed to read file'));
        reader.readAsDataURL(file);
    });
}


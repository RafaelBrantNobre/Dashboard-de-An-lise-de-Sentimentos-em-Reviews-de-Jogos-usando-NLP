const BASE_URL = "http://localhost:8000";

async function fetchAPI(endpoint, options = {}) {
    try {
        const response = await fetch(`${BASE_URL}${endpoint}`, {
            ...options,
            headers: {
                'Content-Type': 'application/json',
                ...options.headers
            }
        });

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        return await response.json();
    } catch (error) {
        console.error('API Error:', error);
        throw error;
    }
}

async function getReviews(limit = 25, score = null) {
    const params = new URLSearchParams();
    params.set('limit', String(limit));
    if (score !== null && score !== '') {
        // map score -> sentiment expected by API (1 or -1)
        params.set('sentiment', String(score));
    }
    return await fetchAPI(`/predictions?${params.toString()}`);
}

async function getReviewsStats() {
    // legacy: no exact equivalent in backend; return a small predictions sample
    return await fetchAPI('/predictions?limit=10');
}

async function analyzeSentiment(text) {
    // New API expects JSON { review: string } at /predict/text
    return await fetchAPI('/predict/text', {
        method: 'POST',
        body: JSON.stringify({ review: text })
    });
}

async function healthCheck() {
    return await fetchAPI('/health');
}

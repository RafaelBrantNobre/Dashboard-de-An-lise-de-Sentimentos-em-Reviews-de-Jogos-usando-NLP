function switchScreen(screenId) {
    document.querySelectorAll('.screen').forEach(screen => {
        screen.classList.remove('active');
    });

    document.querySelectorAll('.nav-btn').forEach(btn => {
        btn.classList.remove('active');
    });

    document.getElementById(`screen-${screenId}`).classList.add('active');
    document.getElementById(`btn-${screenId}`).classList.add('active');
}

async function loadOverviewData() {
    try {
        const stats = await getReviewsStats();
        updateStats(stats);
        createScoreChart(stats);
    } catch (error) {
        showError('Não foi possível carregar as estatísticas. Verifique se a API está rodando.');
        console.error(error);
    }
}

async function loadReviewsData() {
    const score = document.getElementById('filter-score').value;
    const limit = document.getElementById('filter-limit').value;

    showLoading(true);
    document.getElementById('reviews-container').innerHTML = '';

    try {
        const reviews = await getReviews(parseInt(limit), score);
        renderReviews(reviews);
    } catch (error) {
        showError('Não foi possível carregar os reviews. Verifique se a API está rodando.');
        console.error(error);
    } finally {
        showLoading(false);
    }
}

async function analyzeSentimentAction() {
    const text = document.getElementById('sentiment-input').value.trim();

    if (!text) {
        alert('Por favor, digite um texto para análise.');
        return;
    }

    const analyzeBtn = document.getElementById('btn-analyze');
    analyzeBtn.disabled = true;
    analyzeBtn.textContent = 'Analisando...';

    try {
        const result = await analyzeSentiment(text);
        displaySentimentResult(result);
    } catch (error) {
        showError('Não foi possível analisar o sentimento. Verifique se a API está rodando.');
        console.error(error);
    } finally {
        analyzeBtn.disabled = false;
        analyzeBtn.textContent = 'Analisar Sentimento';
    }
}

document.addEventListener('DOMContentLoaded', () => {
    document.getElementById('btn-overview').addEventListener('click', () => {
        switchScreen('overview');
        loadOverviewData();
    });

    document.getElementById('btn-reviews').addEventListener('click', () => {
        switchScreen('reviews');
    });

    document.getElementById('btn-sentiment').addEventListener('click', () => {
        switchScreen('sentiment');
    });

    document.getElementById('btn-load-reviews').addEventListener('click', loadReviewsData);

    document.getElementById('btn-analyze').addEventListener('click', analyzeSentimentAction);

    loadOverviewData();
});

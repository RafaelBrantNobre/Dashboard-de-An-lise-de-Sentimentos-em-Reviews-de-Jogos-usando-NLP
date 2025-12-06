let scoreChart = null;
let sentimentChart = null;

function updateStats(stats) {
    document.getElementById('total-reviews').textContent = stats.total_reviews || '0';
    document.getElementById('avg-score').textContent = stats.avg_score ? stats.avg_score.toFixed(2) : '0.00';
    document.getElementById('positive-reviews').textContent = stats.positive_count || '0';
    document.getElementById('negative-reviews').textContent = stats.negative_count || '0';
}

function createScoreChart(stats) {
    const ctx = document.getElementById('score-chart');

    if (scoreChart) {
        scoreChart.destroy();
    }

    const scoreDistribution = stats.score_distribution || {};

    scoreChart = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: ['Negativo (-1)', 'Neutro (0)', 'Positivo (1)'],
            datasets: [{
                label: 'Quantidade de Reviews',
                data: [
                    scoreDistribution['-1'] || 0,
                    scoreDistribution['0'] || 0,
                    scoreDistribution['1'] || 0
                ],
                backgroundColor: [
                    'rgba(217, 83, 79, 0.6)',
                    'rgba(240, 173, 78, 0.6)',
                    'rgba(92, 184, 92, 0.6)'
                ],
                borderColor: [
                    'rgba(217, 83, 79, 1)',
                    'rgba(240, 173, 78, 1)',
                    'rgba(92, 184, 92, 1)'
                ],
                borderWidth: 2
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: true,
            plugins: {
                legend: {
                    display: false
                },
                title: {
                    display: false
                }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    ticks: {
    
                    }
                }
            }
        }
    });
}

function renderReviews(reviews) {
    const container = document.getElementById('reviews-container');

    if (!reviews || reviews.length === 0) {
        container.innerHTML = '<p class="info-text" style="text-align: center; padding: 2rem;">Nenhum review encontrado.</p>';
                                        '#fb7185', // negative (rose)
                                        '#f59e0b', // neutral (amber)
                                        '#22c55e'  // positive (emerald)
    container.innerHTML = reviews.map(review => {
        const scoreClass = review.score > 0 ? 'positive' : review.score < 0 ? 'negative' : 'neutral';
                                        '#fb7185',
                                        '#f59e0b',
                                        '#22c55e'
            <div class="review-card ${scoreClass}">
                                    borderWidth: 0,
                                    barThickness: 30,
                                    borderRadius: 6,
                                    borderSkipped: false
                    <span class="review-score ${scoreClass}">${scoreText}</span>
                </div>
                <div class="review-text">${escapeHtml(review.review_text || 'Sem texto disponível')}</div>
                <div class="review-stats">
                    <span>👍 Votos Úteis: ${review.voted_up || 0}</span>
                    <span>👎 Votos Inúteis: ${review.voted_funny || 0}</span>
                </div>
            </div>
        `;
    }).join('');
}

function displaySentimentResult(result) {
    const resultContainer = document.getElementById('sentiment-result');
    const sentimentSpan = document.getElementById('predicted-sentiment');
    const confidenceSpan = document.getElementById('confidence-score');

    let sentimentText = result.predicted_sentiment || 'Desconhecido';
    let sentimentClass = 'neutral';

    if (sentimentText.toLowerCase().includes('positiv')) {
        sentimentClass = 'positive';
    } else if (sentimentText.toLowerCase().includes('negativ')) {
        sentimentClass = 'negative';
                    function createSentimentPie(stats) {
                        const ctx = document.getElementById('sentiment-pie');
                        if (!ctx) return;

                        const pos = stats.positive_count || stats.positivas || 0;
                        const neg = stats.negative_count || stats.negativas || 0;
                        const neut = (stats.total_reviews || 0) - pos - neg;

                        if (sentimentChart) sentimentChart.destroy();

                        const data = {
                            labels: ['Positivo', 'Negativo', 'Neutro'],
                            datasets: [{
                                data: [pos, neg, neut],
                                backgroundColor: ['#22c55e', '#fb7185', '#f59e0b'],
                                borderColor: ['#0f766e', '#be123c', '#92400e'],
                                borderWidth: 0
                            }]
                        };

                        sentimentChart = new Chart(ctx, {
                            type: 'doughnut',
                            data,
                            options: {
                                responsive: true,
                                maintainAspectRatio: true,
                                cutout: '60%',
                                plugins: {
                                    legend: {
                                        position: 'bottom',
                                        labels: { boxWidth: 12, color: '#cbd5e1' }
                                    },
                                    tooltip: {
                                        callbacks: {
                                            label: function(context) {
                                                const label = context.label || '';
                                                const value = context.raw || 0;
                                                return `${label}: ${value}`;
                                            }
                                        }
                                    }
                                }
                            }
                        });
                    }
    }

    resultContainer.style.borderLeftColor = getComputedStyle(document.documentElement)
        .getPropertyValue(`--${sentimentClass === 'positive' ? 'success' : sentimentClass === 'negative' ? 'danger' : 'warning'}-color`);

    sentimentSpan.textContent = sentimentText;
    sentimentSpan.style.color = getComputedStyle(document.documentElement)
        .getPropertyValue(`--${sentimentClass === 'positive' ? 'success' : sentimentClass === 'negative' ? 'danger' : 'warning'}-color`);

    const confidence = result.confidence || 0;
    confidenceSpan.textContent = `${(confidence * 100).toFixed(2)}%`;

    resultContainer.classList.remove('hidden');
}

function showLoading(show) {
    const loadingElement = document.getElementById('reviews-loading');
    if (show) {
        loadingElement.classList.remove('hidden');
    } else {
        loadingElement.classList.add('hidden');
    }
}

function showError(message) {
    alert(`Erro: ${message}\n\nVerifique se a API está rodando em ${BASE_URL}`);
}

function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

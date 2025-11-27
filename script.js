// WORLD CUP SCOREBOARD DATA
const data = [
    {
        name: "South Africa",
        flag: "https://flagcdn.com/w80/za.png",
        games: [
            { game: "Game 1", points: 0 },
            { game: "Game 2", points: 0 },
            { game: "Game 3", points: 0 },
            { game: "Game 4", points: 0 }
        ]
    },
    {
        name: "England",
        flag: "https://flagcdn.com/w80/gb-eng.png",
        games: [
            { game: "Game 1", points: 0 },
            { game: "Game 2", points: 0 },
            { game: "Game 3", points: 0 },
            { game: "Game 4", points: 0 }
        ]
    },
    {
        name: "USA",
        flag: "https://flagcdn.com/w80/us.png",
        games: [
            { game: "Game 1", points: 0 },
            { game: "Game 2", points: 0 },
            { game: "Game 3", points: 0 },
            { game: "Game 4", points: 0 }
        ]
    },
    {
        name: "Mexico",
        flag: "https://flagcdn.com/w80/mx.png",
        games: [
            { game: "Game 1", points: 0 },
            { game: "Game 2", points: 0 },
            { game: "Game 3", points: 0 },
            { game: "Game 4", points: 0 }
        ]
    }
];

// Global shared game names
let gameNames = data[0].games.map(g => g.game);

const scoreboard = document.getElementById("scoreboard");
const resetBtn = document.getElementById("reset-btn");
const addGameBtn = document.getElementById("add-game-btn");
const exportBtn = document.getElementById("export-btn");
const podiumEl = document.getElementById("podium");

// Track leader for celebration
let previousLeader = null;

// Simple Web Audio sounds
let audioCtx = null;

function getAudioContext() {
    if (!audioCtx) {
        audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    }
    return audioCtx;
}

function playTone(frequency, durationMs) {
    const ctx = getAudioContext();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = "square";
    osc.frequency.value = frequency;

    osc.connect(gain);
    gain.connect(ctx.destination);

    const now = ctx.currentTime;
    gain.gain.setValueAtTime(0.2, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + durationMs / 1000);

    osc.start(now);
    osc.stop(now + durationMs / 1000);
}

function playGoalSound() {
    playTone(600, 150);
}

function playLeadChangeSound() {
    playTone(900, 300);
}

// Calculate total for a country
function getTotalPoints(country) {
    return country.games.reduce((sum, g) => sum + g.points, 0);
}

// Render the podium / standings
function renderPodium() {
    const sorted = [...data].sort((a, b) => getTotalPoints(b) - getTotalPoints(a));

    if (!sorted.some(c => getTotalPoints(c) > 0)) {
        podiumEl.innerHTML = "";
        return;
    }

    const ranks = ["🥇", "🥈", "🥉", "4️⃣"];

    let html = `
        <div class="podium-title">Standings</div>
        <div class="podium-items">
    `;

    sorted.forEach((country, index) => {
        if (index > 3) return;
        const total = getTotalPoints(country);

        html += `
            <div class="podium-item">
                <span class="podium-rank">${ranks[index]}</span>
                <span class="podium-name">${country.name}</span>
                <span class="podium-score">${total} pts</span>
            </div>
        `;
    });

    html += "</div>";
    podiumEl.innerHTML = html;
}


// Render the scoreboard
function renderScoreboard() {
    scoreboard.innerHTML = "";

    // Sort by highest total points
    data.sort((a, b) => getTotalPoints(b) - getTotalPoints(a));

    const totals = data.map(getTotalPoints);
    const maxTotal = Math.max(...totals);
    const haveLeader = maxTotal > 0;
    const currentLeaderName = haveLeader ? data[0].name : null;

    // Decide if we should celebrate a new leader
    const leaderJustChanged = haveLeader && previousLeader && previousLeader !== currentLeaderName;

    data.forEach((country, countryIndex) => {
        const total = getTotalPoints(country);

        const card = document.createElement("div");
        card.className = "country-card";

        const isLeader = haveLeader && total === maxTotal;

        if (isLeader) {
            card.classList.add("leader");
            if (leaderJustChanged && country.name === currentLeaderName) {
                card.classList.add("celebrate");
            }
        }

        const header = document.createElement("div");
        header.className = "country-header";

        const countryInfo = document.createElement("div");
        countryInfo.className = "country-info";

        const flagImg = document.createElement("img");
        flagImg.className = "flag-icon";
        flagImg.src = country.flag;
        flagImg.alt = `${country.name} flag`;

        const nameDiv = document.createElement("div");
        nameDiv.className = "country-name";
        nameDiv.textContent = country.name;

        countryInfo.appendChild(flagImg);
        countryInfo.appendChild(nameDiv);

        const totalDiv = document.createElement("div");
        totalDiv.className = "total-points";

        const totalText = document.createElement("span");
        totalText.textContent = `${total} pts`;

        totalDiv.appendChild(totalText);

        if (isLeader) {
            const trophy = document.createElement("span");
            trophy.className = "trophy";
            trophy.textContent = "🏆";
            totalDiv.appendChild(trophy);
        }

        header.appendChild(countryInfo);
        header.appendChild(totalDiv);
        card.appendChild(header);

        // Games
        country.games.forEach((game, gameIndex) => {
            const row = document.createElement("div");
            row.className = "game-row";

            const gameName = document.createElement("div");
            gameName.className = "game-name";

            const ball = document.createElement("span");
            ball.className = "game-ball";
            ball.textContent = "⚽";

            const nameSpan = document.createElement("span");
            nameSpan.textContent = gameNames[gameIndex];
            nameSpan.className = "editable-game-name";

            // Click to rename game globally
            nameSpan.addEventListener("click", () => {
                const newName = prompt("Enter new name for this game:", gameNames[gameIndex]);
                if (newName && newName.trim() !== "") {
                    const clean = newName.trim();
                    gameNames[gameIndex] = clean;
                    data.forEach(team => {
                        team.games[gameIndex].game = clean;
                    });
                    renderScoreboard();
                    saveData();
                }
            });

            gameName.appendChild(ball);
            gameName.appendChild(nameSpan);

            const controls = document.createElement("div");
            controls.className = "score-controls";

            const minusBtn = document.createElement("button");
            minusBtn.textContent = "-";

            const scoreSpan = document.createElement("span");
            scoreSpan.className = "score-value";
            scoreSpan.textContent = game.points;

            const plusBtn = document.createElement("button");
            plusBtn.textContent = "+";

            minusBtn.addEventListener("click", () => {
                if (country.games[gameIndex].points > 0) {
                    country.games[gameIndex].points--;
                    renderScoreboard();
                    saveData();
                }
            });

            plusBtn.addEventListener("click", () => {
                country.games[gameIndex].points++;
                playGoalSound();
                renderScoreboard();
                saveData();
            });

            controls.appendChild(minusBtn);
            controls.appendChild(scoreSpan);
            controls.appendChild(plusBtn);

            row.appendChild(gameName);
            row.appendChild(controls);
            card.appendChild(row);
        });

        scoreboard.appendChild(card);
    });

    // Update podium
    renderPodium();

    // Play sound if leader changed
    if (leaderJustChanged) {
        playLeadChangeSound();
    }

    // Store current leader for next render
    previousLeader = currentLeaderName;
}

// Reset scores
resetBtn.addEventListener("click", () => {
    const confirmReset = confirm("Are you sure you want to reset all scores?");
    if (confirmReset) {
        data.forEach(country => {
            country.games.forEach(game => game.points = 0);
        });
        localStorage.removeItem("worldCupScoreboard");
        renderScoreboard();
    }
});


// Add a new game for every country
addGameBtn.addEventListener("click", () => {
    const newGameName = `Game ${gameNames.length + 1}`;

    gameNames.push(newGameName);

    data.forEach(country => {
        country.games.push({ game: newGameName, points: 0 });
    });

    renderScoreboard();
    saveData();
});

// Export scores to CSV
exportBtn.addEventListener("click", () => {
    // Header: Country, Total, each game
    const header = ["Country", "Total", ...gameNames];
    const rows = [header];

    data.forEach(country => {
        const total = getTotalPoints(country);
        const gamePoints = country.games.map(g => g.points);
        rows.push([country.name, total, ...gamePoints]);
    });

    const csvContent = rows.map(r => r.join(",")).join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);

    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", "family-world-cup-scores.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
});

function saveData() {
    const saveObject = {
        data: data,
        gameNames: gameNames
    };
    localStorage.setItem("worldCupScoreboard", JSON.stringify(saveObject));
}

function loadData() {
    const saved = localStorage.getItem("worldCupScoreboard");
    if (saved) {
        const parsed = JSON.parse(saved);
        // restore
        gameNames = parsed.gameNames;
        parsed.data.forEach((team, i) => {
            data[i].games = team.games;
        });
    }
}


// Initial load
loadData();
renderScoreboard();
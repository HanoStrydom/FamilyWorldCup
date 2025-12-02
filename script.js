console.log("SCRIPT LOADED!");


// ---------- FIREBASE IMPORTS ----------
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.4/firebase-app.js";
let isMuted = false;

import {
    getDatabase,
    ref,
    set,
    onValue
} from "https://www.gstatic.com/firebasejs/10.12.4/firebase-database.js";

// ---------- FIREBASE CONFIG ----------
const firebaseConfig = {
    apiKey: "AIzaSyAV-tbz4CY6III191C7BqK_Xa5t5w3rInQ",
    authDomain: "family-world-cup-scoreboard.firebaseapp.com",
    databaseURL: "https://family-world-cup-scoreboard-default-rtdb.europe-west1.firebasedatabase.app/",
    projectId: "family-world-cup-scoreboard",
    storageBucket: "family-world-cup-scoreboard.firebasestorage.app",
    messagingSenderId: "481345224358",
    appId: "1:481345224358:web:fc65e591dc44d9de433e67",
    measurementId: "G-61LQDESP64"
};

const app = initializeApp(firebaseConfig);
const db = getDatabase(app);
const scoreboardRef = ref(db, "scoreboardState");
const nootRef = ref(db, "nootVirNootState");

// ---------- LOCAL STATE SETUP ----------
const initialData = [
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

// deep copy so we can mutate safely
let data = JSON.parse(JSON.stringify(initialData));
let gameNames = data[0].games.map(g => g.game);

const scoreboard = document.getElementById("scoreboard");
const resetBtn = document.getElementById("reset-btn");
const addGameBtn = document.getElementById("add-game-btn");
const exportBtn = document.getElementById("export-btn");
const podiumEl = document.getElementById("podium");

// Track leader for celebration
let previousLeader = null;

// To avoid loops when we write and then receive our own update
let isLocalWrite = false;

// ---------- AUDIO ----------
let audioCtx = null;

function getAudioContext() {
    if (!audioCtx) {
        audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    }
    return audioCtx;
}

function playTone(frequency, durationMs) {
    if (isMuted) return;  // MUTE BLOCKS ALL SOUND
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

const muteBtn = document.getElementById("mute-btn");

muteBtn.addEventListener("click", () => {
    isMuted = !isMuted;
    muteBtn.textContent = isMuted ? "🔇" : "🔊";

    // Trigger animation
    muteBtn.classList.remove("animate");
    void muteBtn.offsetWidth; // forces reflow so animation restarts
    muteBtn.classList.add("animate");
});



function playGoalSound() {
    playTone(600, 150);
}

function playLeadChangeSound() {
    playTone(900, 300);
}

// ---------- HELPERS ----------
function getTotalPoints(country) {
    return country.games.reduce((sum, g) => sum + g.points, 0);
}

// push current state to Firebase
function pushStateToCloud() {
    isLocalWrite = true;
    set(scoreboardRef, {
        data,
        gameNames
    }).finally(() => {
        // tiny delay so the onValue listener doesn't treat our own write as remote
        setTimeout(() => { isLocalWrite = false; }, 100);
    });
}

// ---------- PODIUM ----------
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

// ---------- MAIN RENDER ----------
function renderScoreboard() {
    scoreboard.innerHTML = "";

    // Sort by highest total points
    data.sort((a, b) => getTotalPoints(b) - getTotalPoints(a));

    const totals = data.map(getTotalPoints);
    const maxTotal = Math.max(...totals);
    const haveLeader = maxTotal > 0;
    const currentLeaderName = haveLeader ? data[0].name : null;

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

            // Rename game globally
            nameSpan.addEventListener("click", () => {
                const newName = prompt("Enter new name for this game:", gameNames[gameIndex]);
                if (newName && newName.trim() !== "") {
                    const clean = newName.trim();
                    gameNames[gameIndex] = clean;
                    data.forEach(team => {
                        team.games[gameIndex].game = clean;
                    });
                    pushStateToCloud();
                    renderScoreboard();
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
                    pushStateToCloud();
                    renderScoreboard();
                }
            });

            plusBtn.addEventListener("click", () => {
                country.games[gameIndex].points++;
                playGoalSound();
                pushStateToCloud();
                renderScoreboard();
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

    renderPodium();

    if (leaderJustChanged) {
        playLeadChangeSound();
    }

    previousLeader = currentLeaderName;
}

// ---------- BUTTON HANDLERS ----------
resetBtn.addEventListener("click", () => {
    const confirmReset = confirm("Are you sure you want to reset all scores?");
    if (confirmReset) {
        data.forEach(country => {
            country.games.forEach(game => game.points = 0);
        });
        previousLeader = null;
        pushStateToCloud();
        renderScoreboard();
    }
});

addGameBtn.addEventListener("click", () => {
    const newGameName = `Game ${gameNames.length + 1}`;
    gameNames.push(newGameName);

    data.forEach(country => {
        country.games.push({ game: newGameName, points: 0 });
    });

    pushStateToCloud();
    renderScoreboard();
});

exportBtn.addEventListener("click", () => {
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
    link.href = url;
    link.download = "family-world-cup-scores.csv";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
});

// ---------- REAL-TIME SYNC SETUP ----------

// Listen for changes from Firebase (other devices)
onValue(scoreboardRef, snapshot => {
    const value = snapshot.val();

    if (!value) {
        // First time: push our initial state to the cloud
        pushStateToCloud();
        renderScoreboard();
        return;
    }

    if (isLocalWrite) {
        // This change came from us; we've already updated locally
        return;
    }

    // Replace local state with cloud state
    data = value.data;
    gameNames = value.gameNames;
    previousLeader = null;
    renderScoreboard();
});

// ------------------ NOOT-VIR-NOOT ------------------

// ------------------ NOOT-VIR-NOOT (UPGRADED) ------------------

let nootPlayers = [
    { name: "Player 1", points: 0 },
    { name: "Player 2", points: 0 },
    { name: "Player 3", points: 0 },
    { name: "Player 4", points: 0 },
    { name: "Player 5", points: 0 },
    { name: "Player 6", points: 0 },
    { name: "Player 7", points: 0 }
];

let previousNootLeader = null;
let nootIsLocalWrite = false;

const nootList = document.getElementById("noot-list");

// Save to Firebase
function pushNootToCloud() {
    nootIsLocalWrite = true;
    set(nootRef, nootPlayers).finally(() => {
        setTimeout(() => { nootIsLocalWrite = false; }, 100);
    });
}

// Sorting by points (descending)
function sortNootPlayers() {
    nootPlayers.sort((a, b) => b.points - a.points);
}

// Render leaderboard podium
function renderNootPodium() {
    const podium = document.getElementById("noot-podium");
    let sorted = [...nootPlayers].sort((a, b) => b.points - a.points);

    // Hide if everyone has 0 points
    if (!sorted.some(p => p.points > 0)) {
        podium.innerHTML = "";
        return;
    }

    const ranks = ["🥇", "🥈", "🥉"];

    let html = `
        <div class="podium-title">Standings</div>
        <div class="podium-items">
    `;

    // *** TOP 3 ONLY ***
    sorted.slice(0, 3).forEach((p, index) => {
        html += `
            <div class="podium-item">
                <span class="podium-rank">${ranks[index]}</span>
                <span class="podium-name">${p.name}</span>
                <span class="podium-score">${p.points} pts</span>
            </div>
        `;
    });

    html += `</div>`;
    podium.innerHTML = html;
}


function renderNootSection() {
    sortNootPlayers();
    nootList.innerHTML = "";

    const leader = nootPlayers[0]?.name || null;
    const leaderChanged = previousNootLeader && previousNootLeader !== leader;

    nootPlayers.forEach((p, index) => {
        const item = document.createElement("div");
        item.className = "noot-item";

        if (index === 0 && leaderChanged) {
            item.style.animation = "leaderFlash 0.7s ease-out";
            playLeadChangeSound();
        }

        // Editable name
        const name = document.createElement("div");
        name.className = "noot-name";
        name.textContent = p.name;

        name.addEventListener("click", () => {
            const newName = prompt("Enter new name:", p.name);
            if (newName && newName.trim() !== "") {
                p.name = newName.trim();
                pushNootToCloud();
                renderNootSection();
            }
        });

        // Controls
        const controls = document.createElement("div");
        controls.className = "noot-controls";

        const minusBtn = document.createElement("button");
        minusBtn.textContent = "-";
        minusBtn.addEventListener("click", () => {
            if (p.points > 0) p.points--;
            pushNootToCloud();
            renderNootSection();
        });

        const pointsDisplay = document.createElement("span");
        pointsDisplay.textContent = `${p.points} pts`;
        pointsDisplay.style.margin = "0 10px";

        const plusBtn = document.createElement("button");
        plusBtn.textContent = "+";
        plusBtn.addEventListener("click", () => {
            p.points++;
            playGoalSound();
            pushNootToCloud();
            renderNootSection();
        });

        controls.appendChild(minusBtn);
        controls.appendChild(pointsDisplay);
        controls.appendChild(plusBtn);

        item.appendChild(name);
        item.appendChild(controls);
        nootList.appendChild(item);
    });

    renderNootPodium();
    previousNootLeader = leader;
}

const resetNootBtn = document.getElementById("reset-noot-btn");

resetNootBtn.addEventListener("click", () => {
    const confirmReset = confirm("Are you sure you want to reset all Noot-vir-Noot scores?");
    if (confirmReset) {
        nootPlayers.forEach(p => p.points = 0);
        previousNootLeader = null;
        pushNootToCloud();
        renderNootSection();
    }
});


// Firebase listener
onValue(nootRef, snapshot => {
    const value = snapshot.val();

    if (!value) {
        pushNootToCloud();
        renderNootSection();
        return;
    }

    if (nootIsLocalWrite) return;

    nootPlayers = value;
    previousNootLeader = null;
    renderNootSection();
});


// Initial render (in case DB is slow, user still sees something)
renderScoreboard();
renderNootSection();


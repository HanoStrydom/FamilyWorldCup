// WORLD CUP SCOREBOARD DATA
// Each country has: name, flag, and a list of games with points
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
        flag: "https://flagcdn.com/w80/gb-eng.png", // England flag
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

const scoreboard = document.getElementById("scoreboard");
const resetBtn = document.getElementById("reset-btn");
const addGameBtn = document.getElementById("add-game-btn");

// Calculate total for a country
function getTotalPoints(country) {
    return country.games.reduce((sum, g) => sum + g.points, 0);
}

// Render the scoreboard
function renderScoreboard() {
    scoreboard.innerHTML = "";

    // Sort countries by highest total points (descending)
    data.sort((a, b) => getTotalPoints(b) - getTotalPoints(a));

    // Find the highest total to mark the leader (if all zero, no leader)
    const totals = data.map(getTotalPoints);
    const maxTotal = Math.max(...totals);
    const haveLeader = maxTotal > 0;

    data.forEach((country, countryIndex) => {
        const total = getTotalPoints(country);

        const card = document.createElement("div");
        card.className = "country-card";

        if (haveLeader && total === maxTotal) {
            card.classList.add("leader");
        }

        // Country header
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

        if (haveLeader && total === maxTotal) {
            const trophySpan = document.createElement("span");
            trophySpan.className = "trophy";
            trophySpan.textContent = "🏆";
            totalDiv.appendChild(trophySpan);
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

            const ballSpan = document.createElement("span");
            ballSpan.className = "game-ball";
            ballSpan.textContent = "⚽";

            const nameSpan = document.createElement("span");
            nameSpan.textContent = game.game;

            gameName.appendChild(ballSpan);
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

            // Button events
            minusBtn.addEventListener("click", () => {
                if (data[countryIndex].games[gameIndex].points > 0) {
                    data[countryIndex].games[gameIndex].points--;
                    renderScoreboard();
                }
            });

            plusBtn.addEventListener("click", () => {
                data[countryIndex].games[gameIndex].points++;
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
}

// Reset scores to zero
resetBtn.addEventListener("click", () => {
    const confirmReset = confirm("Are you sure you want to reset all scores?");
    
    if (confirmReset) {
        data.forEach(country => {
            country.games.forEach(game => {
                game.points = 0;
            });
        });

        renderScoreboard();
    }
});


// Add a new game for every country
addGameBtn.addEventListener("click", () => {
    // Assume all countries have same number of games
    const currentGameCount = data[0].games.length;
    const newGameName = `Game ${currentGameCount + 1}`;

    data.forEach(country => {
        country.games.push({ game: newGameName, points: 0 });
    });

    renderScoreboard();
});

// Initial render
renderScoreboard();

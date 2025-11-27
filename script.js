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

// Calculate total for a country
function getTotalPoints(country) {
    return country.games.reduce((sum, g) => sum + g.points, 0);
}

// Render the scoreboard
function renderScoreboard() {
    scoreboard.innerHTML = "";

    // Sort by highest total points
    data.sort((a, b) => getTotalPoints(b) - getTotalPoints(a));

    // Identify leader
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

        const header = document.createElement("div");
        header.className = "country-header";

        const countryInfo = document.createElement("div");
        countryInfo.className = "country-info";

        const flagImg = document.createElement("img");
        flagImg.className = "flag-icon";
        flagImg.src = country.flag;

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

            // Click to rename
            nameSpan.addEventListener("click", () => {
                const newName = prompt("Enter new name for this game:", gameNames[gameIndex]);
                if (newName && newName.trim() !== "") {
                    gameNames[gameIndex] = newName.trim();

                    // Update all countries
                    data.forEach(team => {
                        team.games[gameIndex].game = newName.trim();
                    });

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
                    renderScoreboard();
                }
            });

            plusBtn.addEventListener("click", () => {
                country.games[gameIndex].points++;
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

// Reset scores
resetBtn.addEventListener("click", () => {
    const confirmReset = confirm("Are you sure you want to reset all scores?");
    if (confirmReset) {
        data.forEach(country => {
            country.games.forEach(game => game.points = 0);
        });
        renderScoreboard();
    }
});

// Add a new game
addGameBtn.addEventListener("click", () => {
    const newGameName = `Game ${gameNames.length + 1}`;

    gameNames.push(newGameName);

    data.forEach(country => {
        country.games.push({ game: newGameName, points: 0 });
    });

    renderScoreboard();
});

// Initial load
renderScoreboard();

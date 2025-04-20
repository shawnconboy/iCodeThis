document.getElementById("searchForm").addEventListener("submit", async (e) => {
    e.preventDefault();

    const playerName = document.getElementById("playerName").value.trim();
    const resultDiv = document.getElementById("result");

    try {
        const response = await fetch(`http://127.0.0.1:5000/api/player?name=${playerName}`);

        const data = await response.json();

        if (data.error) {
            resultDiv.innerHTML = `<p>${data.error}</p>`;
            return;
        }

        const last5 = data.last5;
        resultDiv.innerHTML = `
            <div class="meta-info">
                <h2>${data.name}</h2>
                <p><strong>Team:</strong> ${data.team}</p>
                <p><strong>Position:</strong> ${data.position}</p>
            </div>

            <div class="grid">
                <div class="card">
                    <h3>Last 5 Games (Averages)</h3>
                    ${typeof last5 === "object"
                ? `
                        <ul>
                            <li><strong>PTS:</strong> ${last5.pts}</li>
                            <li><strong>REB:</strong> ${last5.reb}</li>
                            <li><strong>AST:</strong> ${last5.ast}</li>
                        </ul>
                        `
                : `<p>No recent game data available.</p>`
            }
                </div>

                <div class="card">
                    <h3>Career Stats</h3>
                    <ul>
                        <li><strong>PTS:</strong> ${data.stats.pts}</li>
                        <li><strong>REB:</strong> ${data.stats.reb}</li>
                        <li><strong>AST:</strong> ${data.stats.ast}</li>
                        <li><strong>FG%:</strong> ${data.stats.fg_pct}</li>
                        <li><strong>MIN:</strong> ${data.stats.min}</li>
                    </ul>
                </div>
            </div>
        `;
    } catch (error) {
        resultDiv.innerHTML = "<p>Error fetching player data.</p>";
        console.error("Error:", error);
    }
});

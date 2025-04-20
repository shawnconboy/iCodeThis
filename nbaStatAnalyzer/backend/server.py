from flask import Flask, jsonify, request
from flask_cors import CORS
from nba_api.stats.endpoints import commonplayerinfo, playercareerstats, playergamelog
from nba_api.stats.static import players
import pandas as pd

app = Flask(__name__)
CORS(app)

@app.route("/api/player")
def get_player_stats():
    name = request.args.get("name")
    if not name:
        return jsonify({"error": "Player name is required."}), 400

    player_dict = players.find_players_by_full_name(name)
    if not player_dict:
        return jsonify({"error": "Player not found."}), 404

    player_id = player_dict[0]["id"]
    full_name = player_dict[0]["full_name"]

    # Fetch basic player info
    info = commonplayerinfo.CommonPlayerInfo(player_id=player_id)
    info_data = info.get_data_frames()[0]
    team_name = info_data.loc[0, "TEAM_NAME"]
    position = info_data.loc[0, "POSITION"]

    # Fetch career averages
    career = playercareerstats.PlayerCareerStats(player_id=player_id)
    career_data = career.get_data_frames()[1].iloc[-1]  # Last season
    stats = {
        "pts": float(career_data["PTS"]),
        "reb": float(career_data["REB"]),
        "ast": float(career_data["AST"]),
        "fg_pct": float(career_data["FG_PCT"]),
        "min": float(career_data["MIN"])
    }

    # Fetch last 5 games
    try:
        gamelog = playergamelog.PlayerGameLog(player_id=player_id, season="2023-24")
        recent_games = gamelog.get_data_frames()[0].head(5)

        last5 = {
            "pts": round(float(recent_games["PTS"].mean()), 1),
            "reb": round(float(recent_games["REB"].mean()), 1),
            "ast": round(float(recent_games["AST"].mean()), 1)
        }
    except Exception:
        last5 = None

    return jsonify({
        "name": full_name,
        "team": team_name if pd.notna(team_name) else "N/A",
        "position": position if pd.notna(position) else "N/A",
        "stats": stats,
        "last5": last5 if last5 else "No recent game data available."
    })

if __name__ == "__main__":
    app.run(debug=True)

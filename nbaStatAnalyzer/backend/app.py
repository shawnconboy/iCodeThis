from flask import Flask, request, jsonify, send_from_directory
from nba_api.stats.static import players
from nba_api.stats.endpoints import playercareerstats
from flask_cors import CORS
import os

app = Flask(__name__, static_folder='../public', static_url_path='')
CORS(app)

@app.route('/')
def serve_index():
    return send_from_directory(app.static_folder, 'index.html')

@app.route('/api/player', methods=['GET'])
def get_player_stats():
    name = request.args.get('name', '').strip().lower()

    if not name:
        return jsonify({"error": "Name parameter is required"}), 400

    # Find matching player
    matched_players = players.find_players_by_full_name(name)
    if not matched_players:
        return jsonify({"error": "Player not found"}), 404

    player = matched_players[0]
    player_id = player['id']

    # Get career stats
    stats = playercareerstats.PlayerCareerStats(player_id=player_id).get_dict()
    latest_stats = stats['resultSets'][0]['rowSet'][-1]
    headers = stats['resultSets'][0]['headers']
    stats_dict = dict(zip(headers, latest_stats))

    return jsonify({
        "name": f"{player['full_name']}",
        "team": stats_dict.get("TEAM_ID", "N/A"),
        "position": "N/A",  # nba_api doesn't provide position in this endpoint
        "stats": {
            "pts": stats_dict.get("PTS"),
            "reb": stats_dict.get("REB"),
            "ast": stats_dict.get("AST"),
            "fg_pct": stats_dict.get("FG_PCT"),
            "min": stats_dict.get("MIN")
        }
    })

if __name__ == '__main__':
    app.run(debug=True, port=3000)

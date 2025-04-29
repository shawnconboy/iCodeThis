from flask import Flask, request, jsonify
from flask_cors import CORS
from nba_api.stats.static import players
from nba_api.stats.endpoints import playercareerstats, commonplayerinfo, playergamelog
import pandas as pd
import datetime
import threading

app = Flask(__name__)
CORS(app)

# Cache player list in memory for fast suggestions
player_list_cache = None
player_list_lock = threading.Lock()

def get_player_list():
    global player_list_cache
    with player_list_lock:
        if player_list_cache is None:
            player_list_cache = players.get_players()
        return player_list_cache

@app.route('/api/player_suggestions')
def player_suggestions():
    query = request.args.get('q', '').strip().lower()
    if not query:
        return jsonify([])
    player_list = get_player_list()
    # Prioritize active players, then sort alphabetically
    matches = [p for p in player_list if query in p['full_name'].lower()]
    matches.sort(key=lambda x: (not x['is_active'], x['full_name']))
    # Return up to 10 suggestions (full_name only)
    return jsonify([p['full_name'] for p in matches[:10]])

def get_player_data(player_name):
    player_list = players.get_players()
    for player in player_list:
        if player['full_name'].lower() == player_name.lower():
            return player['id'], player['full_name']
    return None, None

@app.route('/api/player')
def player_stats():
    name = request.args.get('name')
    player_id, full_name = get_player_data(name)

    if not player_id:
        return jsonify({"error": "Player not found"})

    # Get team and position info
    info = commonplayerinfo.CommonPlayerInfo(player_id=player_id).get_normalized_dict()
    team_name = info['CommonPlayerInfo'][0]['TEAM_NAME']
    team_id = info['CommonPlayerInfo'][0]['TEAM_ID']
    position = info['CommonPlayerInfo'][0]['POSITION']

    # Get career averages
    career = playercareerstats.PlayerCareerStats(player_id=player_id).get_data_frames()[0]
    latest_season = career[career['SEASON_ID'] == career['SEASON_ID'].max()]
    career_stats = {
        "PTS": round(float(latest_season['PTS']), 1),
        "REB": round(float(latest_season['REB']), 1),
        "AST": round(float(latest_season['AST']), 1)
    }

    # Get last 5 game averages
    gamelog = playergamelog.PlayerGameLog(player_id=player_id, season='2023').get_data_frames()[0]
    last5 = gamelog.head(5)
    last5_stats = {
        "PTS": round(last5["PTS"].mean(), 1),
        "REB": round(last5["REB"].mean(), 1),
        "AST": round(last5["AST"].mean(), 1)
    }

    return jsonify({
        "player_id": player_id,
        "full_name": full_name,
        "position": position,
        "team": team_name,
        "team_id": team_id,
        "career": career_stats,
        "last5": last5_stats
    })

if __name__ == '__main__':
    app.run(debug=True)
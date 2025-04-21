from flask import Flask, request, jsonify
from flask_cors import CORS
from nba_api.stats.static import players
from nba_api.stats.endpoints import playercareerstats, commonplayerinfo, playergamelog
import pandas as pd
import datetime

app = Flask(__name__)
CORS(app)

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
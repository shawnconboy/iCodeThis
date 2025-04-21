from flask import Flask, request, jsonify, render_template
from flask_cors import CORS
from nba_api.stats.static import players
from nba_api.stats.endpoints import (
    playercareerstats,
    commonplayerinfo,
    playergamelog,
    scoreboardv2
)
import pandas as pd
import datetime

app = Flask(__name__, static_folder="static", template_folder="templates")
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

    info = commonplayerinfo.CommonPlayerInfo(player_id=player_id).get_normalized_dict()
    team_name = info['CommonPlayerInfo'][0]['TEAM_NAME']
    team_id = info['CommonPlayerInfo'][0]['TEAM_ID']
    position = info['CommonPlayerInfo'][0]['POSITION']

    career = playercareerstats.PlayerCareerStats(player_id=player_id).get_data_frames()[0]
    latest_season = career[career['SEASON_ID'] == career['SEASON_ID'].max()]
    career_stats = {
        "PTS": round(float(latest_season['PTS']), 1),
        "REB": round(float(latest_season['REB']), 1),
        "AST": round(float(latest_season['AST']), 1)
    }

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

def get_todays_games():
    today = datetime.datetime.today().strftime('%m/%d/%Y')
    scoreboard = scoreboardv2.ScoreboardV2(game_date=today)
    games = scoreboard.get_normalized_dict()['GameHeader']
    team_ids = set()
    for game in games:
        team_ids.add(game['HOME_TEAM_ID'])
        team_ids.add(game['VISITOR_TEAM_ID'])
    return team_ids

@app.route('/api/today_players')
def today_players():
    star_player_names = [
        "LeBron James", "Stephen Curry", "Kevin Durant",
        "Jayson Tatum", "Joel Embiid", "Giannis Antetokounmpo"
    ]

    player_list = players.get_players()
    player_data = []
    team_ids_today = get_todays_games()

    for name in star_player_names:
        for p in player_list:
            if p["full_name"] == name:
                player_id = p["id"]
                info = commonplayerinfo.CommonPlayerInfo(player_id=player_id).get_normalized_dict()
                player_team_id = info["CommonPlayerInfo"][0]["TEAM_ID"]
                player_team_name = info["CommonPlayerInfo"][0]["TEAM_NAME"]
                position = info["CommonPlayerInfo"][0]["POSITION"]

                if player_team_id in team_ids_today:
                    player_data.append({
                        "full_name": name,
                        "player_id": player_id,
                        "team_id": player_team_id,
                        "team": player_team_name,
                        "position": position
                    })
                break

    return jsonify(player_data)

@app.route('/')
def home():
    return render_template('index.html')

if __name__ == '__main__':
    app.run(debug=True)

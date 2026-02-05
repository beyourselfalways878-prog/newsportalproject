// OpenAI calls are implemented on the server to keep the API key secret.
// Client-side code calls the server endpoint at `/api/openai-generate`.
// Do NOT expose your OpenAI key as a VITE_ env variable in production.

// Mock sports data - In production, replace with real API (cricbuzz, sportmonks, etc.)
const mockLiveMatches = [
  {
    id: 'cricket-1',
    sport: 'Cricket',
    tournament: 'ICC World Cup 2026',
    team1: {
      name: 'India',
      shortName: 'IND',
      flag: '🇮🇳',
      score: '345/7',
      overs: '50.0'
    },
    team2: {
      name: 'Pakistan',
      shortName: 'PAK',
      flag: '🇵🇰',
      score: '298/10',
      overs: '48.2'
    },
    status: 'India won by 47 runs',
    venue: 'Narendra Modi Stadium, Ahmedabad',
    isLive: false,
    matchType: 'ODI'
  },
  {
    id: 'cricket-2',
    sport: 'Cricket',
    tournament: 'IPL 2026',
    team1: {
      name: 'Mumbai Indians',
      shortName: 'MI',
      flag: '🔵',
      score: '187/5',
      overs: '18.3'
    },
    team2: {
      name: 'Chennai Super Kings',
      shortName: 'CSK',
      flag: '🟡',
      score: '142/3',
      overs: '15.0',
      target: '188'
    },
    status: 'Live - CSK need 46 runs in 30 balls',
    venue: 'Wankhede Stadium, Mumbai',
    isLive: true,
    matchType: 'T20'
  },
  {
    id: 'football-1',
    sport: 'Football',
    tournament: 'Premier League',
    team1: {
      name: 'Manchester United',
      shortName: 'MUN',
      flag: '🔴',
      score: '2'
    },
    team2: {
      name: 'Chelsea',
      shortName: 'CHE',
      flag: '🔵',
      score: '1'
    },
    status: 'Full Time',
    venue: 'Old Trafford, Manchester',
    isLive: false,
    matchType: 'Football'
  },
  {
    id: 'football-2',
    sport: 'Football',
    tournament: 'La Liga',
    team1: {
      name: 'Real Madrid',
      shortName: 'RMA',
      flag: '⚪',
      score: '1'
    },
    team2: {
      name: 'Barcelona',
      shortName: 'BAR',
      flag: '🔵',
      score: '1'
    },
    status: 'Live - 67\'',
    venue: 'Santiago Bernabéu, Madrid',
    isLive: true,
    matchType: 'Football'
  }
];

// Detailed match data
const matchDetails = {
  'cricket-1': {
    scorecard: {
      innings: [
        {
          team: 'India',
          battingStats: [
            { player: 'Rohit Sharma', runs: 87, balls: 63, fours: 9, sixes: 4, sr: '138.09', status: 'c Babar b Shaheen' },
            { player: 'Virat Kohli', runs: 122, balls: 94, fours: 14, sixes: 2, sr: '129.78', status: 'not out' },
            { player: 'KL Rahul', runs: 45, balls: 38, fours: 5, sixes: 1, sr: '118.42', status: 'c Rizwan b Rauf' },
            { player: 'Shreyas Iyer', runs: 38, balls: 29, fours: 4, sixes: 1, sr: '131.03', status: 'b Shadab' },
            { player: 'Hardik Pandya', runs: 31, balls: 18, fours: 2, sixes: 2, sr: '172.22', status: 'not out' }
          ],
          bowlingStats: [
            { bowler: 'Shaheen Afridi', overs: '10.0', maidens: 1, runs: 68, wickets: 2, economy: '6.80' },
            { bowler: 'Haris Rauf', overs: '10.0', maidens: 0, runs: 71, wickets: 2, economy: '7.10' },
            { bowler: 'Shadab Khan', overs: '10.0', maidens: 0, runs: 58, wickets: 2, economy: '5.80' },
            { bowler: 'Mohammad Nawaz', overs: '10.0', maidens: 0, runs: 62, wickets: 1, economy: '6.20' }
          ],
          total: '345/7',
          overs: '50.0',
          extras: '22 (wd 14, nb 5, lb 3)'
        },
        {
          team: 'Pakistan',
          battingStats: [
            { player: 'Babar Azam', runs: 91, balls: 78, fours: 10, sixes: 2, sr: '116.66', status: 'c Kohli b Bumrah' },
            { player: 'Mohammad Rizwan', runs: 68, balls: 62, fours: 8, sixes: 1, sr: '109.67', status: 'c Rohit b Shami' },
            { player: 'Fakhar Zaman', runs: 34, balls: 41, fours: 4, sixes: 0, sr: '82.92', status: 'run out' },
            { player: 'Iftikhar Ahmed', runs: 45, balls: 38, fours: 5, sixes: 1, sr: '118.42', status: 'c Rahul b Hardik' },
            { player: 'Shadab Khan', runs: 28, balls: 32, fours: 3, sixes: 1, sr: '87.50', status: 'b Kuldeep' }
          ],
          bowlingStats: [
            { bowler: 'Jasprit Bumrah', overs: '10.0', maidens: 2, runs: 42, wickets: 3, economy: '4.20' },
            { bowler: 'Mohammed Shami', overs: '9.2', maidens: 1, runs: 51, wickets: 3, economy: '5.46' },
            { bowler: 'Kuldeep Yadav', overs: '10.0', maidens: 0, runs: 64, wickets: 2, economy: '6.40' },
            { bowler: 'Hardik Pandya', overs: '9.0', maidens: 0, runs: 58, wickets: 1, economy: '6.44' }
          ],
          total: '298/10',
          overs: '48.2',
          extras: '18 (wd 11, nb 4, lb 3)'
        }
      ]
    },
    venue: {
      name: 'Narendra Modi Stadium',
      city: 'Ahmedabad',
      country: 'India',
      capacity: '132,000',
      pitch: 'Good batting pitch with some turn for spinners',
      weather: 'Sunny, 28°C, Light breeze'
    },
    commentary: [
      { over: '48.2', bowler: 'Shami', description: 'OUT! Shami gets the last wicket! India wins by 47 runs!' },
      { over: '47.5', bowler: 'Bumrah', description: 'SIX! Shaheen hits it over long-on, but too late for Pakistan' },
      { over: '45.3', bowler: 'Kuldeep', description: 'WICKET! Shadab goes for a big shot, caught at boundary' },
      { over: '42.1', bowler: 'Bumrah', description: 'Brilliant yorker! Babar is beaten and bowled!' },
      { over: '38.4', bowler: 'Shami', description: 'FOUR! Rizwan cuts beautifully through point' }
    ],
    playerOfMatch: {
      name: 'Virat Kohli',
      performance: '122 runs off 94 balls',
      reason: 'Match-winning innings under pressure'
    },
    previousMatches: [
      { date: '2025-12-10', team1: 'India', team2: 'Pakistan', winner: 'Pakistan', margin: '5 wickets' },
      { date: '2024-11-05', team1: 'India', team2: 'Pakistan', winner: 'India', margin: '89 runs' },
      { date: '2023-10-15', team1: 'India', team2: 'Pakistan', winner: 'India', margin: '7 wickets' }
    ]
  },
  'cricket-2': {
    scorecard: {
      innings: [
        {
          team: 'Mumbai Indians',
          battingStats: [
            { player: 'Rohit Sharma', runs: 68, balls: 42, fours: 7, sixes: 4, sr: '161.90', status: 'c Gaikwad b Thakur' },
            { player: 'Ishan Kishan', runs: 45, balls: 31, fours: 5, sixes: 2, sr: '145.16', status: 'run out' },
            { player: 'Suryakumar Yadav', runs: 38, balls: 19, fours: 3, sixes: 3, sr: '200.00', status: 'not out' },
            { player: 'Tilak Varma', runs: 24, balls: 16, fours: 2, sixes: 1, sr: '150.00', status: 'not out' }
          ],
          bowlingStats: [
            { bowler: 'Deepak Chahar', overs: '4.0', maidens: 0, runs: 38, wickets: 1, economy: '9.50' },
            { bowler: 'Tushar Deshpande', overs: '4.0', maidens: 0, runs: 42, wickets: 1, economy: '10.50' },
            { bowler: 'Ravindra Jadeja', overs: '4.0', maidens: 0, runs: 28, wickets: 1, economy: '7.00' },
            { bowler: 'Maheesh Theekshana', overs: '3.3', maidens: 0, runs: 31, wickets: 1, economy: '8.85' }
          ],
          total: '187/5',
          overs: '18.3',
          extras: '12 (wd 8, nb 2, lb 2)'
        },
        {
          team: 'Chennai Super Kings',
          battingStats: [
            { player: 'Ruturaj Gaikwad', runs: 58, balls: 41, fours: 7, sixes: 2, sr: '141.46', status: 'not out' },
            { player: 'Devon Conway', runs: 34, balls: 26, fours: 4, sixes: 1, sr: '130.76', status: 'c Kishan b Bumrah' },
            { player: 'Ajinkya Rahane', runs: 28, balls: 19, fours: 3, sixes: 1, sr: '147.36', status: 'b Bumrah' },
            { player: 'Shivam Dube', runs: 18, balls: 12, fours: 2, sixes: 1, sr: '150.00', status: 'not out' }
          ],
          bowlingStats: [],
          total: '142/3',
          overs: '15.0',
          extras: '4 (wd 3, lb 1)',
          target: '188 needed'
        }
      ]
    },
    venue: {
      name: 'Wankhede Stadium',
      city: 'Mumbai',
      country: 'India',
      capacity: '33,108',
      pitch: 'Batting-friendly, good for T20 cricket',
      weather: 'Clear night, 26°C, Humid'
    },
    commentary: [
      { over: '15.0', bowler: 'Bumrah', description: 'DOT! CSK need 46 runs from 30 balls' },
      { over: '14.4', bowler: 'Pattinson', description: 'SIX! Dube smashes it over mid-wicket!' },
      { over: '13.2', bowler: 'Bumrah', description: 'WICKET! Rahane goes for a big shot, bowled!' },
      { over: '11.5', bowler: 'Chawla', description: 'FOUR! Gaikwad reaches his fifty in style!' },
      { over: '9.3', bowler: 'Bumrah', description: 'OUT! Conway tries to pull, caught behind!' }
    ],
    playerOfMatch: null,
    previousMatches: [
      { date: '2026-01-10', team1: 'MI', team2: 'CSK', winner: 'CSK', margin: '20 runs' },
      { date: '2025-05-15', team1: 'MI', team2: 'CSK', winner: 'MI', margin: '6 wickets' },
      { date: '2025-04-20', team1: 'MI', team2: 'CSK', winner: 'CSK', margin: '3 runs' }
    ]
  },
  'football-1': {
    scorecard: {
      team1Goals: [
        { player: 'Marcus Rashford', minute: '23\'', type: 'Open Play', assist: 'Bruno Fernandes' },
        { player: 'Bruno Fernandes', minute: '78\'', type: 'Penalty', assist: '-' }
      ],
      team2Goals: [
        { player: 'Raheem Sterling', minute: '56\'', type: 'Open Play', assist: 'Enzo Fernández' }
      ],
      statistics: {
        possession: { team1: '52%', team2: '48%' },
        shots: { team1: 14, team2: 11 },
        shotsOnTarget: { team1: 7, team2: 5 },
        corners: { team1: 6, team2: 4 },
        fouls: { team1: 11, team2: 13 },
        yellowCards: { team1: 2, team2: 3 },
        redCards: { team1: 0, team2: 0 }
      }
    },
    venue: {
      name: 'Old Trafford',
      city: 'Manchester',
      country: 'England',
      capacity: '74,879',
      pitch: 'Good condition',
      weather: 'Cloudy, 12°C, Light rain'
    },
    commentary: [
      { minute: '90+4\'', description: 'FULL TIME! Manchester United wins 2-1' },
      { minute: '78\'', description: 'GOAL! Fernandes converts penalty after foul on Rashford' },
      { minute: '56\'', description: 'GOAL! Sterling scores for Chelsea, game on!' },
      { minute: '23\'', description: 'GOAL! Rashford finishes brilliantly from Fernandes pass' }
    ],
    playerOfMatch: {
      name: 'Bruno Fernandes',
      performance: '1 Goal, 1 Assist, 85% Pass Accuracy',
      reason: 'Controlled the midfield and scored crucial penalty'
    },
    previousMatches: [
      { date: '2025-10-20', team1: 'MUN', team2: 'CHE', winner: 'Draw', margin: '1-1' },
      { date: '2025-03-15', team1: 'CHE', team2: 'MUN', winner: 'CHE', margin: '3-2' },
      { date: '2024-12-10', team1: 'MUN', team2: 'CHE', winner: 'MUN', margin: '2-0' }
    ]
  },
  'football-2': {
    scorecard: {
      team1Goals: [
        { player: 'Vinícius Júnior', minute: '34\'', type: 'Open Play', assist: 'Luka Modrić' }
      ],
      team2Goals: [
        { player: 'Robert Lewandowski', minute: '51\'', type: 'Open Play', assist: 'Pedri' }
      ],
      statistics: {
        possession: { team1: '48%', team2: '52%' },
        shots: { team1: 12, team2: 15 },
        shotsOnTarget: { team1: 5, team2: 7 },
        corners: { team1: 5, team2: 6 },
        fouls: { team1: 14, team2: 10 },
        yellowCards: { team1: 3, team2: 2 },
        redCards: { team1: 0, team2: 0 }
      }
    },
    venue: {
      name: 'Santiago Bernabéu',
      city: 'Madrid',
      country: 'Spain',
      capacity: '81,044',
      pitch: 'Excellent condition',
      weather: 'Clear, 18°C, Slight breeze'
    },
    commentary: [
      { minute: '67\'', description: 'Match is heating up! Both teams pushing for winner' },
      { minute: '51\'', description: 'GOAL! Lewandowski equalizes for Barcelona!' },
      { minute: '34\'', description: 'GOAL! Vinícius scores after brilliant Modrić through ball' },
      { minute: '15\'', description: 'Close! Benzema header just wide of the post' }
    ],
    playerOfMatch: null,
    previousMatches: [
      { date: '2025-10-28', team1: 'BAR', team2: 'RMA', winner: 'BAR', margin: '2-1' },
      { date: '2025-04-21', team1: 'RMA', team2: 'BAR', winner: 'RMA', margin: '3-1' },
      { date: '2024-10-25', team1: 'BAR', team2: 'RMA', winner: 'Draw', margin: '2-2' }
    ]
  }
};

// Fetch live matches from CricketData API
export const getLiveMatches = async () => {
  try {
    const res = await fetch('/api/live-scores');
    if (!res.ok) throw new Error('Failed to fetch live matches');
    const json = await res.json();
    return json.matches || [];
  } catch (error) {
    console.error('Error fetching live matches:', error);
    return [];
  }
};

// Get match detail (simulated for now as we only fetch current matches)
export const getMatchDetail = async (matchId) => {
  const matches = await getLiveMatches();
  const match = matches.find(m => m.id === matchId);
  if (!match) throw new Error('Match not found');
  return match;
};

// Generate AI commentary (server-side via Gemini)
export const generateAICommentary = async (matchContext) => {
  try {
    const res = await fetch('/api/ai-commentary', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ matchData: matchContext })
    });
    const json = await res.json();
    return json.text || 'रोमांचक मुकाबला जारी है! An exciting match in progress!';
  } catch (error) {
    console.error('AI commentary fetch error:', error);
    return 'रोमांचक मुकाबला जारी है! An exciting match in progress!';
  }
};

// Generate match analysis (server-side)
export const generateMatchAnalysis = async (matchData) => {
  // Re-use commentary endpoint for now
  return generateAICommentary(matchData);
};

// Get player insights (server-side)
export const getPlayerInsights = async (playerName, performance) => {
  // Re-use commentary endpoint with specific context
  return generateAICommentary({ playerName, performance, context: 'player insight' });
};

export default {
  getLiveMatches,
  getMatchDetail,
  generateAICommentary,
  generateMatchAnalysis,
  getPlayerInsights
};

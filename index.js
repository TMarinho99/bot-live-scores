const axios = require("axios");
const TelegramBot = require("node-telegram-bot-api");
require("dotenv").config();

const processedGames = new Set();

const TOKEN_BOT = "6135800772:AAEOgjbLgiT2y5If-ILh1Nq-aLfBUbFgzeo";
const chatId = "966239716";

const bot = new TelegramBot(TOKEN_BOT, { polling: true });

bot.sendMessage(chatId, "⚽️Iniciando bot🎯");

async function getLiveScores() {
  try {
    const response = await axios.get(
      "https://api.sportsanalytics.com.br/api/v1/fixtures-svc/fixtures/livescores",
      {
        params: {
          include:
            "weatherReport,additionalInfo,league,stats,pressureStats,probabilities",
        },
      }
    );
    return response.data;
  } catch (error) {
    console.error("Error fetching live scores:", error);
    return null;
  }
}

async function verifyData(dados) {
  dados.data.forEach((game) => {
    const { fixtureId, pressureStats } = game;

    if (!processedGames.has(fixtureId) && pressureStats) {
      const {
        homeTeam,
        awayTeam,
        league,
        currentTime,
        scores,
        stats,
        probabilities,
      } = game;

      const homeTeamName = homeTeam?.name || "N/A";
      const awayTeamName = awayTeam?.name || "N/A";
      const leagueName = league?.name || "N/A";
      const currentTimeInMinutes = currentTime?.minute || 0;
      const homeTeamScore = scores?.homeTeamScore || 1;
      const awayTeamScore = scores?.awayTeamScore || 1;
      const cornersHome = stats?.corners?.home || 0;
      const cornersAway = stats?.corners?.away || 0;
      const dangerousAttacksHome = stats?.dangerousAttacks?.home || 0;
      const dangerousAttacksAway = stats?.dangerousAttacks?.away || 0;
      const shotsOffGoalHome = stats?.shotsOffgoal?.home || 0;
      const shotsOffGoalAway = stats?.shotsOffgoal?.away || 0;
      const shotsOnGoalHome = stats?.shotsOngoal?.home || 0;
      const shotsOnGoalAway = stats?.shotsOngoal?.away || 0;
      const over05HTProbability = probabilities?.HT_over_0_5 || 0;
      const over25Probability = probabilities?.over_2_5 || 0;

      const homeTeamNameForUrl = homeTeamName.replace(" ", "+");
      const link = `https://www.bet365.com/#/AX/K%5E${homeTeamNameForUrl}/`;

      if (
        homeTeamScore + awayTeamScore == 0 &&
        over05HTProbability >= 70 &&
        over25Probability >= 55 &&
        currentTimeInMinutes >= 10 &&
        currentTimeInMinutes <= 20
      ) {
        const message = `⚽️ <b>JOGO OVER 0.5 HT</b>
      
          🆚 <b>${homeTeamName} x ${awayTeamName}</b>
          🏆 ${leagueName}
          ⏰ ${currentTimeInMinutes}' minutos

          📲 <b>Link Bet365:</b>
          ${link}
            
          <b>Estatísticas (Casa - Fora)</b>
          📈 Placar: ${homeTeamScore} - ${awayTeamScore}
          🔥 Ataques Perigosos: ${dangerousAttacksHome} - ${dangerousAttacksAway}
          🎯 Chutes ao gol: ${shotsOnGoalHome} - ${shotsOnGoalAway}
          💥 Chutes fora do gol: ${shotsOffGoalHome} - ${shotsOffGoalAway}
          ⛳️ Escanteios: ${cornersHome} - ${cornersAway}
            
          ⬆️ PROBABILIDADE DE MAIS 0.5 HT: ${over05HTProbability}
            
          ANALISE A PARTIDA ANTES DE FAZER A ENTRADA !!!`;

        bot.sendMessage(chatId, message, { parse_mode: "HTML" });
        processedGames.add(fixtureId);
      }
    }
  });
}

async function startMonitoring() {
  setInterval(async () => {
    const liveScores = await getLiveScores();
    if (liveScores) {
      verifyData(liveScores);
    }
  }, 60000);
}

startMonitoring();

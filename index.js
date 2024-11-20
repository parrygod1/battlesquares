const axios = require("axios").default;

const baseURL = "https://battlesquares.internal-tools.vastvisibility.co.uk";
const playerName= "5leiz";

const BattleSquaresAPI = {
    newGame: async (numberOfPlayers) => {
        try {
            const response = await axios.get(`${baseURL}/new/${numberOfPlayers}`);
            return response.data;
        } catch (error) {
            console.error("Error creating a new game:", error);
            throw error;
        }
    },

    connect: async (gameId) => {
        try {
            const response = await axios.get(`${baseURL}/connect/${gameId}/${playerName}`);
            return response.data;
        } catch (error) {
            console.error("Error connecting to the game:", error);
            throw error;
        }
    },

    getInfo: async () => {
        try {
            const response = await axios.get(`${baseURL}/info`);
            return response.data;
        } catch (error) {
            console.error("Error getting game info:", error);
            throw error;
        }
    },

    getAllInfo: async () => {
        try {
            const response = await axios.get(`${baseURL}/info/all`);
            return response.data;
        } catch (error) {
            console.error("Error getting all game info:", error);
            throw error;
        }
    },

    getGameInfo: async (gameId) => {
        try {
            const response = await axios.get(`${baseURL}/info/${gameId}`);
            return response.data;
        } catch (error) {
            console.error(`Error getting info for game ${gameId}:`, error);
            throw error;
        }
    },

    performAction: async (gameId, playerId, action) => {
        try {
            const response = await axios.get(`${baseURL}/action/${gameId}/${playerId}/${action}`);
            return response.data;
        } catch (error) {
            console.error(`Error performing action "${action}" for player ${playerId} in game ${gameId}:`, error);
            throw error;
        }
    }
};

(async () => {
    try {
        const connectResponse = await BattleSquaresAPI.connect(76);
        console.log("Connected to game:", connectResponse);
        /*
        const game = await BattleSquaresAPI.newGame(4);
        console.log("New game created:", game);

        

        const gameInfo = await BattleSquaresAPI.getGameInfo(game.gameId);
        console.log("Game info:", gameInfo);

        const actionResponse = await BattleSquaresAPI.performAction(game.gameId, connectResponse.playerId, "move");
        console.log("Action performed:", actionResponse);*/
    } catch (error) {
        console.error("Error in API calls:", error);
    }
})();

module.exports = BattleSquaresAPI;

const axios = require("axios").default;

const baseURL = "https://battlesquares.internal-tools.vastvisibility.co.uk";
const playerName = "5leiz";

const moveActions = {
    up: "u",
    left: "l",
    right: "r",
    down: "d"
}

const fireActions = {
    up: "U",
    left: "L",
    right: "R",
    down: "D"
}

const allowedGameStateForMovement = "InfoAndPlanning"; // Replace with the required game state

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

    performActionWhenAllowed: async (gameId, playerId, secret, action) => {
        try {
            let gameState;
            do {
                // Fetch the current game state
                const gameInfo = await BattleSquaresAPI.getGameInfo(gameId);
                gameState = gameInfo.state;

                if (gameState !== allowedGameStateForMovement) {
                    console.log(`Game state is "${gameState}". Waiting for "${allowedGameStateForMovement}"...`);
                    await new Promise(resolve => setTimeout(resolve, 2000)); // Wait 2 seconds before checking again
                }
            } while (gameState !== allowedGameStateForMovement);

            // Proceed with the action once the state is allowed
            const response = await axios.get(`${baseURL}/action/${gameId}/${playerId}/${action}/`, {
                headers: {
                    secret: secret
                }
            });
            return response.data;
        } catch (error) {
            console.error(`Error performing action "${action}" for player ${playerId} in game ${gameId}:`, error.message);
            throw error;
        }
    }
};

/* WaitingForPlayers, // game has just been created 
    Ready, // all players are connected
    Energise, // energy is being adjusted
    InfoAndPlanning, // players get status and submit actions
    Execution, // execute the actions
    Status, // are players alive
    Draw, // game is drawn
    Win // game is won
*/
(async () => {
    try {
       // const gameId = await BattleSquaresAPI.newGame(4);
       // console.log("New game created:", gameId);
       gameId = 20;
        const connectResponse = await BattleSquaresAPI.connect(gameId);
        console.log("Connected to game:", connectResponse);

        const gameInfo = await BattleSquaresAPI.getGameInfo(gameId);
        console.log("Game info:", gameInfo);

        const actionResponse = await BattleSquaresAPI.performActionWhenAllowed(
            gameId,
            connectResponse.playerId,
            connectResponse.secret,
            moveActions.up
        );

        const dactionResponse = await BattleSquaresAPI.performActionWhenAllowed(
            gameId,
            connectResponse.playerId,
            connectResponse.secret,
            moveActions.down
        );
        console.log("Action performed:", actionResponse);
    } catch (error) {
        console.error("Error in API calls:", error.message);
    }
})();

module.exports = BattleSquaresAPI;

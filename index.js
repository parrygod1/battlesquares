const axios = require("axios").default;

const baseURL = "https://battlesquares.internal-tools.vastvisibility.co.uk";
const playerName = "5leiz";

const moveActions = {
    up: "u",
    left: "l",
    right: "r",
    down: "d"
};

const fireActions = {
    up: "U",
    left: "L",
    right: "R",
    down: "D"
};

const allowedGameStateForMovement = "InfoAndPlanning";

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

    getGameInfo: async (gameId) => {
        try {
            const response = await axios.get(`${baseURL}/info/${gameId}`);
            return response.data;
        } catch (error) {
            console.error(`Error getting info for game ${gameId}:`, error);
            throw error;
        }
    },

    performAction: async (gameId, playerId, secret, action) => {
        try {
            const response = await axios.get(`${baseURL}/action/${gameId}/${playerId}/${action}/`, {
                headers: {
                    secret: secret
                }
            });
            console.log(`Action "${action}" performed successfully.`);
            return response.data;
        } catch (error) {
            console.error(`Error performing action "${action}" for player ${playerId} in game ${gameId}:`, error.message);
        }
    }
};

const strategy = {
    decideAction: (gameInfo, playerId) => {
        const player = gameInfo.players.find(p => p.id === playerId);
        if (!player) {
            throw new Error("Player not found in game info.");
        }

        const { x, y } = player.location;

        // Check for opponents in the line of fire
        for (const direction of ["up", "down", "left", "right"]) {
            let dx = 0, dy = 0;
            if (direction === "up") dy = -1;
            if (direction === "down") dy = 1;
            if (direction === "left") dx = -1;
            if (direction === "right") dx = 1;

            let nx = x + dx, ny = y + dy;
            while (nx >= 0 && ny >= 0 && nx < gameInfo.gridSize && ny < gameInfo.gridSize) {
                const target = gameInfo.players.find(p => p.location.x === nx && p.location.y === ny);
                if (target) {
                    console.log(`Opponent found in line of fire: ${direction}`);
                    return fireActions[direction];
                }
                nx += dx;
                ny += dy;
            }
        }

        // If no opponents in the line of fire, move randomly
        const possibleActions = [...Object.values(moveActions), ...Object.values(fireActions)];
        const randomAction = possibleActions[Math.floor(Math.random() * possibleActions.length)];
        console.log(`No targets in line of fire. Acting randomly: ${randomAction}`);
        return randomAction;
    }
};

(async () => {
    try {
        const gameId = 189; // Replace with your actual game ID

        // Connect to the game
        const connectResponse = await BattleSquaresAPI.connect(gameId);
        console.log("Connected to game:", connectResponse);

        const { playerId, secret } = connectResponse;

        let gameState;
        while (true) {
            const gameInfo = await BattleSquaresAPI.getGameInfo(gameId);
            gameState = gameInfo.state;

            if (gameState !== allowedGameStateForMovement) {
                console.log(`Game state is "${gameState}". Waiting for "${allowedGameStateForMovement}"...`);
                await new Promise(resolve => setTimeout(resolve, 2000)); // Wait 2 seconds before checking again
                continue;
            }

            // Decide the action based on the current state
            const action = strategy.decideAction(gameInfo, playerId);
            console.log(`Decided action: ${action}`);

            // Perform the action
            await BattleSquaresAPI.performAction(gameId, playerId, secret, action);
        }
    } catch (error) {
        console.error("Error in game logic:", error.message);
    }
})();

module.exports = BattleSquaresAPI;

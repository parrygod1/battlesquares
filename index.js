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

        // Log player's coordinates
        console.log(`Player coordinates: [${x}, ${y}]`);

        // Log enemies' coordinates
        console.log("Enemy coordinates:");
        gameInfo.players
            .filter(p => p.id !== playerId)
            .forEach(enemy => {
                console.log(`- Enemy ID ${enemy.id}: [${enemy.location.x}, ${enemy.location.y}]`);
            });

        // If no opponents in the line of fire, move randomly
        const possibleActions = [...Object.values(moveActions), ...Object.values(fireActions)];
        const randomAction = possibleActions[Math.floor(Math.random() * possibleActions.length)];
        console.log(`No targets in line of fire. Acting randomly: ${randomAction}`);
        return randomAction;
    }
};

(async () => {
    try {
        // Get the game ID from the command-line arguments
        const args = process.argv.slice(2);
        if (args.length === 0) {
            throw new Error("No game ID provided. Usage: node index.js <gameId>");
        }

        const gameId = args[0];

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
            console.log(`Decided action: ${action || "No action this turn"}`);

            // Perform the action
            await BattleSquaresAPI.performAction(gameId, playerId, secret, action);
        }
    } catch (error) {
        console.error("Error in game logic:", error.message);
    }
})();

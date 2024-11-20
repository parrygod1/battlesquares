const axios = require("axios").default;

const baseURL = "https://battlesquares.internal-tools.vastvisibility.co.uk";
const playerName = "5leiz";
let playerIdgen;
let secret;
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
    decideAction: (gameInfo,playerId) => {
        const player = gameInfo.players.find(p => p.id === playerIdgen);
        if (!player) {
            throw new Error("Player not found in game info.");
        }

        const { x: playerX, y: playerY } = player.location;
        const gridSize = gameInfo.gridSize;

        // Log player's coordinates
        console.log(`Player coordinates: [${playerX}, ${playerY}]`);

        // Iterate over enemies and decide to shoot if conditions match
        for (const enemy of gameInfo.players.filter(p => p.id !== playerId)) {
            const { x: enemyX, y: enemyY } = enemy.location;

            console.log(`Checking enemy at [${enemyX}, ${enemyY}]`);
if(enemy.alive){
            // Shooting logic
            if (playerX === enemyX && enemyY > playerY) {
                console.log("Enemy directly to the right. Shooting right.");
                return fireActions.down;
            } else if (playerX === enemyX && enemyY < playerY) {
                console.log("Enemy directly to the left. Shooting left.");
                return fireActions.up;
            } else if (playerY === enemyY && enemyX > playerX) {
                console.log("Enemy directly above. Shooting up.");
                return fireActions.right;
            } else if (playerY === enemyY && enemyX < playerX) {
                console.log("Enemy directly below. Shooting down.");
                return fireActions.left;
            }
        }}

        // Filter valid moves to ensure they stay within bounds
        const validMoves = Object.entries(moveActions).filter(([direction, move]) => {
            if (direction === "up" && playerY > 0) return true;
            if (direction === "down" && playerY < gridSize - 1) return true;
            if (direction === "left" && playerX > 0) return true;
            if (direction === "right" && playerX < gridSize - 1) return true;
            return false;
        }).map(([_, move]) => move);

        // Select a valid random move
        if (validMoves.length > 0) {
            const randomMove = validMoves[Math.floor(Math.random() * validMoves.length)];
            console.log(`No targets in line of fire. Moving randomly: ${randomMove}`);
            return randomMove;
        }

        console.log("No valid moves available. Staying in place.");
        return null; // No valid move or fire action
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
        playerIdgen = playerId;
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

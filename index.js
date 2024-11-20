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
            return response.data;
        } catch (error) {
            console.error(`Error performing action "${action}" for player ${playerId} in game ${gameId}:`, error.message);
            throw error;
        }
    }
};

const strategy = {
    decideAction: (gameInfo, playerId) => {
        const player = gameInfo.players.find(p => p.id === playerId);
        if (!player) {
            throw new Error("Player not found in game info.");
        }

        // If energy is low, avoid firing and move to a safer position
        if (player.energy <= 2) {
            return strategy.safeMove(gameInfo, player);
        }

        // If energy is sufficient, decide whether to fire or move
        const targets = strategy.getPotentialTargets(gameInfo, player);
        if (targets.length > 0) {
            // Fire in the direction of the most targets
            return strategy.fireAtTargets(targets);
        }

        // If no firing opportunities, move to a better position
        return strategy.safeMove(gameInfo, player);
    },

    getPotentialTargets: (gameInfo, player) => {
        const targets = [];
        const { x, y } = player.position;

        // Check each direction for potential targets
        ["up", "down", "left", "right"].forEach(direction => {
            let dx = 0, dy = 0;
            if (direction === "up") dy = -1;
            if (direction === "down") dy = 1;
            if (direction === "left") dx = -1;
            if (direction === "right") dx = 1;

            let nx = x + dx, ny = y + dy;
            while (nx >= 0 && ny >= 0 && nx < gameInfo.gridSize && ny < gameInfo.gridSize) {
                const target = gameInfo.players.find(p => p.position.x === nx && p.position.y === ny);
                if (target) {
                    targets.push({ direction, target });
                }
                nx += dx;
                ny += dy;
            }
        });

        return targets;
    },

    fireAtTargets: (targets) => {
        const directions = targets.map(t => t.direction);
        // Prioritize firing in the direction with the most targets
        const direction = directions[0]; // Simple strategy, can be improved
        return fireActions[direction];
    },

    safeMove: (gameInfo, player) => {
        const moves = ["up", "down", "left", "right"];
        const safeMoves = moves.filter(move => {
            const { x, y } = player.position;
            let nx = x, ny = y;

            if (move === "up") ny -= 1;
            if (move === "down") ny += 1;
            if (move === "left") nx -= 1;
            if (move === "right") nx += 1;

            return nx >= 0 && ny >= 0 && nx < gameInfo.gridSize && ny < gameInfo.gridSize &&
                !gameInfo.players.find(p => p.position.x === nx && p.position.y === ny);
        });

        if (safeMoves.length > 0) {
            return moveActions[safeMoves[0]];
        }

        // If no safe moves, stay in place (void action is automatic)
        return "void";
    }
};

(async () => {
    try {
        const connectResponse = await BattleSquaresAPI.connect(gameId);
        console.log("Connected to game:", connectResponse);

        const { playerId, secret } = connectResponse;

        while (true) {
            const gameInfo = await BattleSquaresAPI.getGameInfo(gameId);
            const action = strategy.decideAction(gameInfo, playerId);
            console.log(`Decided action: ${action}`);

            await BattleSquaresAPI.performAction(gameId, playerId, secret, action);
        }
    } catch (error) {
        console.error("Error in game logic:", error.message);
    }
})();

const axios = require("axios").default;

const playerName = "5Leiz";
const connectURL = "https://battlesquares.internal-tools.vastvisibility.co.uk/info/all";

async function connect(gameId) {
    const response = await axios.get(connectURL, {
        params: {
            gameId: gameId,
            playerName: playerName
        }
    });
    return response.data[0];
}

(async () => {
    try {
        const asdf = await connect(20);
        console.log(asdf);
    } catch (error) {
        console.error("Error:", error);
    }
})();
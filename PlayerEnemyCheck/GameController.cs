using Microsoft.AspNetCore.Mvc;

namespace PlayerEnemyCheck.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class GameController : ControllerBase
    {
        // Existing endpoint: /api/game/check
        [HttpPost("check")]
        public IActionResult CheckCoordinates([FromBody] CoordinateRequest request)
        {
            string direction = null;

            foreach (var enemy in request.Enemies)
            {
                if (enemy.X == request.Player.X)
                {
                    direction = enemy.Y < request.Player.Y ? "L" : "R";
                    break;
                }
                else if (enemy.Y == request.Player.Y)
                {
                    direction = enemy.X < request.Player.X ? "U" : "D";
                    break;
                }
            }

            return Ok(direction == null ? Array.Empty<string>() : new[] { direction });
        }

        // New endpoint: /api/game/corner
        [HttpPost("corner")]
        public IActionResult CheckCorner([FromBody] CoordinateRequest request)
        {
            var player = request.Player;
            var gridSize = request.Players; // This determines the size of the grid (gridSize x gridSize)

            // Determine if the player is already in a corner
            if (IsCorner(player, gridSize))
            {
                return Ok(true); // Player is in a corner
            }

            // Calculate the direction to the nearest corner
            string directionToCorner = GetDirectionToNearestCorner(player, gridSize);
            return Ok(new { IsInCorner = false, Direction = directionToCorner });
        }

        // Helper method to check if the player is in a corner
        private bool IsCorner(Coordinate player, int gridSize)
        {
            return (player.X == 0 && player.Y == 0) || // Top-left corner
                   (player.X == 0 && player.Y == gridSize - 1) || // Top-right corner
                   (player.X == gridSize - 1 && player.Y == 0) || // Bottom-left corner
                   (player.X == gridSize - 1 && player.Y == gridSize - 1); // Bottom-right corner
        }

        // Helper method to calculate the direction to the nearest corner
        private string GetDirectionToNearestCorner(Coordinate player, int gridSize)
        {
            // Define the coordinates of the four corners
            var corners = new[]
            {
                new Coordinate { X = 0, Y = 0 }, // Top-left
                new Coordinate { X = 0, Y = gridSize - 1 }, // Top-right
                new Coordinate { X = gridSize - 1, Y = 0 }, // Bottom-left
                new Coordinate { X = gridSize - 1, Y = gridSize - 1 } // Bottom-right
            };

            // Calculate the Manhattan distance to each corner
            var nearestCorner = corners.OrderBy(c => GetManhattanDistance(player, c)).First();

            // Determine the direction to the nearest corner
            return GetDirection(player, nearestCorner);
        }

        // Helper method to calculate Manhattan distance
        private int GetManhattanDistance(Coordinate a, Coordinate b)
        {
            return Math.Abs(a.X - b.X) + Math.Abs(a.Y - b.Y);
        }

        // Helper method to determine direction to a target coordinate
        private string GetDirection(Coordinate from, Coordinate to)
        {
            var directions = new List<string>();

            if (to.X < from.X)
                directions.Add("u"); // Up
            else if (to.X > from.X)
                directions.Add("d"); // Down

            if (to.Y < from.Y)
                directions.Add("l"); // Left
            else if (to.Y > from.Y)
                directions.Add("r"); // Right

            // Join directions into a single string
            return string.Join("", directions);
        }
    }

    // Data Models
    public class CoordinateRequest
    {
        public int Players { get; set; } // Number of players (matrix size)
        public Coordinate Player { get; set; } // Player's coordinates
        public List<Coordinate> Enemies { get; set; } // List of enemy coordinates
    }

    public class Coordinate
    {
        public int X { get; set; }
        public int Y { get; set; }
    }
}

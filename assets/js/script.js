const startBtn = document.getElementById("start-btn");
const canvas = document.getElementById("canvas");
const scoreResultElement = document.getElementById("score-result");

const startScreen = document.querySelector(".start-screen");
const gameOverScreen = document.querySelector(".game-over-screen");
const gameOverMessage = document.querySelector(".game-over-screen > p");

// Set up 2d graphics for the game using getContext from the Canvas API
const ctx = canvas.getContext("2d");

// Append the width and height property to the canvas
canvas.width = innerWidth;
canvas.height = innerHeight;

// Game's gravity
const gravity = 0.5;

// Track the status of different buildings with collision detection.
let isBuildingCollisionDetectionActive = true;
let gameActive = false; // Start as inactive
let score = 0;
let animationId = null; // Track animation frame ID

// Handles the size of the elements in game for responsiveness to different screen sizes.
const proportionalSize = (size) => {
  return innerHeight < 500 ? Math.ceil((size / 500) * innerHeight) : size;
};

// Create a class for characteristics of the player
class Player {
  constructor() {
    this.position = {
      x: proportionalSize(100),
      y: proportionalSize(250),
    };
    this.velocity = {
      x: 0,
      y: 0,
    };
    this.width = proportionalSize(50);
    this.height = proportionalSize(40);

    this.image = new Image();
    this.image.src = "assets/img/Fly.png";
  }

  draw() {
    ctx.drawImage(
      this.image,
      this.position.x,
      this.position.y,
      this.width,
      this.height
    );
  }

  update() {
    this.draw();

    // Only update position if game is active
    if (gameActive) {
      this.position.y += this.velocity.y;

      // Apply gravity if not at the bottom of the canvas
      if (this.position.y + this.height + this.velocity.y <= canvas.height) {
        this.velocity.y += gravity;
      } else {
        // If player hits the ground, end the game
        this.velocity.y = 0;
        this.position.y = canvas.height - this.height;
        gameOver("You crashed into the ground!");
      }

      // Ceiling collision
      if (this.position.y <= 0) {
        this.position.y = 0;
        this.velocity.y = gravity;
      }
    }
  }

  reset() {
    this.position.y = proportionalSize(250);
    this.velocity.y = 0;
  }
}

// Create building obstacles logic (like the pipes in Flappy Bird)
class Buildings {
  constructor(x, y) {
    this.position = {
      x,
      y,
    };
    this.width = proportionalSize(90);
    this.height = proportionalSize(1400);
    this.passed = false; // Track if player has passed this building
  }

  draw() {
    ctx.fillStyle = "#000000";
    ctx.fillRect(this.position.x, this.position.y, this.width, this.height);
  }
}

// Responsible for the player's movements
const keys = {
  jumpKey: { pressed: false },
};

// Create a new instance of the Player class
const player = new Player();

// List of the positions for the Buildings
const buildingPositions = [
  { x: 500, y: proportionalSize(450) },
  { x: 700, y: proportionalSize(400) },
  { x: 850, y: proportionalSize(350) },
  { x: 900, y: proportionalSize(350) },
  { x: 1050, y: proportionalSize(150) },
  { x: 2500, y: proportionalSize(450) },
  { x: 2900, y: proportionalSize(400) },
  { x: 3150, y: proportionalSize(350) },
  { x: 3900, y: proportionalSize(450) },
  { x: 4200, y: proportionalSize(400) },
  { x: 4400, y: proportionalSize(200) },
  { x: 4700, y: proportionalSize(150) },
];

// A list of new instances using the building class
const buildings = buildingPositions.map(
  (building) => new Buildings(building.x, building.y)
);

// Game over function
const gameOver = (message) => {
  gameActive = false;
  isBuildingCollisionDetectionActive = false;
  showGameOverScreen();
};

// Check for collision between player and building (Flappy Bird style)
const checkCollision = (player, building) => {
  return (
    player.position.x < building.position.x + building.width &&
    player.position.x + player.width > building.position.x &&
    player.position.y < building.position.y + building.height &&
    player.position.y + player.height > building.position.y
  );
};

// Display the current score on the canvas
const displayScore = () => {
  ctx.fillStyle = "#ffffff";
  ctx.font = "24px Arial";
  ctx.textAlign = "left";
  ctx.fillText(`Score: ${score}`, 20, 40);
};

const animate = () => {
  // Cancel any existing animation before starting new one
  if (animationId) {
    cancelAnimationFrame(animationId);
  }

  // Handles the animation on the screen (web API)
  animationId = requestAnimationFrame(animate);

  // Clear the canvas when rendering for next frame of the animation.
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  // Update the player's position
  player.update();

  // Display the score
  displayScore();

  // Only move buildings if game is active
  if (gameActive) {
    // Move buildings to the left automatically (like in Flappy Bird)
    buildings.forEach((building) => {
      building.position.x -= 2; // Constant speed for buildings
      building.draw();

      // Check for collision with buildings
      if (checkCollision(player, building) && gameActive) {
        gameOver("You crashed into a building!");
      }

      // Add score when player passes a building
      if (
        !building.passed &&
        building.position.x + building.width < player.position.x
      ) {
        building.passed = true;
        score++;
      }
    });

    // Reset buildings that have gone off screen
    if (buildings[0].position.x + buildings[0].width < 0) {
      // Remove the first building
      const removedBuilding = buildings.shift();

      // Calculate new x position (place it after the last building)
      const lastBuilding = buildings[buildings.length - 1];
      const newX =
        lastBuilding.position.x + proportionalSize(Math.random() * 300 + 200);

      // Reset the passed flag and position
      removedBuilding.passed = false;
      removedBuilding.position.x = newX;

      // Add it to the end of the array
      buildings.push(removedBuilding);
    }
  } else {
    // Just draw buildings without moving them when game over
    buildings.forEach((building) => building.draw());
  }
};

// Responsible for player's movement functionality
const movePlayer = (key, isPressed) => {
  // Only allow jumping if game is active
  if (!gameActive) return;

  if (key === " " && isPressed) {
    // Space key for jumping
    player.velocity.y = -8; // Negative velocity to move upward
  }
};

// Reset all buildings to their initial positions
const resetBuildings = () => {
  buildings.forEach((building, index) => {
    building.position.x = buildingPositions[index].x;
    building.position.y = buildingPositions[index].y;
    building.passed = false;
  });
};

// Handles new player drawn on the screen.
const startGame = () => {
  // Cancel any existing animation frame
  if (animationId) {
    cancelAnimationFrame(animationId);
    animationId = null;
  }

  // Reset game state
  gameActive = true;
  isBuildingCollisionDetectionActive = true;
  score = 0;

  // Reset player position
  player.reset();

  // Reset building positions
  resetBuildings();

  // Display the canvas and hide the screens
  canvas.style.display = "block";
  startScreen.style.display = "none";
  gameOverScreen.style.display = "none";

  // Start animation
  animate();
};

// Handles the GameOver message
const showGameOverScreen = () => {
  gameOverScreen.style.display = "block";
  scoreResultElement.textContent = ` ${score}`;

  // Create and append retry button if it doesn't exist
  if (!document.getElementById("retry-btn")) {
    const retryBtn = document.createElement("button");
    retryBtn.textContent = "Try Again";
    retryBtn.id = "retry-btn";
    retryBtn.className = "btn";
    retryBtn.addEventListener("click", startGame);
    gameOverScreen.appendChild(retryBtn);
  }
};

// Event listeners
startBtn.addEventListener("click", startGame);

window.addEventListener("keydown", ({ key }) => {
  movePlayer(key, true);
});

window.addEventListener("keyup", ({ key }) => {
  movePlayer(key, false);
});

// For touch devices
canvas.addEventListener("touchstart", (e) => {
  e.preventDefault();
  movePlayer(" ", true);
});

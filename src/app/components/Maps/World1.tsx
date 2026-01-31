import { useEffect, useRef, useState, useCallback } from "react";
import playerIdleImg from "@/assets/player-idle.png";
import playerWalk1Img from "@/assets/player-right.png";
import playerWalk2Img from "@/assets/player-left.png";
import player2IdleImg from "@/assets/player2-idle.png";
import player2Walk1Img from "@/assets/player2-right.png";
import player2Walk2Img from "@/assets/player2-left.png";
import keyImg from "@/assets/key.png";
import doorImg from "@/assets/door.png";
import deathImg from "@/assets/death.png";

interface Player {
  id: number;
  x: number;
  y: number;
  vx: number;
  vy: number;
  width: number;
  height: number;
  onGround: boolean;
  animFrame: number;
  facingRight: boolean;
  color: string;
  dead: boolean;
  standingOnPlayer: number | null;
}

interface Platform {
  x: number;
  y: number;
  width: number;
  height: number;
}

interface Key {
  x: number;
  y: number;
  width: number;
  height: number;
  collected: boolean;
}

interface Door {
  x: number;
  y: number;
  width: number;
  height: number;
}

interface MovingPlatform extends Platform {
  startX: number;
  endX: number;
  speed: number;
  direction: number;
}

interface FallingPlatform extends Platform {
  falling: boolean;
  fallTimer: number;
  originalY: number;
}

interface Cloud {
  x: number;
  y: number;
  width: number;
  speed: number;
}

const GRAVITY = 0.6;
const JUMP_FORCE = -14;
const MOVE_SPEED = 5;
const PLAYER_WIDTH = 45;
const PLAYER_HEIGHT = 55;
const DEATH_FREEZE_TIME = 1500;

const World1 = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [gameState, setGameState] = useState<"playing" | "won" | "dead">("playing");
  const [hasKey, setHasKey] = useState(false);
  const [canvasSize, setCanvasSize] = useState({ width: 1200, height: 700 });
  const [playersAtDoor, setPlayersAtDoor] = useState<Set<number>>(new Set());
  const [imagesLoaded, setImagesLoaded] = useState(false);
  
  const keysPressed = useRef<Set<string>>(new Set());
  const animTimer = useRef(0);
  const deathTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  
  const playerIdle = useRef<HTMLImageElement | null>(null);
  const playerRight = useRef<HTMLImageElement | null>(null);
  const playerLeft = useRef<HTMLImageElement | null>(null);
  const player2Idle = useRef<HTMLImageElement | null>(null);
  const player2Right = useRef<HTMLImageElement | null>(null);
  const player2Left = useRef<HTMLImageElement | null>(null);
  const keyImage = useRef<HTMLImageElement | null>(null);
  const doorImage = useRef<HTMLImageElement | null>(null);
  const deathImage = useRef<HTMLImageElement | null>(null);

  const groundY = canvasSize.height - 80;

  // Two players - P1 uses WASD, P2 uses Arrow keys
  const playersRef = useRef<Player[]>([
    {
      id: 1,
      x: 50,
      y: 400,
      vx: 0,
      vy: 0,
      width: PLAYER_WIDTH,
      height: PLAYER_HEIGHT,
      onGround: false,
      animFrame: 0,
      facingRight: true,
      color: "#4A90D9",
      dead: false,
      standingOnPlayer: null,
    },
    {
      id: 2,
      x: 100,
      y: 400,
      vx: 0,
      vy: 0,
      width: PLAYER_WIDTH,
      height: PLAYER_HEIGHT,
      onGround: false,
      animFrame: 0,
      facingRight: true,
      color: "#D94A4A",
      dead: false,
      standingOnPlayer: null,
    },
  ]);

  useEffect(() => {
    const handleResize = () => {
      const width = window.innerWidth;
      const height = window.innerHeight;
      setCanvasSize({ width, height });
    };
    
    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  useEffect(() => {
    let loadedCount = 0;
    const totalImages = 9;

    const checkAllLoaded = () => {
      loadedCount++;
      if (loadedCount === totalImages) {
        setImagesLoaded(true);
      }
    };

    playerIdle.current = new Image();
    playerIdle.current.onload = checkAllLoaded;
    playerIdle.current.onerror = () => {
      console.error("Failed to load player idle image");
      checkAllLoaded();
    };
    playerIdle.current.src = typeof playerIdleImg === 'string' ? playerIdleImg : playerIdleImg.src;

    playerRight.current = new Image();
    playerRight.current.onload = checkAllLoaded;
    playerRight.current.onerror = () => {
      console.error("Failed to load player right image");
      checkAllLoaded();
    };
    playerRight.current.src = typeof playerWalk1Img === 'string' ? playerWalk1Img : playerWalk1Img.src;

    playerLeft.current = new Image();
    playerLeft.current.onload = checkAllLoaded;
    playerLeft.current.onerror = () => {
      console.error("Failed to load player left image");
      checkAllLoaded();
    };
    playerLeft.current.src = typeof playerWalk2Img === 'string' ? playerWalk2Img : playerWalk2Img.src;

    player2Idle.current = new Image();
    player2Idle.current.onload = checkAllLoaded;
    player2Idle.current.onerror = () => {
      console.error("Failed to load player 2 idle image");
      checkAllLoaded();
    };
    player2Idle.current.src = typeof player2IdleImg === 'string' ? player2IdleImg : player2IdleImg.src;

    player2Right.current = new Image();
    player2Right.current.onload = checkAllLoaded;
    player2Right.current.onerror = () => {
      console.error("Failed to load player 2 right image");
      checkAllLoaded();
    };
    player2Right.current.src = typeof player2Walk1Img === 'string' ? player2Walk1Img : player2Walk1Img.src;

    player2Left.current = new Image();
    player2Left.current.onload = checkAllLoaded;
    player2Left.current.onerror = () => {
      console.error("Failed to load player 2 left image");
      checkAllLoaded();
    };
    player2Left.current.src = typeof player2Walk2Img === 'string' ? player2Walk2Img : player2Walk2Img.src;

    keyImage.current = new Image();
    keyImage.current.onload = checkAllLoaded;
    keyImage.current.onerror = () => {
      console.error("Failed to load key image");
      checkAllLoaded();
    };
    keyImage.current.src = typeof keyImg === 'string' ? keyImg : keyImg.src;

    doorImage.current = new Image();
    doorImage.current.onload = checkAllLoaded;
    doorImage.current.onerror = () => {
      console.error("Failed to load door image");
      checkAllLoaded();
    };
    doorImage.current.src = typeof doorImg === 'string' ? doorImg : doorImg.src;

    deathImage.current = new Image();
    deathImage.current.onload = checkAllLoaded;
    deathImage.current.onerror = () => {
      console.error("Failed to load death image");
      checkAllLoaded();
    };
    deathImage.current.src = typeof deathImg === 'string' ? deathImg : deathImg.src;
  }, []);

  const platformsRef = useRef<Platform[]>([
    { x: 0, y: groundY, width: 180, height: 20 },
    { x: 200, y: groundY - 30, width: 80, height: 20 },
    { x: 310, y: groundY - 70, width: 70, height: 20 },
    { x: 410, y: groundY - 110, width: 65, height: 20 },
    { x: 505, y: groundY - 155, width: 70, height: 20 },
    { x: 605, y: groundY - 200, width: 85, height: 20 },
    { x: 720, y: groundY - 200, width: 100, height: 20 },
    { x: 850, y: groundY - 165, width: 70, height: 20 },
    { x: 950, y: groundY - 120, width: 65, height: 20 },
    { x: 1045, y: groundY - 75, width: 75, height: 20 },
    { x: 1150, y: groundY - 30, width: 80, height: 20 },
    { x: 1260, y: groundY, width: 100, height: 20 },
    { x: 1390, y: groundY - 50, width: 70, height: 20 },
    { x: 1490, y: groundY - 100, width: 65, height: 20 },
    { x: 1585, y: groundY - 155, width: 70, height: 20 },
    { x: 1685, y: groundY - 210, width: 75, height: 20 },
    { x: 1790, y: groundY - 270, width: 90, height: 20 },
    { x: 1910, y: groundY - 320, width: 120, height: 20 },
    { x: 2060, y: groundY - 280, width: 70, height: 20 },
    { x: 2160, y: groundY - 230, width: 65, height: 20 },
    { x: 2255, y: groundY - 175, width: 70, height: 20 },
    { x: 2355, y: groundY - 120, width: 75, height: 20 },
    { x: 2460, y: groundY - 60, width: 80, height: 20 },
    { x: 2570, y: groundY - 110, width: 70, height: 20 },
    { x: 2670, y: groundY - 170, width: 65, height: 20 },
    { x: 2765, y: groundY - 235, width: 70, height: 20 },
    { x: 2865, y: groundY - 305, width: 85, height: 20 },
    { x: 2980, y: groundY - 360, width: 150, height: 20 },
  ]);

  const movingPlatformsRef = useRef<MovingPlatform[]>([
    { x: 650, y: groundY - 250, width: 70, height: 20, startX: 605, endX: 720, speed: 2, direction: 1 },
    { x: 1120, y: groundY - 60, width: 60, height: 20, startX: 1045, endX: 1150, speed: 1.8, direction: 1 },
    { x: 1730, y: groundY - 240, width: 60, height: 20, startX: 1685, endX: 1790, speed: 2.5, direction: 1 },
    { x: 2410, y: groundY - 90, width: 60, height: 20, startX: 2355, endX: 2460, speed: 2, direction: 1 },
    { x: 2815, y: groundY - 275, width: 60, height: 20, startX: 2765, endX: 2865, speed: 1.8, direction: 1 },
  ]);

  const fallingPlatformsRef = useRef<FallingPlatform[]>([
    { x: 275, y: groundY - 50, width: 55, height: 20, falling: false, fallTimer: 0, originalY: groundY - 50 },
    { x: 1225, y: groundY - 15, width: 55, height: 20, falling: false, fallTimer: 0, originalY: groundY - 15 },
    { x: 2220, y: groundY - 205, width: 55, height: 20, falling: false, fallTimer: 0, originalY: groundY - 205 },
  ]);

  const cloudsRef = useRef<Cloud[]>([
    { x: 100, y: 50, width: 120, speed: 0.3 },
    { x: 400, y: 80, width: 90, speed: 0.2 },
    { x: 700, y: 40, width: 150, speed: 0.4 },
    { x: 1000, y: 70, width: 100, speed: 0.25 },
    { x: 1400, y: 50, width: 130, speed: 0.35 },
    { x: 1800, y: 90, width: 110, speed: 0.2 },
    { x: 2200, y: 60, width: 140, speed: 0.3 },
    { x: 2600, y: 45, width: 100, speed: 0.25 },
    { x: 3000, y: 75, width: 120, speed: 0.35 },
  ]);

  const keyRef = useRef<Key>({
    x: 1950,
    y: groundY - 370,
    width: 40,
    height: 40,
    collected: false,
  });

  const doorRef = useRef<Door>({
    x: 3030,
    y: groundY - 430,
    width: 55,
    height: 75,
  });

  const cameraRef = useRef({ x: 0, y: 0 });

  const checkCollision = (
    rect1: { x: number; y: number; width: number; height: number },
    rect2: { x: number; y: number; width: number; height: number }
  ) => {
    return (
      rect1.x < rect2.x + rect2.width &&
      rect1.x + rect1.width > rect2.x &&
      rect1.y < rect2.y + rect2.height &&
      rect1.y + rect1.height > rect2.y
    );
  };

  const checkPlayerStacking = (player: Player, otherPlayer: Player): boolean => {
    if (player.dead || otherPlayer.dead) return false;
    
    const feetY = player.y + player.height;
    const headY = otherPlayer.y;
    
    const verticalCheck = feetY >= headY - 5 && feetY <= headY + 15 && player.vy >= 0;
    
    const horizontalOverlap = 
      player.x + player.width > otherPlayer.x + 10 &&
      player.x < otherPlayer.x + otherPlayer.width - 10;
    
    return verticalCheck && horizontalOverlap;
  };

  const resetGame = useCallback(() => {
    playersRef.current = [
      {
        id: 1,
        x: 50,
        y: groundY - 100,
        vx: 0,
        vy: 0,
        width: PLAYER_WIDTH,
        height: PLAYER_HEIGHT,
        onGround: false,
        animFrame: 0,
        facingRight: true,
        color: "#4A90D9",
        dead: false,
        standingOnPlayer: null,
      },
      {
        id: 2,
        x: 100,
        y: groundY - 100,
        vx: 0,
        vy: 0,
        width: PLAYER_WIDTH,
        height: PLAYER_HEIGHT,
        onGround: false,
        animFrame: 0,
        facingRight: true,
        color: "#D94A4A",
        dead: false,
        standingOnPlayer: null,
      },
    ];
    keyRef.current.collected = false;
    fallingPlatformsRef.current.forEach(fp => {
      fp.falling = false;
      fp.fallTimer = 0;
      fp.y = fp.originalY;
    });
    cameraRef.current = { x: 0, y: 0 };
    setHasKey(false);
    setPlayersAtDoor(new Set());
    setGameState("playing");
  }, [groundY]);

  const handleDeath = useCallback(() => {
    if (gameState === "dead") return;
    setGameState("dead");
    
    if (deathTimer.current) {
      clearTimeout(deathTimer.current);
    }
    
    deathTimer.current = setTimeout(() => {
      resetGame();
    }, DEATH_FREEZE_TIME);
  }, [gameState, resetGame]);

  const gameLoop = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const players = playersRef.current;
    const platforms = platformsRef.current;
    const movingPlatforms = movingPlatformsRef.current;
    const fallingPlatforms = fallingPlatformsRef.current;
    const clouds = cloudsRef.current;
    const key = keyRef.current;
    const door = doorRef.current;

    animTimer.current++;

    if (gameState === "playing") {
      clouds.forEach((cloud) => {
        cloud.x += cloud.speed;
        if (cloud.x > 3500) {
          cloud.x = -cloud.width;
        }
      });

      movingPlatforms.forEach((mp) => {
        mp.x += mp.speed * mp.direction;
        if (mp.x <= mp.startX || mp.x + mp.width >= mp.endX + mp.width) {
          mp.direction *= -1;
        }
      });

      fallingPlatforms.forEach((fp) => {
        if (fp.falling) {
          fp.fallTimer++;
          if (fp.fallTimer > 30) {
            fp.y += 8;
          }
        }
      });

      players.forEach((player, playerIndex) => {
        if (player.dead) return;

        if (player.id === 1) {
          if (keysPressed.current.has("a")) {
            player.vx = -MOVE_SPEED;
            player.facingRight = false;
          } else if (keysPressed.current.has("d")) {
            player.vx = MOVE_SPEED;
            player.facingRight = true;
          } else {
            player.vx = 0;
          }

          if (keysPressed.current.has("w") && player.onGround) {
            player.vy = JUMP_FORCE;
            player.onGround = false;
          }
        } else {
          if (keysPressed.current.has("arrowleft")) {
            player.vx = -MOVE_SPEED;
            player.facingRight = false;
          } else if (keysPressed.current.has("arrowright")) {
            player.vx = MOVE_SPEED;
            player.facingRight = true;
          } else {
            player.vx = 0;
          }

          if (keysPressed.current.has("arrowup") && player.onGround) {
            player.vy = JUMP_FORCE;
            player.onGround = false;
          }
        }

        player.vy += GRAVITY;
        player.x += player.vx;
        player.y += player.vy;

        if (player.vx !== 0) {
          if (animTimer.current % 8 === 0) {
            player.animFrame = player.animFrame === 1 ? 2 : 1;
          }
        } else {
          player.animFrame = 0;
        }

        player.onGround = false;
        player.standingOnPlayer = null;

        players.forEach((otherPlayer, otherIndex) => {
          if (playerIndex === otherIndex || otherPlayer.dead) return;

          if (checkPlayerStacking(player, otherPlayer)) {
            player.y = otherPlayer.y - player.height;
            player.vy = 0;
            player.onGround = true;
            player.standingOnPlayer = otherPlayer.id;
            
            if (otherPlayer.vx !== 0 && player.vx === 0) {
              player.x += otherPlayer.vx * 0.8;
            }
          }
        });

        players.forEach((otherPlayer, otherIndex) => {
          if (playerIndex === otherIndex || otherPlayer.dead) return;
          if (player.standingOnPlayer === otherPlayer.id || otherPlayer.standingOnPlayer === player.id) return;

          if (checkCollision(player, otherPlayer)) {
            const overlapLeft = player.x + player.width - otherPlayer.x;
            const overlapRight = otherPlayer.x + otherPlayer.width - player.x;
            const overlapTop = player.y + player.height - otherPlayer.y;
            const overlapBottom = otherPlayer.y + otherPlayer.height - player.y;

            const minOverlapX = Math.min(overlapLeft, overlapRight);
            const minOverlapY = Math.min(overlapTop, overlapBottom);

            if (minOverlapX < minOverlapY) {
              const pushForce = 0.2;
              
              if (overlapLeft < overlapRight) {
                const separation = minOverlapX / 2 + 0.5;
                player.x -= separation;
                otherPlayer.x += separation;
                
                if (player.vx > 0) {
                  otherPlayer.vx = Math.min(otherPlayer.vx + pushForce, MOVE_SPEED);
                }
              } else {
                const separation = minOverlapX / 2 + 0.5;
                player.x += separation;
                otherPlayer.x -= separation;
                
                if (player.vx < 0) {
                  otherPlayer.vx = Math.max(otherPlayer.vx - pushForce, -MOVE_SPEED);
                }
              }
            }
          }
        });

        const allPlatforms: Platform[] = [...platforms, ...movingPlatforms, ...fallingPlatforms.filter(fp => fp.y < canvasSize.height)];

        allPlatforms.forEach((platform) => {
          if (checkCollision(player, platform)) {
            const overlapLeft = player.x + player.width - platform.x;
            const overlapRight = platform.x + platform.width - player.x;
            const overlapTop = player.y + player.height - platform.y;
            const overlapBottom = platform.y + platform.height - player.y;

            const minOverlapX = Math.min(overlapLeft, overlapRight);
            const minOverlapY = Math.min(overlapTop, overlapBottom);

            if (minOverlapY < minOverlapX) {
              if (overlapTop < overlapBottom && player.vy > 0) {
                player.y = platform.y - player.height;
                player.vy = 0;
                player.onGround = true;
                
                const fallingPlatform = fallingPlatforms.find(
                  fp => fp.x === platform.x && fp.originalY === (platform as FallingPlatform).originalY
                );
                if (fallingPlatform && !fallingPlatform.falling) {
                  fallingPlatform.falling = true;
                }
              } else if (overlapBottom < overlapTop && player.vy < 0) {
                player.y = platform.y + platform.height;
                player.vy = 0;
              }
            } else {
              if (overlapLeft < overlapRight) {
                player.x = platform.x - player.width;
              } else {
                player.x = platform.x + platform.width;
              }
              player.vx = 0;
            }
          }
        });

        if (!key.collected && checkCollision(player, key)) {
          key.collected = true;
          setHasKey(true);
        }

        if (key.collected && checkCollision(player, door)) {
          setPlayersAtDoor(prev => {
            const newSet = new Set(prev);
            newSet.add(player.id);
            return newSet;
          });
        }

        if (player.y > canvasSize.height + 50) {
          handleDeath();
        }

        if (player.x < 0) {
          player.x = 0;
        }
      });

      if (playersAtDoor.size === 2) {
        setGameState("won");
      }

      const avgX = players.reduce((sum, p) => sum + p.x, 0) / players.length;
      const targetCameraX = avgX - canvasSize.width / 2 + PLAYER_WIDTH / 2;
      cameraRef.current.x += (targetCameraX - cameraRef.current.x) * 0.1;
      if (cameraRef.current.x < 0) cameraRef.current.x = 0;
    }

    const gradient = ctx.createLinearGradient(0, 0, 0, canvasSize.height);
    gradient.addColorStop(0, "#87CEEB");
    gradient.addColorStop(0.5, "#B0E2FF");
    gradient.addColorStop(1, "#E0F4FF");
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, canvasSize.width, canvasSize.height);

    ctx.save();
    ctx.fillStyle = "#FFD700";
    ctx.shadowColor = "#FFA500";
    ctx.shadowBlur = 50;
    ctx.beginPath();
    ctx.arc(canvasSize.width - 100, 100, 60, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();

    ctx.strokeStyle = "rgba(255, 215, 0, 0.3)";
    ctx.lineWidth = 4;
    for (let i = 0; i < 12; i++) {
      const angle = (i * 30 * Math.PI) / 180;
      ctx.beginPath();
      ctx.moveTo(canvasSize.width - 100 + Math.cos(angle) * 70, 100 + Math.sin(angle) * 70);
      ctx.lineTo(canvasSize.width - 100 + Math.cos(angle) * 110, 100 + Math.sin(angle) * 110);
      ctx.stroke();
    }

    ctx.save();
    ctx.translate(-cameraRef.current.x * 0.3, 0);
    clouds.forEach((cloud) => {
      ctx.fillStyle = "rgba(255, 255, 255, 0.9)";
      ctx.beginPath();
      ctx.arc(cloud.x, cloud.y, cloud.width * 0.25, 0, Math.PI * 2);
      ctx.arc(cloud.x + cloud.width * 0.2, cloud.y - 10, cloud.width * 0.2, 0, Math.PI * 2);
      ctx.arc(cloud.x + cloud.width * 0.4, cloud.y, cloud.width * 0.3, 0, Math.PI * 2);
      ctx.arc(cloud.x + cloud.width * 0.6, cloud.y - 5, cloud.width * 0.2, 0, Math.PI * 2);
      ctx.arc(cloud.x + cloud.width * 0.75, cloud.y + 5, cloud.width * 0.2, 0, Math.PI * 2);
      ctx.fill();
    });
    ctx.restore();

    ctx.save();
    ctx.translate(-cameraRef.current.x, 0);

    ctx.fillStyle = "#90EE90";
    ctx.fillRect(-100, canvasSize.height - 60, 3500, 100);

    platforms.forEach((platform) => {
      ctx.fillStyle = "#228B22";
      ctx.fillRect(platform.x, platform.y, platform.width, 8);
      ctx.fillStyle = "#8B4513";
      ctx.fillRect(platform.x, platform.y + 8, platform.width, platform.height - 8);
    });

    movingPlatforms.forEach((platform) => {
      ctx.fillStyle = "#DAA520";
      ctx.fillRect(platform.x, platform.y, platform.width, platform.height);
      ctx.fillStyle = "#FFD700";
      ctx.fillRect(platform.x, platform.y, platform.width, 5);
    });

    fallingPlatforms.forEach((platform) => {
      if (platform.y < canvasSize.height) {
        ctx.fillStyle = platform.falling ? "#A0522D" : "#CD853F";
        ctx.fillRect(platform.x, platform.y, platform.width, platform.height);
        ctx.strokeStyle = "#654321";
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(platform.x + 10, platform.y);
        ctx.lineTo(platform.x + 15, platform.y + platform.height);
        ctx.moveTo(platform.x + 30, platform.y);
        ctx.lineTo(platform.x + 25, platform.y + platform.height);
        ctx.stroke();
      }
    });

    if (doorImage.current && doorImage.current.complete) {
      ctx.drawImage(doorImage.current, door.x, door.y, door.width, door.height);
      if (!key.collected) {
        ctx.fillStyle = "rgba(100, 100, 100, 0.5)";
        ctx.fillRect(door.x, door.y, door.width, door.height);
      }
    }

    if (!key.collected && keyImage.current && keyImage.current.complete) {
      const bobOffset = Math.sin(animTimer.current * 0.1) * 5;
      ctx.drawImage(keyImage.current, key.x, key.y + bobOffset, key.width, key.height);
    }

    players.forEach((player) => {
      if (player.dead) return;

      let playerImage: HTMLImageElement | null = null;
      
      if (player.id === 1) {
        if (player.animFrame === 0) {
          playerImage = playerIdle.current;
        } else {
          if (player.facingRight) {
            playerImage = playerRight.current;
          } else {
            playerImage = playerLeft.current;
          }
        }
      } else {
        if (player.animFrame === 0) {
          playerImage = player2Idle.current;
        } else {
          if (player.facingRight) {
            playerImage = player2Right.current;
          } else {
            playerImage = player2Left.current;
          }
        }
      }

      if (playerImage && playerImage.complete) {
        ctx.save();
        ctx.shadowColor = player.color;
        ctx.shadowBlur = 8;
        ctx.drawImage(playerImage, player.x, player.y, player.width, player.height);
        ctx.restore();

        ctx.fillStyle = player.color;
        ctx.font = "bold 14px Arial";
        ctx.textAlign = "center";
        ctx.fillText(`P${player.id}`, player.x + player.width / 2, player.y - 10);
      }
    });

    ctx.restore();

    ctx.fillStyle = "rgba(0, 0, 0, 0.6)";
    ctx.fillRect(15, 15, 180, 50);
    ctx.fillStyle = "#fff";
    ctx.font = "bold 20px Arial";
    ctx.textAlign = "left";
    ctx.fillText(`Key: ${hasKey ? "✅" : "🔒"}`, 25, 45);
    ctx.fillText(`Door: ${playersAtDoor.size}/2`, 100, 45);

    ctx.font = "14px Arial";
    ctx.fillStyle = "rgba(0,0,0,0.6)";
    ctx.fillRect(15, canvasSize.height - 55, 420, 45);
    ctx.fillStyle = "#4A90D9";
    ctx.fillText("P1: WASD", 25, canvasSize.height - 32);
    ctx.fillStyle = "#D94A4A";
    ctx.fillText("P2: Arrow Keys", 120, canvasSize.height - 32);
    ctx.fillStyle = "#fff";
    ctx.fillText("| Stack on each other like Pico Park!", 240, canvasSize.height - 32);

    if (gameState === "dead") {
      ctx.fillStyle = "rgba(0, 0, 0, 0.7)";
      ctx.fillRect(0, 0, canvasSize.width, canvasSize.height);
      
      if (deathImage.current && deathImage.current.complete) {
        const imgSize = 150;
        ctx.drawImage(
          deathImage.current,
          canvasSize.width / 2 - imgSize / 2,
          canvasSize.height / 2 - imgSize / 2 - 30,
          imgSize,
          imgSize
        );
      }
      
      ctx.fillStyle = "#ff4444";
      ctx.font = "bold 48px Arial";
      ctx.textAlign = "center";
      ctx.fillText("YOU DIED! Maybe skill issue?", canvasSize.width / 2, canvasSize.height / 2 + 100);
      ctx.font = "24px Arial";
      ctx.fillStyle = "#ffffff";
      ctx.fillText("Respawning...", canvasSize.width / 2, canvasSize.height / 2 + 140);
      ctx.textAlign = "left";
    }
  }, [hasKey, gameState, canvasSize, handleDeath, playersAtDoor]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      keysPressed.current.add(e.key.toLowerCase());
      
      if (["ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight", " "].includes(e.key)) {
        e.preventDefault();
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      keysPressed.current.delete(e.key.toLowerCase());
    };

    window.addEventListener("keydown", handleKeyDown);
    window.addEventListener("keyup", handleKeyUp);

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("keyup", handleKeyUp);
    };
  }, []);

  useEffect(() => {
    if (!imagesLoaded) return;
    
    const interval = setInterval(gameLoop, 1000 / 60);
    return () => clearInterval(interval);
  }, [gameLoop, imagesLoaded]);

  useEffect(() => {
    return () => {
      if (deathTimer.current) {
        clearTimeout(deathTimer.current);
      }
    };
  }, []);

  if (!imagesLoaded) {
    return (
      <div className="w-screen h-screen flex items-center justify-center bg-gradient-to-b from-blue-400 to-blue-200">
        <div className="text-center">
          <div className="text-4xl font-bold text-white mb-4">Loading...</div>
          <div className="w-48 h-2 bg-white/30 rounded-full overflow-hidden">
            <div className="h-full bg-white animate-pulse"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div ref={containerRef} className="w-screen h-screen overflow-hidden bg-game-sky-top">
      <canvas
        ref={canvasRef}
        width={canvasSize.width}
        height={canvasSize.height}
        className="block"
      />
      
      {gameState === "won" && (
        <div className="fixed inset-0 flex flex-col items-center justify-center bg-game-overlay/70">
          <h2 className="text-6xl font-bold text-game-gold mb-6">🎉 You Both Won!</h2>
          <p className="text-primary-foreground text-2xl mb-8">Teamwork makes the dream work!</p>
          <button
            onClick={resetGame}
            className="px-10 py-5 bg-game-success hover:opacity-90 text-primary-foreground font-bold text-2xl rounded-xl transition-all hover:scale-105 shadow-lg"
          >
            🔄 Play Again
          </button>
        </div>
      )}
    </div>
  );
};

export default World1;

import { useEffect, useRef, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import playerIdleImg from "@/assets/player-idle.png";
import playerWalk1Img from "@/assets/player-right.png";
import playerWalk2Img from "@/assets/player-left.png";
import player2IdleImg from "@/assets/player2-idle.png";
import player2Walk1Img from "@/assets/player2-right.png";
import player2Walk2Img from "@/assets/player2-left.png";
import keyImg from "@/assets/key.png";
import doorImg from "@/assets/door.png";
import deathImg from "@/assets/death.png";
import dangerButtonImg from "@/assets/danger-button.png";

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

interface DangerButton {
  x: number;
  y: number;
  width: number;
  height: number;
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

const World2 = () => {
  const navigate = useNavigate();
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
  const dangerButtonImage = useRef<HTMLImageElement | null>(null);

  const groundY = canvasSize.height - 80;

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
    const totalImages = 10;

    const checkAllLoaded = () => {
      loadedCount++;
      if (loadedCount === totalImages) {
        setImagesLoaded(true);
      }
    };

    const loadImage = (ref: React.MutableRefObject<HTMLImageElement | null>, src: string) => {
      ref.current = new Image();
      ref.current.onload = checkAllLoaded;
      ref.current.onerror = () => {
        console.error("Failed to load image:", src);
        checkAllLoaded();
      };
      ref.current.src = src;
    };

    loadImage(playerIdle, playerIdleImg);
    loadImage(playerRight, playerWalk1Img);
    loadImage(playerLeft, playerWalk2Img);
    loadImage(player2Idle, player2IdleImg);
    loadImage(player2Right, player2Walk1Img);
    loadImage(player2Left, player2Walk2Img);
    loadImage(keyImage, keyImg);
    loadImage(doorImage, doorImg);
    loadImage(deathImage, deathImg);
    loadImage(dangerButtonImage, dangerButtonImg);
  }, []);

  // Extended platforms for longer level
  const platformsRef = useRef<Platform[]>([
    // Starting area - safe zone
    { x: 0, y: groundY, width: 250, height: 20 },
    
    // Section 1: Button gauntlet beginning
    { x: 320, y: groundY, width: 60, height: 20 },
    { x: 450, y: groundY, width: 60, height: 20 },
    { x: 580, y: groundY, width: 60, height: 20 },
    { x: 710, y: groundY, width: 80, height: 20 },
    
    // Section 2: Elevated platforms with buttons below
    { x: 850, y: groundY - 60, width: 100, height: 20 },
    { x: 1000, y: groundY - 100, width: 80, height: 20 },
    { x: 1130, y: groundY - 140, width: 80, height: 20 },
    { x: 1260, y: groundY - 100, width: 80, height: 20 },
    { x: 1390, y: groundY - 60, width: 100, height: 20 },
    
    // Section 3: Narrow platforms over button field
    { x: 1550, y: groundY, width: 50, height: 20 },
    { x: 1660, y: groundY - 40, width: 50, height: 20 },
    { x: 1770, y: groundY, width: 50, height: 20 },
    { x: 1880, y: groundY - 40, width: 50, height: 20 },
    { x: 1990, y: groundY, width: 50, height: 20 },
    
    // Section 4: High jump section - need stacking
    { x: 2100, y: groundY, width: 120, height: 20 },
    { x: 2280, y: groundY - 180, width: 100, height: 20 }, // Very high - needs stacking
    { x: 2440, y: groundY - 180, width: 100, height: 20 },
    { x: 2600, y: groundY - 120, width: 80, height: 20 },
    { x: 2740, y: groundY - 60, width: 80, height: 20 },
    
    // Section 5: Final button maze
    { x: 2880, y: groundY, width: 60, height: 20 },
    { x: 3000, y: groundY - 50, width: 60, height: 20 },
    { x: 3120, y: groundY, width: 60, height: 20 },
    { x: 3240, y: groundY - 50, width: 60, height: 20 },
    { x: 3360, y: groundY, width: 60, height: 20 },
    
    // Section 6: Key platform - very high, needs double stack
    { x: 3480, y: groundY, width: 150, height: 20 },
    { x: 3700, y: groundY - 220, width: 120, height: 20 }, // Key platform
    
    // Section 7: Return path with buttons
    { x: 3880, y: groundY - 160, width: 80, height: 20 },
    { x: 4020, y: groundY - 100, width: 80, height: 20 },
    { x: 4160, y: groundY - 40, width: 80, height: 20 },
    { x: 4300, y: groundY, width: 100, height: 20 },
    
    // Section 8: Door platform
    { x: 4460, y: groundY, width: 200, height: 20 },
  ]);

  // Danger buttons - deadly obstacles (spaced out more)
  const dangerButtonsRef = useRef<DangerButton[]>([
    // Section 1 buttons between platforms - one per gap
    { x: 280, y: groundY - 35, width: 40, height: 35 },
    { x: 520, y: groundY - 35, width: 40, height: 35 },
    
    // Section 2 - fewer buttons, more spaced
    { x: 920, y: groundY - 35, width: 40, height: 35 },
    { x: 1180, y: groundY - 35, width: 40, height: 35 },
    { x: 1440, y: groundY - 35, width: 40, height: 35 },
    
    // Section 3 - one button per gap
    { x: 1610, y: groundY - 35, width: 40, height: 35 },
    { x: 1830, y: groundY - 35, width: 40, height: 35 },
    
    // Section 4 - spaced under high platforms
    { x: 2200, y: groundY - 35, width: 40, height: 35 },
    { x: 2500, y: groundY - 35, width: 40, height: 35 },
    
    // Section 5 - final maze, one per gap
    { x: 2950, y: groundY - 35, width: 40, height: 35 },
    { x: 3190, y: groundY - 35, width: 40, height: 35 },
    
    // Section 6 - under key platform, spaced
    { x: 3580, y: groundY - 35, width: 40, height: 35 },
    { x: 3780, y: groundY - 35, width: 40, height: 35 },
    
    // Section 7 - return path, fewer buttons
    { x: 4020, y: groundY - 35, width: 40, height: 35 },
    { x: 4300, y: groundY - 35, width: 40, height: 35 },
  ]);

  const cloudsRef = useRef<Cloud[]>([
    { x: 100, y: 50, width: 120, speed: 0.3 },
    { x: 500, y: 80, width: 90, speed: 0.2 },
    { x: 900, y: 40, width: 150, speed: 0.4 },
    { x: 1300, y: 70, width: 100, speed: 0.25 },
    { x: 1700, y: 50, width: 130, speed: 0.35 },
    { x: 2100, y: 90, width: 110, speed: 0.2 },
    { x: 2500, y: 60, width: 140, speed: 0.3 },
    { x: 2900, y: 45, width: 100, speed: 0.25 },
    { x: 3300, y: 75, width: 120, speed: 0.35 },
    { x: 3700, y: 55, width: 110, speed: 0.28 },
    { x: 4100, y: 65, width: 130, speed: 0.32 },
    { x: 4500, y: 50, width: 100, speed: 0.22 },
  ]);

  const keyRef = useRef<Key>({
    x: 3740,
    y: groundY - 280,
    width: 40,
    height: 40,
    collected: false,
  });

  const doorRef = useRef<Door>({
    x: 4520,
    y: groundY - 75,
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
    const dangerButtons = dangerButtonsRef.current;
    const clouds = cloudsRef.current;
    const key = keyRef.current;
    const door = doorRef.current;

    animTimer.current++;

    if (gameState === "playing") {
      clouds.forEach((cloud) => {
        cloud.x += cloud.speed;
        if (cloud.x > 5000) {
          cloud.x = -cloud.width;
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

        // Check stacking on other players
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

        // Horizontal collision between players
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
              const pushForce = 0.2;  // ЭНЭ НЬ СОЛИГДСОН - 0.8-аас 0.2 болсон
              
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

        // Platform collision
        platforms.forEach((platform) => {
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

        // DANGER BUTTON COLLISION - DEATH!
        dangerButtons.forEach((button) => {
          if (checkCollision(player, button)) {
            handleDeath();
          }
        });

        // Key collection
        if (!key.collected && checkCollision(player, key)) {
          key.collected = true;
          setHasKey(true);
        }

        // Door check
        if (key.collected && checkCollision(player, door)) {
          setPlayersAtDoor(prev => {
            const newSet = new Set(prev);
            newSet.add(player.id);
            return newSet;
          });
        }

        // Fall death
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

      // Camera follow
      const avgX = players.reduce((sum, p) => sum + p.x, 0) / players.length;
      const targetCameraX = avgX - canvasSize.width / 2 + PLAYER_WIDTH / 2;
      cameraRef.current.x += (targetCameraX - cameraRef.current.x) * 0.1;
      if (cameraRef.current.x < 0) cameraRef.current.x = 0;
    }

    // Draw background - night sky with stars and moon
    const gradient = ctx.createLinearGradient(0, 0, 0, canvasSize.height);
    gradient.addColorStop(0, "#0a0e27");
    gradient.addColorStop(0.5, "#1a1d3a");
    gradient.addColorStop(1, "#0f1129");
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, canvasSize.width, canvasSize.height);

    // Draw stars
    ctx.save();
    ctx.fillStyle = "#ffffff";
    const starPositions = [
      // Static star positions for consistency
      { x: 100, y: 50, size: 2 },
      { x: 250, y: 100, size: 1.5 },
      { x: 400, y: 30, size: 2.5 },
      { x: 600, y: 80, size: 1 },
      { x: 800, y: 120, size: 2 },
      { x: 950, y: 40, size: 1.5 },
      { x: 1100, y: 90, size: 2 },
      { x: 200, y: 150, size: 1 },
      { x: 500, y: 140, size: 2.5 },
      { x: 700, y: 60, size: 1.5 },
      { x: 900, y: 110, size: 2 },
      { x: 1050, y: 70, size: 1 },
      { x: 150, y: 130, size: 2 },
      { x: 350, y: 50, size: 1.5 },
      { x: 550, y: 100, size: 2.5 },
      { x: 750, y: 140, size: 1 },
      { x: 850, y: 30, size: 2 },
      { x: 1000, y: 120, size: 1.5 },
    ];
    
    // Draw stars with twinkling effect
    starPositions.forEach((star, index) => {
      const twinkle = Math.sin(animTimer.current * 0.05 + index) * 0.5 + 0.5;
      ctx.globalAlpha = twinkle * 0.8 + 0.2;
      ctx.beginPath();
      ctx.arc(star.x, star.y, star.size, 0, Math.PI * 2);
      ctx.fill();
      
      // Add star glow
      ctx.globalAlpha = twinkle * 0.3;
      ctx.beginPath();
      ctx.arc(star.x, star.y, star.size * 2, 0, Math.PI * 2);
      ctx.fill();
    });
    ctx.restore();

    // Draw moon
    ctx.save();
    const moonX = canvasSize.width - 150;
    const moonY = 80;
    const moonRadius = 40;
    
    // Moon glow
    const moonGlow = ctx.createRadialGradient(moonX, moonY, moonRadius * 0.5, moonX, moonY, moonRadius * 2);
    moonGlow.addColorStop(0, "rgba(255, 255, 200, 0.3)");
    moonGlow.addColorStop(1, "rgba(255, 255, 200, 0)");
    ctx.fillStyle = moonGlow;
    ctx.beginPath();
    ctx.arc(moonX, moonY, moonRadius * 2, 0, Math.PI * 2);
    ctx.fill();
    
    // Moon body
    ctx.fillStyle = "#f4f1de";
    ctx.beginPath();
    ctx.arc(moonX, moonY, moonRadius, 0, Math.PI * 2);
    ctx.fill();
    
    // Moon craters
    ctx.fillStyle = "rgba(220, 220, 200, 0.4)";
    ctx.beginPath();
    ctx.arc(moonX - 10, moonY - 8, 8, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.arc(moonX + 12, moonY + 5, 6, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.arc(moonX - 5, moonY + 15, 5, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();

    // Clouds (night clouds - darker and subtle)
    ctx.save();
    ctx.translate(-cameraRef.current.x * 0.3, 0);
    clouds.forEach((cloud) => {
      ctx.fillStyle = "rgba(30, 30, 50, 0.3)";
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

    // Ground - dark night ground
    ctx.fillStyle = "#1a1a2e";
    ctx.fillRect(-100, canvasSize.height - 60, 5000, 100);

    // Draw platforms - metal style
    platforms.forEach((platform) => {
      // Metal base
      ctx.fillStyle = "#5D6D7E";
      ctx.fillRect(platform.x, platform.y, platform.width, platform.height);
      
      // Top highlight
      ctx.fillStyle = "#85929E";
      ctx.fillRect(platform.x, platform.y, platform.width, 4);
      
      // Rivets
      ctx.fillStyle = "#2C3E50";
      for (let i = platform.x + 10; i < platform.x + platform.width - 10; i += 20) {
        ctx.beginPath();
        ctx.arc(i, platform.y + 10, 3, 0, Math.PI * 2);
        ctx.fill();
      }
    });

    // Draw danger buttons
    dangerButtons.forEach((button) => {
      if (dangerButtonImage.current && dangerButtonImage.current.complete) {
        ctx.drawImage(dangerButtonImage.current, button.x, button.y, button.width, button.height);
      } else {
        // Fallback red button
        ctx.fillStyle = "#E74C3C";
        ctx.beginPath();
        ctx.arc(button.x + button.width / 2, button.y + button.height / 2, button.width / 2, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = "#C0392B";
        ctx.beginPath();
        ctx.arc(button.x + button.width / 2, button.y + button.height / 2 + 3, button.width / 2 - 5, 0, Math.PI * 2);
        ctx.fill();
      }
      
      // Pulsing glow effect
      const pulse = Math.sin(animTimer.current * 0.1) * 0.3 + 0.7;
      ctx.save();
      ctx.globalAlpha = pulse * 0.3;
      ctx.fillStyle = "#E74C3C";
      ctx.beginPath();
      ctx.arc(button.x + button.width / 2, button.y + button.height / 2, button.width / 2 + 10, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    });

    // Draw door
    if (doorImage.current && doorImage.current.complete) {
      ctx.drawImage(doorImage.current, door.x, door.y, door.width, door.height);
      if (!key.collected) {
        ctx.fillStyle = "rgba(100, 100, 100, 0.5)";
        ctx.fillRect(door.x, door.y, door.width, door.height);
      }
    }

    // Draw key
    if (!key.collected && keyImage.current && keyImage.current.complete) {
      const bobOffset = Math.sin(animTimer.current * 0.1) * 5;
      ctx.drawImage(keyImage.current, key.x, key.y + bobOffset, key.width, key.height);
      
      // Glow effect
      ctx.save();
      ctx.globalAlpha = 0.3;
      ctx.fillStyle = "#F1C40F";
      ctx.beginPath();
      ctx.arc(key.x + key.width / 2, key.y + key.height / 2 + bobOffset, 30, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }

    // Draw players
    players.forEach((player) => {
      if (player.dead) return;

      let playerImage: HTMLImageElement | null = null;
      
      if (player.id === 1) {
        if (player.animFrame === 0) {
          playerImage = playerIdle.current;
        } else {
          playerImage = player.facingRight ? playerRight.current : playerLeft.current;
        }
      } else {
        if (player.animFrame === 0) {
          playerImage = player2Idle.current;
        } else {
          playerImage = player.facingRight ? player2Right.current : player2Left.current;
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

    // UI
    ctx.fillStyle = "rgba(0, 0, 0, 0.7)";
    ctx.fillRect(15, 15, 200, 70);
    ctx.fillStyle = "#fff";
    ctx.font = "bold 16px Arial";
    ctx.textAlign = "left";
    ctx.fillText("WORLD 2: BUTTON DEATH", 25, 38);
    ctx.font = "bold 20px Arial";
    ctx.fillText(`Key: ${hasKey ? "✅" : "🔒"}`, 25, 65);
    ctx.fillText(`Door: ${playersAtDoor.size}/2`, 110, 65);

    // Warning text
    ctx.fillStyle = "#E74C3C";
    ctx.font = "bold 14px Arial";
    ctx.fillText("⚠️ DON'T TOUCH THE BUTTONS!", 25, 105);

    // Controls
    ctx.font = "14px Arial";
    ctx.fillStyle = "rgba(0,0,0,0.7)";
    ctx.fillRect(15, canvasSize.height - 55, 450, 45);
    ctx.fillStyle = "#4A90D9";
    ctx.fillText("P1: WASD", 25, canvasSize.height - 32);
    ctx.fillStyle = "#D94A4A";
    ctx.fillText("P2: Arrow Keys", 120, canvasSize.height - 32);
    ctx.fillStyle = "#fff";
    ctx.fillText("| Stack to reach high platforms!", 240, canvasSize.height - 32);

    // Death screen
    if (gameState === "dead") {
      ctx.fillStyle = "rgba(0, 0, 0, 0.8)";
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
      
      ctx.fillStyle = "#E74C3C";
      ctx.font = "bold 48px Arial";
      ctx.textAlign = "center";
      ctx.fillText("BUTTON PRESSED! 💀", canvasSize.width / 2, canvasSize.height / 2 + 100);
      ctx.font = "24px Arial";
      ctx.fillStyle = "#ffffff";
      ctx.fillText("Don't touch the red buttons!", canvasSize.width / 2, canvasSize.height / 2 + 140);
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
      <div className="w-screen h-screen flex items-center justify-center bg-gradient-to-b from-slate-800 to-slate-900">
        <div className="text-center">
          <div className="text-4xl font-bold text-white mb-4">Loading World 2...</div>
          <div className="w-48 h-2 bg-white/30 rounded-full overflow-hidden">
            <div className="h-full bg-red-500 animate-pulse"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div ref={containerRef} className="w-screen h-screen overflow-hidden bg-slate-900">
      <canvas
        ref={canvasRef}
        width={canvasSize.width}
        height={canvasSize.height}
        className="block"
      />
      
      {gameState === "won" && (
        <div className="fixed inset-0 flex flex-col items-center justify-center bg-black/80">
          <h2 className="text-6xl font-bold text-yellow-400 mb-6">🎉 Level Complete!</h2>
          <p className="text-white text-2xl mb-8">You avoided all the deadly buttons!</p>
          <div className="flex gap-4">
            <button
              onClick={resetGame}
              className="px-10 py-5 bg-green-600 hover:bg-green-500 text-white font-bold text-2xl rounded-xl transition-all hover:scale-105 shadow-lg"
            >
              🔄 Play Again
            </button>
            <button
              onClick={() => navigate("/")}
              className="px-10 py-5 bg-blue-600 hover:bg-blue-500 text-white font-bold text-2xl rounded-xl transition-all hover:scale-105 shadow-lg"
            >
              🏠 Level Select
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default World2;
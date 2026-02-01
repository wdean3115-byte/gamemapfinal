import { useEffect, useRef, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import player1IdleImg from "@/assets/player1-idle.png";
import player1RightImg from "@/assets/player1-right.png";
import player1LeftImg from "@/assets/player1-left.png";
import player2IdleImg from "@/assets/player2-idle.png";
import player2RightImg from "@/assets/player2-right.png";
import player2LeftImg from "@/assets/player2-left.png";
import player3IdleImg from "@/assets/player3-idle.png";
import player3RightImg from "@/assets/player3-right.png";
import player3LeftImg from "@/assets/player3-left.png";
import player4IdleImg from "@/assets/player4-idle.png";
import player4RightImg from "@/assets/player4-right.png";
import player4LeftImg from "@/assets/player4-left.png";
import keyImg from "@/assets/key.png";
import doorImg from "@/assets/door.png";
import deathImg from "@/assets/death.png";
import dangerButtonImg from "@/assets/danger-button.png";
import boxImg from "@/assets/box.png";

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
  controls: { left: string; right: string; jump: string };
}

interface Platform {
  x: number;
  y: number;
  width: number;
  height: number;
  color?: string;
}

interface PushBox {
  id: number;
  x: number;
  y: number;
  vx: number;
  vy: number;
  width: number;
  height: number;
  onGround: boolean;
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

const GRAVITY = 0.5;
const JUMP_FORCE = -13;
const MOVE_SPEED = 4.5;
const PLAYER_WIDTH = 40;
const PLAYER_HEIGHT = 50;
const BOX_SIZE = 45;
const DEATH_FREEZE_TIME = 2000;
const PUSH_FORCE = 0.08; // БАГАСГАСАН: 0.15 -> 0.08
const BOX_PUSH_SPEED = 2;
const BOX_FRICTION = 0.85;
const PLAYER_SEPARATION = 0.3; // БАГАСГАСАН: 0.5 -> 0.3

const World3 = () => {
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
  
  // Player images refs
  const playerImages = useRef<{[key: string]: HTMLImageElement | null}>({});
  const keyImage = useRef<HTMLImageElement | null>(null);
  const doorImage = useRef<HTMLImageElement | null>(null);
  const deathImage = useRef<HTMLImageElement | null>(null);
  const dangerButtonImage = useRef<HTMLImageElement | null>(null);
  const boxImage = useRef<HTMLImageElement | null>(null);

  const groundY = canvasSize.height - 80;

  const createPlayer = (id: number, x: number, color: string, controls: { left: string; right: string; jump: string }): Player => ({
    id,
    x,
    y: 400,
    vx: 0,
    vy: 0,
    width: PLAYER_WIDTH,
    height: PLAYER_HEIGHT,
    onGround: false,
    animFrame: 0,
    facingRight: true,
    color,
    dead: false,
    standingOnPlayer: null,
    controls,
  });

  const createBox = (id: number, x: number, y: number): PushBox => ({
    id,
    x,
    y,
    vx: 0,
    vy: 0,
    width: BOX_SIZE,
    height: BOX_SIZE,
    onGround: false,
  });

  const playersRef = useRef<Player[]>([
    createPlayer(1, 50, "#4A90D9", { left: "a", right: "d", jump: "w" }),
    createPlayer(2, 100, "#D94A4A", { left: "arrowleft", right: "arrowright", jump: "arrowup" }),
    createPlayer(3, 150, "#4AD94A", { left: "j", right: "l", jump: "i" }),
    createPlayer(4, 200, "#D9D94A", { left: "4", right: "6", jump: "8" }),
  ]);

  // Pushable boxes - placed strategically to help reach platforms
  const boxesRef = useRef<PushBox[]>([
    createBox(1, 300, groundY - BOX_SIZE),
    createBox(2, 350, groundY - BOX_SIZE),
    createBox(3, 1200, groundY - BOX_SIZE),
    createBox(4, 1250, groundY - BOX_SIZE),
    createBox(5, 2180, groundY - BOX_SIZE),
    createBox(6, 2230, groundY - BOX_SIZE),
    createBox(7, 2280, groundY - BOX_SIZE),
    createBox(8, 4200, groundY - BOX_SIZE),
    createBox(9, 4250, groundY - BOX_SIZE),
    createBox(10, 4300, groundY - BOX_SIZE),
    createBox(11, 5250, groundY - BOX_SIZE),
  ]);

  const initialBoxPositions = useRef<{id: number, x: number, y: number}[]>([]);

  useEffect(() => {
    // Store initial box positions for reset
    initialBoxPositions.current = boxesRef.current.map(box => ({
      id: box.id,
      x: box.x,
      y: box.y,
    }));
  }, []);

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
    const totalImages = 17;

    const checkAllLoaded = () => {
      loadedCount++;
      if (loadedCount === totalImages) {
        setImagesLoaded(true);
      }
    };

    const loadImage = (key: string, src: string) => {
      const img = new Image();
      img.onload = checkAllLoaded;
      img.onerror = () => {
        console.error("Failed to load image:", src);
        checkAllLoaded();
      };
      img.src = src;
      playerImages.current[key] = img;
    };

    const loadSingleImage = (ref: React.MutableRefObject<HTMLImageElement | null>, src: string) => {
      ref.current = new Image();
      ref.current.onload = checkAllLoaded;
      ref.current.onerror = () => {
        console.error("Failed to load image:", src);
        checkAllLoaded();
      };
      ref.current.src = src;
    };

    loadImage("p1-idle", player1IdleImg);
    loadImage("p1-right", player1RightImg);
    loadImage("p1-left", player1LeftImg);
    loadImage("p2-idle", player2IdleImg);
    loadImage("p2-right", player2RightImg);
    loadImage("p2-left", player2LeftImg);
    loadImage("p3-idle", player3IdleImg);
    loadImage("p3-right", player3RightImg);
    loadImage("p3-left", player3LeftImg);
    loadImage("p4-idle", player4IdleImg);
    loadImage("p4-right", player4RightImg);
    loadImage("p4-left", player4LeftImg);
    loadSingleImage(keyImage, keyImg);
    loadSingleImage(doorImage, doorImg);
    loadSingleImage(deathImage, deathImg);
    loadSingleImage(dangerButtonImage, dangerButtonImg);
    loadSingleImage(boxImage, boxImg);
  }, []);

  const platformsRef = useRef<Platform[]>([
    { x: 0, y: groundY, width: 400, height: 20 },
    { x: 480, y: groundY, width: 100, height: 20 },
    { x: 650, y: groundY - 30, width: 100, height: 20 },
    { x: 820, y: groundY, width: 100, height: 20 },
    { x: 990, y: groundY - 50, width: 120, height: 20 },
    { x: 1180, y: groundY, width: 150, height: 20 },
    { x: 1400, y: groundY - 130, width: 120, height: 20 },
    { x: 1590, y: groundY - 80, width: 100, height: 20 },
    { x: 1760, y: groundY - 30, width: 100, height: 20 },
    { x: 1930, y: groundY, width: 150, height: 20 },
    { x: 2150, y: groundY, width: 200, height: 20 },
    { x: 2420, y: groundY - 200, width: 150, height: 20 },
    { x: 2640, y: groundY - 150, width: 100, height: 20 },
    { x: 2810, y: groundY - 80, width: 100, height: 20 },
    { x: 2980, y: groundY, width: 150, height: 20 },
    { x: 3200, y: groundY - 40, width: 80, height: 20 },
    { x: 3350, y: groundY, width: 80, height: 20 },
    { x: 3500, y: groundY - 40, width: 80, height: 20 },
    { x: 3650, y: groundY, width: 80, height: 20 },
    { x: 3800, y: groundY - 40, width: 80, height: 20 },
    { x: 3950, y: groundY, width: 150, height: 20 },
    { x: 4170, y: groundY, width: 250, height: 20 },
    { x: 4500, y: groundY - 280, width: 150, height: 20 },
    { x: 4720, y: groundY - 200, width: 100, height: 20 },
    { x: 4890, y: groundY - 130, width: 100, height: 20 },
    { x: 5060, y: groundY - 60, width: 100, height: 20 },
    { x: 5230, y: groundY, width: 150, height: 20 },
    { x: 5450, y: groundY - 30, width: 80, height: 20 },
    { x: 5600, y: groundY, width: 80, height: 20 },
    { x: 5750, y: groundY - 30, width: 80, height: 20 },
    { x: 5900, y: groundY, width: 80, height: 20 },
    { x: 6050, y: groundY, width: 300, height: 20 },
  ]);

  const dangerButtonsRef = useRef<DangerButton[]>([
    { x: 560, y: groundY - 35, width: 35, height: 35 },
    { x: 3290, y: groundY - 35, width: 35, height: 35 },
    { x: 3590, y: groundY - 35, width: 35, height: 35 },
    { x: 4350, y: groundY - 35, width: 35, height: 35 },
    { x: 5530, y: groundY - 35, width: 35, height: 35 },
    { x: 5830, y: groundY - 35, width: 35, height: 35 },
  ]);

  const cloudsRef = useRef<Cloud[]>([
    { x: 100, y: 50, width: 120, speed: 0.3 },
    { x: 600, y: 80, width: 90, speed: 0.2 },
    { x: 1100, y: 40, width: 150, speed: 0.4 },
    { x: 1600, y: 70, width: 100, speed: 0.25 },
    { x: 2100, y: 50, width: 130, speed: 0.35 },
    { x: 2600, y: 90, width: 110, speed: 0.2 },
    { x: 3100, y: 60, width: 140, speed: 0.3 },
    { x: 3600, y: 45, width: 100, speed: 0.25 },
    { x: 4100, y: 75, width: 120, speed: 0.35 },
    { x: 4600, y: 55, width: 110, speed: 0.28 },
    { x: 5100, y: 65, width: 130, speed: 0.32 },
    { x: 5600, y: 50, width: 100, speed: 0.22 },
    { x: 6100, y: 80, width: 120, speed: 0.3 },
  ]);

  const keyRef = useRef<Key>({
    x: 4540,
    y: groundY - 340,
    width: 40,
    height: 40,
    collected: false,
  });

  const doorRef = useRef<Door>({
    x: 6150,
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
      player.x + player.width > otherPlayer.x + 8 &&
      player.x < otherPlayer.x + otherPlayer.width - 8;
    
    return verticalCheck && horizontalOverlap;
  };

  const checkStandingOnBox = (entity: { x: number; y: number; width: number; height: number; vy: number }, box: PushBox): boolean => {
    const feetY = entity.y + entity.height;
    const boxTop = box.y;
    
    const verticalCheck = feetY >= boxTop - 5 && feetY <= boxTop + 10 && entity.vy >= 0;
    
    const horizontalOverlap = 
      entity.x + entity.width > box.x + 5 &&
      entity.x < box.x + box.width - 5;
    
    return verticalCheck && horizontalOverlap;
  };

  const resetGame = useCallback(() => {
    playersRef.current = [
      createPlayer(1, 50, "#4A90D9", { left: "a", right: "d", jump: "w" }),
      createPlayer(2, 100, "#D94A4A", { left: "arrowleft", right: "arrowright", jump: "arrowup" }),
      createPlayer(3, 150, "#4AD94A", { left: "j", right: "l", jump: "i" }),
      createPlayer(4, 200, "#D9D94A", { left: "4", right: "6", jump: "8" }),
    ];
    playersRef.current.forEach(p => {
      p.y = groundY - 100;
    });
    
    // Reset boxes to initial positions
    boxesRef.current.forEach(box => {
      const initial = initialBoxPositions.current.find(pos => pos.id === box.id);
      if (initial) {
        box.x = initial.x;
        box.y = initial.y;
        box.vx = 0;
        box.vy = 0;
        box.onGround = false;
      }
    });
    
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
    const boxes = boxesRef.current;
    const dangerButtons = dangerButtonsRef.current;
    const clouds = cloudsRef.current;
    const key = keyRef.current;
    const door = doorRef.current;

    animTimer.current++;

    if (gameState === "playing") {
      clouds.forEach((cloud) => {
        cloud.x += cloud.speed;
        if (cloud.x > 7000) {
          cloud.x = -cloud.width;
        }
      });

      // Update boxes physics
      boxes.forEach((box) => {
        box.vy += GRAVITY;
        box.vx *= BOX_FRICTION;
        if (Math.abs(box.vx) < 0.1) box.vx = 0;
        
        box.x += box.vx;
        box.y += box.vy;
        
        box.onGround = false;
        
        // Box vs platform collision
        platforms.forEach((platform) => {
          if (checkCollision(box, platform)) {
            const overlapLeft = box.x + box.width - platform.x;
            const overlapRight = platform.x + platform.width - box.x;
            const overlapTop = box.y + box.height - platform.y;
            const overlapBottom = platform.y + platform.height - box.y;

            const minOverlapX = Math.min(overlapLeft, overlapRight);
            const minOverlapY = Math.min(overlapTop, overlapBottom);

            if (minOverlapY < minOverlapX) {
              if (overlapTop < overlapBottom && box.vy > 0) {
                box.y = platform.y - box.height;
                box.vy = 0;
                box.onGround = true;
              } else if (overlapBottom < overlapTop && box.vy < 0) {
                box.y = platform.y + platform.height;
                box.vy = 0;
              }
            } else {
              if (overlapLeft < overlapRight) {
                box.x = platform.x - box.width;
              } else {
                box.x = platform.x + platform.width;
              }
              box.vx = 0;
            }
          }
        });
        
        // Box vs other boxes collision
        boxes.forEach((otherBox) => {
          if (box.id === otherBox.id) return;
          
          if (checkStandingOnBox(box, otherBox)) {
            box.y = otherBox.y - box.height;
            box.vy = 0;
            box.onGround = true;
            return;
          }
          
          if (checkCollision(box, otherBox)) {
            const overlapLeft = box.x + box.width - otherBox.x;
            const overlapRight = otherBox.x + otherBox.width - box.x;
            const overlapTop = box.y + box.height - otherBox.y;
            const overlapBottom = otherBox.y + otherBox.height - box.y;

            const minOverlapX = Math.min(overlapLeft, overlapRight);
            const minOverlapY = Math.min(overlapTop, overlapBottom);

            if (minOverlapX < minOverlapY) {
              const separation = minOverlapX / 2 + 0.5;
              if (overlapLeft < overlapRight) {
                box.x -= separation;
                otherBox.x += separation;
              } else {
                box.x += separation;
                otherBox.x -= separation;
              }
              const avgVx = (box.vx + otherBox.vx) / 2;
              box.vx = avgVx;
              otherBox.vx = avgVx;
            }
          }
        });
        
        // ЗАСАГДСАН: Box respawn зөвхөн хэт доош унавал
        if (box.y > canvasSize.height + 200) { // +100 -> +200 болгосон
          const initial = initialBoxPositions.current.find(pos => pos.id === box.id);
          if (initial) {
            box.x = initial.x;
            box.y = initial.y;
            box.vx = 0;
            box.vy = 0;
          }
        }
        
        // Keep box in bounds
        if (box.x < 0) box.x = 0;
      });

      players.forEach((player, playerIndex) => {
        if (player.dead) return;

        const { left, right, jump } = player.controls;
        
        if (keysPressed.current.has(left)) {
          player.vx = -MOVE_SPEED;
          player.facingRight = false;
        } else if (keysPressed.current.has(right)) {
          player.vx = MOVE_SPEED;
          player.facingRight = true;
        } else {
          player.vx = 0;
        }

        if (keysPressed.current.has(jump) && player.onGround) {
          player.vy = JUMP_FORCE;
          player.onGround = false;
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

        // Check standing on boxes
        boxes.forEach((box) => {
          if (checkStandingOnBox(player, box)) {
            player.y = box.y - player.height;
            player.vy = 0;
            player.onGround = true;
            
            if (box.vx !== 0) {
              player.x += box.vx;
            }
          }
        });

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

        // Player pushing boxes
        boxes.forEach((box) => {
          if (checkCollision(player, box)) {
            const overlapLeft = player.x + player.width - box.x;
            const overlapRight = box.x + box.width - player.x;
            const overlapTop = player.y + player.height - box.y;
            const overlapBottom = box.y + box.height - player.y;

            const minOverlapX = Math.min(overlapLeft, overlapRight);
            const minOverlapY = Math.min(overlapTop, overlapBottom);

            if (minOverlapX < minOverlapY) {
              if (overlapLeft < overlapRight) {
                player.x = box.x - player.width;
                if (player.vx > 0) {
                  box.vx = BOX_PUSH_SPEED;
                }
              } else {
                player.x = box.x + box.width;
                if (player.vx < 0) {
                  box.vx = -BOX_PUSH_SPEED;
                }
              }
            } else {
              if (overlapTop < overlapBottom && player.vy > 0) {
                player.y = box.y - player.height;
                player.vy = 0;
                player.onGround = true;
              } else if (overlapBottom < overlapTop && player.vy < 0) {
                player.y = box.y + box.height;
                player.vy = 0;
              }
            }
          }
        });

        // ЗАСАГДСАН: Тоглогчид бие биенээ зөөлөн түлхэх
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
              // БАГАСГАСАН түлхэх хүч
              const separation = minOverlapX / 2 * PLAYER_SEPARATION; // 0.5 -> PLAYER_SEPARATION
              if (overlapLeft < overlapRight) {
                player.x -= separation;
                otherPlayer.x += separation;
                
                // Зөвхөн идэвхтэй хөдөлж байх тоглогч л бусдыг түлхинэ
                if (player.vx > 0 && keysPressed.current.has(player.controls.right)) {
                  otherPlayer.vx = PUSH_FORCE; // багасгасан
                }
              } else {
                player.x += separation;
                otherPlayer.x -= separation;
                
                if (player.vx < 0 && keysPressed.current.has(player.controls.left)) {
                  otherPlayer.vx = -PUSH_FORCE; // багасгасан
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

        // Danger button collision
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
        } else {
          setPlayersAtDoor(prev => {
            const newSet = new Set(prev);
            newSet.delete(player.id);
            return newSet;
          });
        }

        // Fall death
        if (player.y > canvasSize.height + 100) {
          handleDeath();
        }

        if (player.x < 0) {
          player.x = 0;
        }
      });

      if (playersAtDoor.size === 4) {
        setGameState("won");
      }

      // Camera follow
      const livingPlayers = players.filter(p => !p.dead);
      if (livingPlayers.length > 0) {
        const avgX = livingPlayers.reduce((sum, p) => sum + p.x, 0) / livingPlayers.length;
        const targetCameraX = avgX - canvasSize.width / 2 + PLAYER_WIDTH / 2;
        cameraRef.current.x += (targetCameraX - cameraRef.current.x) * 0.08;
        if (cameraRef.current.x < 0) cameraRef.current.x = 0;
      }
    }

    // Draw background
    const gradient = ctx.createLinearGradient(0, 0, 0, canvasSize.height);
    gradient.addColorStop(0, "#1a1a2e");
    gradient.addColorStop(0.3, "#16213e");
    gradient.addColorStop(0.6, "#1f4068");
    gradient.addColorStop(1, "#162447");
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, canvasSize.width, canvasSize.height);

    // Draw stars
    ctx.save();
    ctx.fillStyle = "#ffffff";
    const starPositions = [
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
    ];
    
    starPositions.forEach((star, index) => {
      const twinkle = Math.sin(animTimer.current * 0.05 + index) * 0.5 + 0.5;
      ctx.globalAlpha = twinkle * 0.8 + 0.2;
      ctx.beginPath();
      ctx.arc(star.x, star.y, star.size, 0, Math.PI * 2);
      ctx.fill();
    });
    ctx.restore();

    // Draw moon
    ctx.save();
    const moonX = canvasSize.width - 120;
    const moonY = 70;
    const moonRadius = 35;
    
    const moonGlow = ctx.createRadialGradient(moonX, moonY, moonRadius * 0.5, moonX, moonY, moonRadius * 2);
    moonGlow.addColorStop(0, "rgba(255, 255, 220, 0.3)");
    moonGlow.addColorStop(1, "rgba(255, 255, 220, 0)");
    ctx.fillStyle = moonGlow;
    ctx.beginPath();
    ctx.arc(moonX, moonY, moonRadius * 2, 0, Math.PI * 2);
    ctx.fill();
    
    ctx.fillStyle = "#f5f5dc";
    ctx.beginPath();
    ctx.arc(moonX, moonY, moonRadius, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();

    // Clouds
    ctx.save();
    ctx.translate(-cameraRef.current.x * 0.3, 0);
    clouds.forEach((cloud) => {
      ctx.fillStyle = "rgba(40, 50, 80, 0.4)";
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

    // Ground
    ctx.fillStyle = "#1a1a2e";
    ctx.fillRect(-100, canvasSize.height - 60, 7000, 100);

    // Draw platforms
    platforms.forEach((platform) => {
      const grad = ctx.createLinearGradient(platform.x, platform.y, platform.x, platform.y + platform.height);
      grad.addColorStop(0, "#6B7280");
      grad.addColorStop(1, "#4B5563");
      ctx.fillStyle = grad;
      ctx.fillRect(platform.x, platform.y, platform.width, platform.height);
      
      ctx.fillStyle = "#9CA3AF";
      ctx.fillRect(platform.x, platform.y, platform.width, 3);
      
      ctx.fillStyle = "#374151";
      for (let i = platform.x + 8; i < platform.x + platform.width - 8; i += 18) {
        ctx.beginPath();
        ctx.arc(i, platform.y + 10, 2.5, 0, Math.PI * 2);
        ctx.fill();
      }
    });

    // Draw boxes
    boxes.forEach((box) => {
      if (boxImage.current && boxImage.current.complete) {
        ctx.drawImage(boxImage.current, box.x, box.y, box.width, box.height);
      } else {
        const boxGrad = ctx.createLinearGradient(box.x, box.y, box.x, box.y + box.height);
        boxGrad.addColorStop(0, "#A0826D");
        boxGrad.addColorStop(1, "#7A5C45");
        ctx.fillStyle = boxGrad;
        ctx.fillRect(box.x, box.y, box.width, box.height);
        
        ctx.strokeStyle = "#5D4037";
        ctx.lineWidth = 2;
        ctx.strokeRect(box.x, box.y, box.width, box.height);
        
        ctx.strokeStyle = "#6D4C41";
        ctx.beginPath();
        ctx.moveTo(box.x, box.y);
        ctx.lineTo(box.x + box.width, box.y + box.height);
        ctx.moveTo(box.x + box.width, box.y);
        ctx.lineTo(box.x, box.y + box.height);
        ctx.stroke();
      }
    });

    // Draw danger buttons
    dangerButtons.forEach((button) => {
      if (dangerButtonImage.current && dangerButtonImage.current.complete) {
        ctx.drawImage(dangerButtonImage.current, button.x, button.y, button.width, button.height);
      } else {
        ctx.fillStyle = "#DC2626";
        ctx.beginPath();
        ctx.arc(button.x + button.width / 2, button.y + button.height / 2, button.width / 2, 0, Math.PI * 2);
        ctx.fill();
      }
      
      const pulse = Math.sin(animTimer.current * 0.1) * 0.3 + 0.7;
      ctx.save();
      ctx.globalAlpha = pulse * 0.25;
      ctx.fillStyle = "#DC2626";
      ctx.beginPath();
      ctx.arc(button.x + button.width / 2, button.y + button.height / 2, button.width / 2 + 8, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    });

    // Draw door
    if (doorImage.current && doorImage.current.complete) {
      ctx.drawImage(doorImage.current, door.x, door.y, door.width, door.height);
      if (!key.collected) {
        ctx.fillStyle = "rgba(80, 80, 80, 0.6)";
        ctx.fillRect(door.x, door.y, door.width, door.height);
      }
    }

    // Draw key
    if (!key.collected && keyImage.current && keyImage.current.complete) {
      const bobOffset = Math.sin(animTimer.current * 0.1) * 5;
      ctx.drawImage(keyImage.current, key.x, key.y + bobOffset, key.width, key.height);
      
      ctx.save();
      ctx.globalAlpha = 0.4;
      ctx.fillStyle = "#FCD34D";
      ctx.beginPath();
      ctx.arc(key.x + key.width / 2, key.y + key.height / 2 + bobOffset, 25, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }

    // Draw players
    players.forEach((player) => {
      if (player.dead) return;

      const prefix = `p${player.id}`;
      let imageKey = `${prefix}-idle`;
      
      if (player.animFrame !== 0) {
        imageKey = player.facingRight ? `${prefix}-right` : `${prefix}-left`;
      }

      const playerImage = playerImages.current[imageKey];

      if (playerImage && playerImage.complete) {
        ctx.save();
        ctx.shadowColor = player.color;
        ctx.shadowBlur = 10;
        ctx.drawImage(playerImage, player.x, player.y, player.width, player.height);
        ctx.restore();

        ctx.fillStyle = player.color;
        ctx.font = "bold 12px Arial";
        ctx.textAlign = "center";
        ctx.fillText(`P${player.id}`, player.x + player.width / 2, player.y - 8);
      } else {
        ctx.fillStyle = player.color;
        ctx.fillRect(player.x, player.y, player.width, player.height);
        ctx.fillStyle = "#fff";
        ctx.font = "bold 12px Arial";
        ctx.textAlign = "center";
        ctx.fillText(`P${player.id}`, player.x + player.width / 2, player.y - 8);
      }
    });

    ctx.restore();

    // UI Panel
    ctx.fillStyle = "rgba(0, 0, 0, 0.75)";
    ctx.fillRect(12, 12, 300, 95);
    ctx.strokeStyle = "rgba(255,255,255,0.2)";
    ctx.strokeRect(12, 12, 300, 95);
    
    ctx.fillStyle = "#fff";
    ctx.font = "bold 18px Arial";
    ctx.textAlign = "left";
    ctx.fillText("WORLD 3: TEAMWORK", 22, 35);
    
    ctx.font = "16px Arial";
    ctx.fillText(`🔑 Key: ${hasKey ? "✅" : "🔒"}`, 22, 58);
    ctx.fillText(`🚪 At Door: ${playersAtDoor.size}/4`, 140, 58);
    ctx.fillText(`📦 Boxes: ${boxes.length}`, 240, 58);
    
    ctx.fillStyle = "#FCD34D";
    ctx.font = "12px Arial";
    ctx.fillText("Push boxes & stack players to reach the key!", 22, 80);
    ctx.fillStyle = "#DC2626";
    ctx.fillText("⚠️ Avoid red buttons!", 22, 96);

    // Controls panel
    ctx.fillStyle = "rgba(0,0,0,0.75)";
    ctx.fillRect(12, canvasSize.height - 70, 520, 58);
    ctx.strokeStyle = "rgba(255,255,255,0.2)";
    ctx.strokeRect(12, canvasSize.height - 70, 520, 58);
    
    ctx.font = "bold 11px Arial";
    const controls = [
      { label: "P1", keys: "WASD", color: "#4A90D9" },
      { label: "P2", keys: "Arrows", color: "#D94A4A" },
      { label: "P3", keys: "I J K L", color: "#4AD94A" },
      { label: "P4", keys: "8 4 5 6", color: "#D9D94A" },
    ];
    
    controls.forEach((ctrl, i) => {
      const x = 22 + i * 125;
      ctx.fillStyle = ctrl.color;
      ctx.fillText(ctrl.label, x, canvasSize.height - 50);
      ctx.fillStyle = "#fff";
      ctx.font = "10px Arial";
      ctx.fillText(ctrl.keys, x + 25, canvasSize.height - 50);
      ctx.font = "bold 11px Arial";
    });
    
    ctx.fillStyle = "#9CA3AF";
    ctx.font = "10px Arial";
    ctx.fillText("Tip: Push boxes to create stairs! Stand on boxes & teammates!", 22, canvasSize.height - 25);

    // Death screen
    if (gameState === "dead") {
      ctx.fillStyle = "rgba(0, 0, 0, 0.85)";
      ctx.fillRect(0, 0, canvasSize.width, canvasSize.height);
      
      if (deathImage.current && deathImage.current.complete) {
        const imgSize = 140;
        ctx.drawImage(
          deathImage.current,
          canvasSize.width / 2 - imgSize / 2,
          canvasSize.height / 2 - imgSize / 2 - 40,
          imgSize,
          imgSize
        );
      }
      
      ctx.fillStyle = "#DC2626";
      ctx.font = "bold 52px Arial";
      ctx.textAlign = "center";
      ctx.fillText("💀 TEAM DOWN! 💀", canvasSize.width / 2, canvasSize.height / 2 + 90);
      
      ctx.font = "22px Arial";
      ctx.fillStyle = "#ffffff";
      ctx.fillText("Someone touched the danger button...", canvasSize.width / 2, canvasSize.height / 2 + 125);
      
      ctx.font = "16px Arial";
      ctx.fillStyle = "#9CA3AF";
      ctx.fillText("Respawning...", canvasSize.width / 2, canvasSize.height / 2 + 155);
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
      <div className="w-screen h-screen flex items-center justify-center bg-gradient-to-b from-slate-900 to-slate-800">
        <div className="text-center">
          <div className="text-4xl font-bold text-white mb-4">Loading World 3...</div>
          <div className="text-lg text-gray-400 mb-6">4-Player Cooperative Adventure</div>
          <div className="w-64 h-3 bg-white/20 rounded-full overflow-hidden mx-auto">
            <div className="h-full bg-gradient-to-r from-blue-500 via-green-500 to-yellow-500 animate-pulse rounded-full"></div>
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
        <div className="fixed inset-0 flex flex-col items-center justify-center bg-black/85">
          <div className="text-center">
            <h2 className="text-6xl font-bold text-yellow-400 mb-4">🎉 TEAMWORK! 🎉</h2>
            <p className="text-white text-2xl mb-2">All 4 players made it to the door!</p>
            <p className="text-gray-400 text-lg mb-8">True cooperation wins the day.</p>
            <div className="flex gap-4 justify-center">
              <button
                onClick={resetGame}
                className="px-10 py-4 bg-green-600 hover:bg-green-500 text-white font-bold text-xl rounded-xl transition-all hover:scale-105 shadow-lg"
              >
                🔄 Play Again
              </button>
              <button
                onClick={() => navigate("/")}
                className="px-10 py-4 bg-blue-600 hover:bg-blue-500 text-white font-bold text-xl rounded-xl transition-all hover:scale-105 shadow-lg"
              >
                🏠 Level Select
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default World3;
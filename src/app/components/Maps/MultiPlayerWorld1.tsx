import { useEffect, useRef, useState, useCallback } from "react";
import { io, Socket } from "socket.io-client";

// Import images
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

// Import utilities
import {
  PHYSICS,
  PLAYER_DIMENSIONS,
  TIMING,
  PLAYER_COLORS,
  GAME_OBJECTS_WORLD1,
  MAX_PLAYERS,
  checkCollision,
  getSpawnPosition,
} from "@/app/utils/physics";
import { updateCameraMultiplayer, Camera } from "@/app/utils/camera";
import {
  createKeyboardHandlers,
  isLeftPressed,
  isRightPressed,
  isJumpPressed,
} from "@/app/utils/inputHandler";
import { loadAllImagesWorld1 as loadAllImages, getPlayerSprite, GameImages } from "@/app/utils/imageLoader";
import {
  drawBackgroundWorld1 as drawBackground,
  drawGroundWorld1 as drawGround,
  drawDoor,
  drawKey,
  drawPlayer,
  drawUIWorld1 as drawUI,
} from "@/app/utils/rendering";
const SERVER_URL = process.env.REACT_APP_SERVER_URL || "http://localhost:3001";

interface Player {
  id: number;
  name: string;
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

interface KeyItem {
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

const MultiplayerWorld1 = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const socketRef = useRef<Socket | null>(null);
  const [gameState, setGameState] = useState<"lobby" | "playing" | "won" | "dead">("lobby");
  const [roomId, setRoomId] = useState("");
  const [playerName, setPlayerName] = useState("");
  const [myPlayerId, setMyPlayerId] = useState<number | null>(null);
  const [hasKey, setHasKey] = useState(false);
  const [playersAtDoor, setPlayersAtDoor] = useState<number[]>([]);
  const [connectedPlayers, setConnectedPlayers] = useState(0);
  const [canvasSize] = useState({ width: 1200, height: 700 });
  const [imagesLoaded, setImagesLoaded] = useState(false);
  const [gameImages, setGameImages] = useState<GameImages | null>(null);

  const playersRef = useRef<Map<number, Player>>(new Map());
  const keysPressed = useRef<Set<string>>(new Set());
  const animTimer = useRef(0);
  const groundY = canvasSize.height - GAME_OBJECTS_WORLD1.GROUND_OFFSET;

  const keyRef = useRef<KeyItem>({
    x: GAME_OBJECTS_WORLD1.KEY.x,
    y: groundY + GAME_OBJECTS_WORLD1.KEY.yOffset,
    width: GAME_OBJECTS_WORLD1.KEY.width,
    height: GAME_OBJECTS_WORLD1.KEY.height,
    collected: false,
  });

  const doorRef = useRef<Door>({
    x: GAME_OBJECTS_WORLD1.DOOR.x,
    y: groundY + GAME_OBJECTS_WORLD1.DOOR.yOffset,
    width: GAME_OBJECTS_WORLD1.DOOR.width,
    height: GAME_OBJECTS_WORLD1.DOOR.height,
  });

  const cameraRef = useRef<Camera>({ x: 0, y: 0 });

  // Load images
  useEffect(() => {
    loadAllImages(
      player1IdleImg,
      player1RightImg,
      player1LeftImg,
      player2IdleImg,
      player2RightImg,
      player2LeftImg,
      player3IdleImg,
      player3RightImg,
      player3LeftImg,
      player4IdleImg,
      player4RightImg,
      player4LeftImg,
      keyImg,
      doorImg,
      deathImg
    )
      .then((images: GameImages) => {
        setGameImages(images);
        setImagesLoaded(true);
      })
      .catch((error: Error) => {
        console.error("Failed to load images:", error);
      });
  }, []);

  // Socket.io connection
  const connectToServer = useCallback(() => {
    if (!roomId || !playerName) {
      alert("Өрөөний ID болон нэр оруулна уу!");
      return;
    }

    socketRef.current = io(SERVER_URL);

    socketRef.current.on("connect", () => {
      console.log("Connected to server");
      socketRef.current?.emit("join-room", roomId, playerName);
    });

    socketRef.current.on(
      "room-state",
      (data: { playerId: number; players: Player[]; gameState: { hasKey: boolean } }) => {
        setMyPlayerId(data.playerId);
        setGameState("playing");

        playersRef.current.clear();
        data.players.forEach((p: Player) => {
          playersRef.current.set(p.id, {
            ...p,
            width: PLAYER_DIMENSIONS.WIDTH,
            height: PLAYER_DIMENSIONS.HEIGHT,
            color: PLAYER_COLORS[p.id - 1] || "#999",
            standingOnPlayer: null,
          });
        });

        setConnectedPlayers(data.players.length);
      }
    );

    socketRef.current.on(
      "player-joined",
      (data: { playerId: number; playerName: string; totalPlayers: number }) => {
        console.log(`Player ${data.playerId} joined`);
        setConnectedPlayers(data.totalPlayers);
      }
    );

    socketRef.current.on("player-moved", (data: Partial<Player> & { playerId: number }) => {
      const player = playersRef.current.get(data.playerId);
      if (player) {
        Object.assign(player, data);
      }
    });

    socketRef.current.on("key-collected", () => {
      keyRef.current.collected = true;
      setHasKey(true);
    });

    socketRef.current.on(
      "player-at-door-update",
      (data: { playerId: number; playersAtDoor: number[] }) => {
        setPlayersAtDoor(data.playersAtDoor);
      }
    );

    socketRef.current.on("game-won", () => {
      setGameState("won");
    });

    socketRef.current.on("game-reset", () => {
      keyRef.current.collected = false;
      setHasKey(false);
      setPlayersAtDoor([]);
      setGameState("playing");
    });

    socketRef.current.on("player-left", (data: { playerId: number; totalPlayers: number }) => {
      playersRef.current.delete(data.playerId);
      setConnectedPlayers(data.totalPlayers);
    });

    socketRef.current.on("room-full", () => {
      alert(`Өрөө дүүрсэн байна! (Max ${MAX_PLAYERS} players)`);
      socketRef.current?.disconnect();
    });
  }, [roomId, playerName]);

  // Send player update to server
  const sendPlayerUpdate = useCallback(() => {
    if (!socketRef.current || !myPlayerId) return;

    const myPlayer = playersRef.current.get(myPlayerId);
    if (!myPlayer) return;

    socketRef.current.emit("player-move", {
      x: myPlayer.x,
      y: myPlayer.y,
      vx: myPlayer.vx,
      vy: myPlayer.vy,
      onGround: myPlayer.onGround,
      facingRight: myPlayer.facingRight,
      animFrame: myPlayer.animFrame,
      dead: myPlayer.dead,
    });
  }, [myPlayerId]);

  // Game loop
  const gameLoop = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas || gameState !== "playing" || !myPlayerId || !gameImages) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    animTimer.current++;

    const myPlayer = playersRef.current.get(myPlayerId);
    if (!myPlayer || myPlayer.dead) return;

    // Handle player input
    if (isLeftPressed(keysPressed.current)) {
      myPlayer.vx = -PHYSICS.MOVE_SPEED;
      myPlayer.facingRight = false;
    } else if (isRightPressed(keysPressed.current)) {
      myPlayer.vx = PHYSICS.MOVE_SPEED;
      myPlayer.facingRight = true;
    } else {
      myPlayer.vx = 0;
    }

    if (isJumpPressed(keysPressed.current) && myPlayer.onGround) {
      myPlayer.vy = PHYSICS.JUMP_FORCE;
      myPlayer.onGround = false;
    }

    // Physics
    myPlayer.vy += PHYSICS.GRAVITY;
    myPlayer.x += myPlayer.vx;
    myPlayer.y += myPlayer.vy;

    // Animation
    if (myPlayer.vx !== 0) {
      if (animTimer.current % 8 === 0) {
        myPlayer.animFrame = myPlayer.animFrame === 1 ? 2 : 1;
      }
    } else {
      myPlayer.animFrame = 0;
    }

    // Ground collision
    if (myPlayer.y + myPlayer.height >= groundY) {
      myPlayer.y = groundY - myPlayer.height;
      myPlayer.vy = 0;
      myPlayer.onGround = true;
    }

    // Key collection
    if (!keyRef.current.collected && checkCollision(myPlayer, keyRef.current)) {
      socketRef.current?.emit("key-collected");
      keyRef.current.collected = true;
      setHasKey(true);
    }

    // Door
    if (keyRef.current.collected && checkCollision(myPlayer, doorRef.current)) {
      socketRef.current?.emit("player-at-door");
    }

    // Death (fell off map)
    if (myPlayer.y > canvasSize.height + 50) {
      myPlayer.dead = true;
      socketRef.current?.emit("player-died");
      setGameState("dead");
      setTimeout(() => {
        myPlayer.dead = false;
        const spawn = getSpawnPosition(myPlayer.id, groundY);
        myPlayer.x = spawn.x;
        myPlayer.y = spawn.y;
      }, TIMING.DEATH_FREEZE_TIME);
    }

    // Send update to server (reduced rate)
    if (animTimer.current % TIMING.SERVER_UPDATE_RATE === 0) {
      sendPlayerUpdate();
    }

    // Update camera
    cameraRef.current = updateCameraMultiplayer(
      cameraRef.current,
      playersRef.current,
      canvasSize.width,
      PLAYER_DIMENSIONS.WIDTH
    );

    // Render everything
    drawBackground(ctx, canvasSize.width, canvasSize.height);

    ctx.save();
    ctx.translate(-cameraRef.current.x, 0);

    drawGround(ctx, groundY);
    drawDoor(ctx, doorRef.current, gameImages.door, keyRef.current.collected);
    drawKey(ctx, keyRef.current, gameImages.key, animTimer.current);

    // Draw all players
    playersRef.current.forEach((player) => {
      const playerImage = getPlayerSprite(
        gameImages,
        player.id,
        player.animFrame,
        player.facingRight
      );
      drawPlayer(ctx, player, playerImage);
    });

    ctx.restore();

    // Draw UI
    drawUI(ctx, hasKey, playersAtDoor.length, connectedPlayers);
  }, [gameState, myPlayerId, canvasSize, sendPlayerUpdate, groundY, gameImages, hasKey, playersAtDoor, connectedPlayers]);

  // Game loop effect
  useEffect(() => {
    if (gameState !== "playing" || !imagesLoaded) return;
    const interval = setInterval(gameLoop, 1000 / TIMING.FPS);
    return () => clearInterval(interval);
  }, [gameLoop, gameState, imagesLoaded]);

  // Keyboard controls
  useEffect(() => {
    const { handleKeyDown, handleKeyUp } = createKeyboardHandlers(keysPressed.current);

    window.addEventListener("keydown", handleKeyDown);
    window.addEventListener("keyup", handleKeyUp);

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("keyup", handleKeyUp);
    };
  }, []);

  // Cleanup
  useEffect(() => {
    return () => {
      socketRef.current?.disconnect();
    };
  }, []);

  // Loading screen
  if (!imagesLoaded) {
    return (
      <div className="w-screen h-screen flex items-center justify-center bg-gradient-to-b from-blue-400 to-blue-200">
        <div className="text-center">
          <div className="text-4xl font-bold text-white mb-4">Loading...</div>
          <div className="w-48 h-2 bg-white/30 rounded-full overflow-hidden">
            <div className="h-full bg-blue-500 animate-pulse"></div>
          </div>
        </div>
      </div>
    );
  }

  // Lobby screen
  if (gameState === "lobby") {
    return (
      <div className="w-screen h-screen flex items-center justify-center bg-gradient-to-b from-blue-400 to-blue-200">
        <div className="bg-white p-8 rounded-xl shadow-2xl w-96">
          <h1 className="text-3xl font-bold mb-6 text-center">🎮 Multiplayer Game</h1>
          <input
            type="text"
            placeholder="Өрөөний ID (e.g. room123)"
            value={roomId}
            onChange={(e) => setRoomId(e.target.value)}
            className="w-full p-3 border-2 rounded-lg mb-4"
          />
          <input
            type="text"
            placeholder="Таны нэр"
            value={playerName}
            onChange={(e) => setPlayerName(e.target.value)}
            className="w-full p-3 border-2 rounded-lg mb-6"
          />
          <button
            onClick={connectToServer}
            className="w-full bg-blue-600 text-white py-3 rounded-lg font-bold hover:bg-blue-700 transition"
          >
            Тоглоонд нэгдэх
          </button>
          <p className="text-sm text-gray-600 mt-4 text-center">
            Max {MAX_PLAYERS} тоглогч. Ижил өрөөний ID ашиглана уу!
          </p>
        </div>
      </div>
    );
  }

  // Game screen
  return (
    <div className="w-screen h-screen overflow-hidden">
      <canvas
        ref={canvasRef}
        width={canvasSize.width}
        height={canvasSize.height}
        className="block"
      />

      {gameState === "won" && (
        <div className="fixed inset-0 flex flex-col items-center justify-center bg-black/70">
          <h2 className="text-6xl font-bold text-yellow-400 mb-6">🎉 Та бүгд ялалаа!</h2>
          <button
            onClick={() => socketRef.current?.emit("restart-game")}
            className="px-10 py-5 bg-green-600 hover:bg-green-700 text-white font-bold text-2xl rounded-xl"
          >
            🔄 Дахин тоглох
          </button>
        </div>
      )}
    </div>
  );
};

export default MultiplayerWorld1;
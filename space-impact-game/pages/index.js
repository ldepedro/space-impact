import { Box, VStack, Text, Button } from "@chakra-ui/react";
import { useEffect, useRef, useState } from "react";

export default function Home() {
  const canvasRef = useRef(null);

  const [score, setScore] = useState(0);
  const [lives, setLives] = useState(3);
  const [gameOver, setGameOver] = useState(false);
  const [player, setPlayer] = useState({ x: 50, y: 180 });
  const [bullets, setBullets] = useState([]);
  const [enemies, setEnemies] = useState([]);
  const [stars, setStars] = useState(
    Array.from({ length: 50 }, () => ({ x: Math.random() * 600, y: Math.random() * 400, size: Math.random() * 2 + 1 }))
  );

  const playerImg = useRef(null);
  const enemyImg = useRef(null);
  const bgImg = useRef(null);

  // Load images once
  useEffect(() => {
    const p = new Image();
    p.src = "/player.png";
    p.onload = () => (playerImg.current = p);

    const e = new Image();
    e.src = "/enemy.png";
    e.onload = () => (enemyImg.current = e);

    const bg = new Image();
    bg.src = "/galaxy.jpg";
    bg.onload = () => (bgImg.current = bg);
  }, []);

  // Handle key presses
  useEffect(() => {
    const handleKey = (e) => {
      if (gameOver) return;

      setPlayer((prev) => {
        if (e.key === "ArrowUp") return { ...prev, y: Math.max(prev.y - 10, 0) };
        if (e.key === "ArrowDown") return { ...prev, y: Math.min(prev.y + 10, 380) };
        return prev;
      });

      if (e.key === " " && !gameOver) {
        setBullets((prev) => [...prev, { x: player.x + 20, y: player.y + 15 }]);
      }
    };

    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [player, gameOver]);

  // Game loop
  useEffect(() => {
    const interval = setInterval(() => {
      if (gameOver) return;

      // Move bullets
      setBullets((prev) =>
        prev.map((b) => ({ ...b, x: b.x + 10 })).filter((b) => b.x < 600)
      );

      // Move enemies
      setEnemies((prev) =>
        prev
          .map((e) => ({ ...e, x: e.x - 5 }))
          .filter((e) => e.x > 0)
      );

      // Spawn new enemy randomly
      if (Math.random() < 0.02) {
        setEnemies((prev) => [...prev, { x: 600, y: Math.random() * 380 }]);
      }

      // Collision detection: bullets vs enemies
      bullets.forEach((b) => {
        enemies.forEach((e, idx) => {
          if (Math.abs(b.x - e.x) < 20 && Math.abs(b.y - e.y) < 20) {
            setEnemies((prev) => prev.filter((_, i) => i !== idx));
            setScore((s) => s + 1);
          }
        });
      });

      // Collision detection: player vs enemies
      enemies.forEach((e, idx) => {
        if (Math.abs(player.x - e.x) < 20 && Math.abs(player.y - e.y) < 20) {
          setEnemies((prev) => prev.filter((_, i) => i !== idx));
          setLives((l) => l - 1);
        }
      });

      // Check game over
      if (lives <= 0) setGameOver(true);

      // Draw canvas
      const canvas = canvasRef.current;
      const ctx = canvas.getContext("2d");

      // Draw galaxy background
      if (bgImg.current) {
        ctx.drawImage(bgImg.current, 0, 0, canvas.width, canvas.height);
      } else {
        ctx.fillStyle = "#000";
        ctx.fillRect(0, 0, canvas.width, canvas.height);
      }

      // Draw moving stars on top
      ctx.fillStyle = "white";
      stars.forEach((s) => {
        ctx.fillRect(s.x, s.y, s.size, s.size);
        s.x -= 1;
        if (s.x < 0) s.x = 600;
      });

      if (!gameOver) {
        // Draw player if loaded
        if (playerImg.current) ctx.drawImage(playerImg.current, player.x, player.y, 30, 30);

        // Draw enemies if loaded
        if (enemyImg.current) enemies.forEach((e) => ctx.drawImage(enemyImg.current, e.x, e.y, 30, 30));

        // Draw bullets
        ctx.fillStyle = "yellow";
        bullets.forEach((b) => ctx.fillRect(b.x, b.y, 5, 5));
      } else {
        ctx.fillStyle = "red";
        ctx.font = "40px Arial";
        ctx.fillText("GAME OVER", 180, 200);
        ctx.font = "20px Arial";
        ctx.fillText(`Final Score: ${score}`, 230, 240);
      }
    }, 50);

    return () => clearInterval(interval);
  }, [player, bullets, enemies, lives, gameOver, stars, score]);

  const handleRestart = () => {
    setScore(0);
    setLives(3);
    setGameOver(false);
    setPlayer({ x: 50, y: 180 });
    setBullets([]);
    setEnemies([]);
  };

  return (
    <VStack spacing={4} mt={4}>
      <Text fontSize="2xl">Space Impact - Score: {score} | Lives: {lives}</Text>
      <Box border="2px solid white">
        <canvas ref={canvasRef} width={600} height={400} />
      </Box>
      {!gameOver && <Text>Use ↑↓ to move, Space to shoot</Text>}
      {gameOver && (
        <Button colorScheme="red" onClick={handleRestart}>
          Restart Game
        </Button>
      )}
    </VStack>
  );
}

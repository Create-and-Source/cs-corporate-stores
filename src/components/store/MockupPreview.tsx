"use client";

import { useRef, useEffect, useState } from "react";
import { Package } from "lucide-react";

// Print location positions (relative to product image, 0-1 scale)
const PLACEMENT_POSITIONS: Record<string, { x: number; y: number; w: number; h: number }> = {
  // Apparel - chest placements (positioned on the garment chest area)
  left_chest: { x: 0.30, y: 0.32, w: 0.16, h: 0.12 },
  right_chest: { x: 0.54, y: 0.32, w: 0.16, h: 0.12 },
  front: { x: 0.28, y: 0.28, w: 0.44, h: 0.30 },
  full_front: { x: 0.25, y: 0.25, w: 0.50, h: 0.35 },

  // Apparel - back
  back: { x: 0.28, y: 0.28, w: 0.44, h: 0.30 },
  upper_back: { x: 0.30, y: 0.22, w: 0.40, h: 0.12 },

  // Sleeves
  left_sleeve_short: { x: 0.12, y: 0.32, w: 0.12, h: 0.10 },
  right_sleeve_short: { x: 0.76, y: 0.32, w: 0.12, h: 0.10 },
  left_sleeve_long: { x: 0.10, y: 0.40, w: 0.10, h: 0.12 },
  right_sleeve_long: { x: 0.80, y: 0.40, w: 0.10, h: 0.12 },
  left_sleeve: { x: 0.12, y: 0.32, w: 0.12, h: 0.10 },
  right_sleeve: { x: 0.76, y: 0.32, w: 0.12, h: 0.10 },

  // Headwear
  front_center: { x: 0.30, y: 0.30, w: 0.40, h: 0.25 },
  front_cuff: { x: 0.28, y: 0.42, w: 0.44, h: 0.16 },

  // Drinkware
  laser_engrave: { x: 0.28, y: 0.32, w: 0.44, h: 0.30 },
  wrap: { x: 0.22, y: 0.28, w: 0.56, h: 0.40 },

  // Default center
  center: { x: 0.30, y: 0.30, w: 0.40, h: 0.28 },
};

interface MockupPreviewProps {
  productImage: string | null;
  productName: string;
  logoUrl: string;
  placement: string; // e.g., "left_chest", "front", "back"
  productCategory?: string;
}

export function MockupPreview({
  productImage,
  productName,
  logoUrl,
  placement,
  productCategory,
}: MockupPreviewProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [rendered, setRendered] = useState(false);
  const [canvasUrl, setCanvasUrl] = useState<string | null>(null);

  useEffect(() => {
    if (!canvasRef.current || !logoUrl) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const size = 600;
    canvas.width = size;
    canvas.height = size;

    // Get placement position
    const pos = PLACEMENT_POSITIONS[placement] ||
      PLACEMENT_POSITIONS[placement.toLowerCase().replace(/\s+/g, "_")] ||
      PLACEMENT_POSITIONS.center;

    const drawMockup = async () => {
      // Clear
      ctx.fillStyle = "#F5F2EE";
      ctx.fillRect(0, 0, size, size);

      // Draw product image
      if (productImage) {
        try {
          const productImg = new window.Image();
          productImg.crossOrigin = "anonymous";
          await new Promise<void>((resolve, reject) => {
            productImg.onload = () => resolve();
            productImg.onerror = () => reject();
            productImg.src = productImage;
          });

          // Draw product centered and contained
          const pAspect = productImg.width / productImg.height;
          let pw, ph, px, py;
          if (pAspect > 1) {
            pw = size;
            ph = size / pAspect;
            px = 0;
            py = (size - ph) / 2;
          } else {
            ph = size;
            pw = size * pAspect;
            px = (size - pw) / 2;
            py = 0;
          }
          ctx.drawImage(productImg, px, py, pw, ph);
        } catch {
          // Draw placeholder if image fails
          ctx.fillStyle = "#E8E4DF";
          ctx.fillRect(0, 0, size, size);
          ctx.fillStyle = "#C4A882";
          ctx.font = "bold 14px sans-serif";
          ctx.textAlign = "center";
          ctx.fillText(productName, size / 2, size / 2);
        }
      } else {
        // No product image — draw a blank garment shape
        drawBlankProduct(ctx, size, productCategory || "");
      }

      // Draw logo overlay
      try {
        const logoImg = new window.Image();
        logoImg.crossOrigin = "anonymous";
        await new Promise<void>((resolve, reject) => {
          logoImg.onload = () => resolve();
          logoImg.onerror = () => reject();
          logoImg.src = logoUrl;
        });

        const lx = pos.x * size;
        const ly = pos.y * size;
        const lw = pos.w * size;
        const lh = pos.h * size;

        // Maintain logo aspect ratio within the placement area
        const logoAspect = logoImg.width / logoImg.height;
        let drawW, drawH;
        if (logoAspect > lw / lh) {
          drawW = lw;
          drawH = lw / logoAspect;
        } else {
          drawH = lh;
          drawW = lh * logoAspect;
        }
        const drawX = lx + (lw - drawW) / 2;
        const drawY = ly + (lh - drawH) / 2;

        // Draw logo with multiply blend for realism on fabric
        ctx.save();
        ctx.globalAlpha = 0.92;
        ctx.globalCompositeOperation = "multiply";
        ctx.drawImage(logoImg, drawX, drawY, drawW, drawH);
        ctx.restore();

        // Draw again on top with slight opacity for vibrancy
        ctx.save();
        ctx.globalAlpha = 0.5;
        ctx.drawImage(logoImg, drawX, drawY, drawW, drawH);
        ctx.restore();

        // Subtle shadow under logo
        ctx.save();
        ctx.globalAlpha = 0.04;
        ctx.filter = "blur(4px)";
        ctx.drawImage(logoImg, drawX + 2, drawY + 2, drawW, drawH);
        ctx.restore();
      } catch {
        // Logo failed to load — show placeholder
        const lx = pos.x * size;
        const ly = pos.y * size;
        const lw = pos.w * size;
        const lh = pos.h * size;
        ctx.strokeStyle = "#C4A882";
        ctx.lineWidth = 2;
        ctx.setLineDash([5, 5]);
        ctx.strokeRect(lx, ly, lw, lh);
        ctx.setLineDash([]);
        ctx.fillStyle = "#C4A882";
        ctx.font = "11px sans-serif";
        ctx.textAlign = "center";
        ctx.fillText("Your Logo Here", lx + lw / 2, ly + lh / 2);
      }

      // Add placement label
      ctx.fillStyle = "rgba(0,0,0,0.6)";
      ctx.fillRect(0, size - 30, size, 30);
      ctx.fillStyle = "#ffffff";
      ctx.font = "bold 10px sans-serif";
      ctx.textAlign = "center";
      ctx.fillText(
        `${productName} — ${placement.replace(/_/g, " ").toUpperCase()}`,
        size / 2,
        size - 12
      );

      setRendered(true);
      setCanvasUrl(canvas.toDataURL("image/png"));
    };

    drawMockup();
  }, [productImage, logoUrl, placement, productName, productCategory]);

  return (
    <div className="bg-off-white border border-gray-100 overflow-hidden">
      <canvas
        ref={canvasRef}
        className="w-full h-auto"
        style={{ display: rendered ? "block" : "none" }}
      />
      {!rendered && (
        <div className="aspect-square flex items-center justify-center">
          <Package size={24} className="text-kraft animate-pulse" />
        </div>
      )}
    </div>
  );
}

// Draw a simplified blank product shape when no photo exists
function drawBlankProduct(ctx: CanvasRenderingContext2D, size: number, category: string) {
  const cat = category.toLowerCase();
  ctx.fillStyle = "#E8E4DF";
  ctx.fillRect(0, 0, size, size);

  ctx.strokeStyle = "#D4BE9C";
  ctx.lineWidth = 2;
  ctx.fillStyle = "#F0EDE6";

  if (cat.includes("shirt") || cat.includes("tee") || cat.includes("top") || cat.includes("polo") || cat.includes("apparel")) {
    // T-shirt shape
    ctx.beginPath();
    ctx.moveTo(180, 100);
    ctx.lineTo(120, 130);
    ctx.lineTo(80, 200);
    ctx.lineTo(130, 220);
    ctx.lineTo(150, 170);
    ctx.lineTo(150, 500);
    ctx.lineTo(450, 500);
    ctx.lineTo(450, 170);
    ctx.lineTo(470, 220);
    ctx.lineTo(520, 200);
    ctx.lineTo(480, 130);
    ctx.lineTo(420, 100);
    ctx.lineTo(350, 120);
    ctx.lineTo(300, 110);
    ctx.lineTo(250, 120);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
  } else if (cat.includes("hoodie") || cat.includes("sweat")) {
    // Hoodie shape
    ctx.beginPath();
    ctx.moveTo(200, 80);
    ctx.lineTo(130, 120);
    ctx.lineTo(70, 220);
    ctx.lineTo(120, 240);
    ctx.lineTo(140, 180);
    ctx.lineTo(140, 520);
    ctx.lineTo(460, 520);
    ctx.lineTo(460, 180);
    ctx.lineTo(480, 240);
    ctx.lineTo(530, 220);
    ctx.lineTo(470, 120);
    ctx.lineTo(400, 80);
    ctx.quadraticCurveTo(300, 50, 200, 80);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
  } else if (cat.includes("hat") || cat.includes("cap") || cat.includes("headwear") || cat.includes("beanie")) {
    // Cap shape
    ctx.beginPath();
    ctx.arc(300, 280, 150, Math.PI, 0);
    ctx.lineTo(450, 320);
    ctx.lineTo(500, 340);
    ctx.lineTo(100, 340);
    ctx.lineTo(150, 320);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
    // Brim
    ctx.beginPath();
    ctx.ellipse(300, 340, 200, 30, 0, 0, Math.PI);
    ctx.fill();
    ctx.stroke();
  } else if (cat.includes("mug") || cat.includes("drink") || cat.includes("bottle") || cat.includes("tumbler")) {
    // Mug shape
    ctx.beginPath();
    ctx.moveTo(180, 150);
    ctx.lineTo(170, 450);
    ctx.quadraticCurveTo(300, 480, 430, 450);
    ctx.lineTo(420, 150);
    ctx.quadraticCurveTo(300, 130, 180, 150);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
    // Handle
    ctx.beginPath();
    ctx.arc(440, 300, 40, -Math.PI / 2, Math.PI / 2);
    ctx.stroke();
  } else {
    // Generic rectangle product
    ctx.fillRect(120, 100, 360, 400);
    ctx.strokeRect(120, 100, 360, 400);
  }
}


import React, { useRef, useEffect, useState, forwardRef, useImperativeHandle } from 'react';
import type { SourceImage } from '../types';

interface ArrowEditorProps {
  sourceImage: SourceImage;
  onArrowDrawn: (annotatedImage: SourceImage | null) => void;
}

interface Point { x: number; y: number; }

// Helper function to draw an arrow on a canvas context
const drawArrow = (ctx: CanvasRenderingContext2D, fromX: number, fromY: number, toX: number, toY: number, headLength: number) => {
    const dx = toX - fromX;
    const dy = toY - fromY;
    const angle = Math.atan2(dy, dx);
    ctx.beginPath();
    ctx.moveTo(fromX, fromY);
    ctx.lineTo(toX, toY);
    ctx.lineTo(toX - headLength * Math.cos(angle - Math.PI / 6), toY - headLength * Math.sin(angle - Math.PI / 6));
    ctx.moveTo(toX, toY);
    ctx.lineTo(toX - headLength * Math.cos(angle + Math.PI / 6), toY - headLength * Math.sin(angle + Math.PI / 6));
    ctx.stroke();
};

export const ArrowEditor = forwardRef<{ clear: () => void }, ArrowEditorProps>(({ sourceImage, onArrowDrawn }, ref) => {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const [startPoint, setStartPoint] = useState<Point | null>(null);
    const [currentPoint, setCurrentPoint] = useState<Point | null>(null);
    const [isDrawing, setIsDrawing] = useState(false);
    
    const getCanvasCoordinates = (e: React.MouseEvent<HTMLCanvasElement>): Point | null => {
        const canvas = canvasRef.current;
        if (!canvas) return null;
        const rect = canvas.getBoundingClientRect();
        const scaleX = canvas.width / rect.width;
        const scaleY = canvas.height / rect.height;
        return {
          x: (e.clientX - rect.left) * scaleX,
          y: (e.clientY - rect.top) * scaleY,
        };
    };

    const clearCanvas = () => {
        const canvas = canvasRef.current;
        const ctx = canvas?.getContext('2d');
        if (ctx && canvas) {
            ctx.clearRect(0, 0, canvas.width, canvas.height);
        }
    };

    useImperativeHandle(ref, () => ({
        clear() {
            clearCanvas();
            setStartPoint(null);
            setCurrentPoint(null);
            setIsDrawing(false);
            onArrowDrawn(null);
        }
    }));

    // Effect to initialize canvas size and reset state when source image changes
    useEffect(() => {
        const canvas = canvasRef.current;
        const img = new Image();
        img.crossOrigin = "anonymous";
        img.src = `data:${sourceImage.mimeType};base64,${sourceImage.base64}`;
        img.onload = () => {
            if (canvas) {
                canvas.width = img.naturalWidth;
                canvas.height = img.naturalHeight;
                clearCanvas();
                setStartPoint(null);
                setCurrentPoint(null);
                setIsDrawing(false);
                onArrowDrawn(null);
            }
        };
    }, [sourceImage]);

    const handleMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
        // Reset previous drawing
        clearCanvas();
        onArrowDrawn(null);
        setCurrentPoint(null);
        
        const coords = getCanvasCoordinates(e);
        if (!coords) return;
        
        setIsDrawing(true);
        setStartPoint(coords);
    };

    const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
        if (!isDrawing || !startPoint) return;
        
        const coords = getCanvasCoordinates(e);
        if (!coords) return;

        clearCanvas();
        
        const canvas = canvasRef.current;
        const ctx = canvas?.getContext('2d');
        if (!ctx || !canvas) return;

        // Visual properties for drawing preview
        ctx.strokeStyle = '#f97316'; // orange-500
        ctx.lineWidth = Math.max(5, canvas.width / 100); // Dynamic line width
        ctx.lineCap = 'round';
        
        const headLength = Math.max(15, canvas.width / 40); // Dynamic head length
        drawArrow(ctx, startPoint.x, startPoint.y, coords.x, coords.y, headLength);

        setCurrentPoint(coords); // Store current point for use on mouse up
    };

    const handleMouseUp = () => {
        if (!isDrawing || !startPoint || !currentPoint) {
            setIsDrawing(false);
            return;
        }

        setIsDrawing(false);
        const endPoint = currentPoint;

        // Generate the final combined image
        const offscreenCanvas = document.createElement('canvas');
        const offscreenCtx = offscreenCanvas.getContext('2d');
        const img = new Image();
        img.crossOrigin = "anonymous";
        img.src = `data:${sourceImage.mimeType};base64,${sourceImage.base64}`;

        img.onload = () => {
            if (!offscreenCtx || !offscreenCanvas) return;

            offscreenCanvas.width = img.naturalWidth;
            offscreenCanvas.height = img.naturalHeight;

            // 1. Draw original image
            offscreenCtx.drawImage(img, 0, 0);

            // 2. Draw the final arrow on top
            offscreenCtx.strokeStyle = '#f97316';
            offscreenCtx.lineWidth = Math.max(5, img.naturalWidth / 100);
            offscreenCtx.lineCap = 'round';
            const headLength = Math.max(15, img.naturalWidth / 40);
            drawArrow(offscreenCtx, startPoint.x, startPoint.y, endPoint.x, endPoint.y, headLength);

            // 3. Get result and call callback
            const base64 = offscreenCanvas.toDataURL('image/png').split(',')[1];
            onArrowDrawn({ base64, mimeType: 'image/png' });
        };
    };

    return (
        <div className="absolute inset-0 w-full h-full cursor-crosshair">
          <canvas
            ref={canvasRef}
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onMouseLeave={handleMouseUp} // End drawing if mouse leaves canvas
            className="w-full h-full"
          />
        </div>
    );
});

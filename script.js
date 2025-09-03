/*
 * Main logic for the All Star NFT simulator. This script wires up
 * controls in the UI to update the preview canvas, handles random
 * generation of traits, and builds a CSV of metadata rows. The
 * drawing functions deliberately avoid anti‑aliasing when scaling
 * uploaded pixel art so that the original pixel structure is
 * preserved.
 */

document.addEventListener('DOMContentLoaded', () => {
  const canvas = document.getElementById('canvas');
  const ctx = canvas.getContext('2d');

  // State variables
  let baseImg = null;
  let scale = 73.0; // percentage
  let offsetY = 0;
  let outline = false;
  let backgroundType = 'solid';
  let bgColor1 = '#0b0c10';
  let bgColor2 = '#14233a';
  let bgAngle = 45;
  let auraType = 'none';
  let auraColor = '#3a66ff';
  let auraStrength = 0.5;
  let crystalShape = 'none';
  let crystalColor = '#ffffff';
  let crystalSize = 80;
  let crystalBrightness = 0.8;
  let chestX = 512;
  let chestY = 650;
  let tokenID = 1;
  let csvRows = [];

  // Control elements
  const uploadInput = document.getElementById('upload');
  const scaleInput = document.getElementById('scale');
  const scaleValSpan = document.getElementById('scaleVal');
  const offsetYInput = document.getElementById('offsetY');
  const offsetYValSpan = document.getElementById('offsetYVal');
  const outlineCheckbox = document.getElementById('outline');
  const bgTypeRadios = document.querySelectorAll('input[name="bgType"]');
  const bgColor1Input = document.getElementById('bgColor1');
  const bgColor2Input = document.getElementById('bgColor2');
  const bgAngleInput = document.getElementById('bgAngle');
  const auraTypeSelect = document.getElementById('auraType');
  const auraColorInput = document.getElementById('auraColor');
  const auraStrengthInput = document.getElementById('auraStrength');
  const auraStrengthVal = document.getElementById('auraStrengthVal');
  const crystalShapeSelect = document.getElementById('crystalShape');
  const crystalColorInput = document.getElementById('crystalColor');
  const crystalSizeInput = document.getElementById('crystalSize');
  const crystalSizeVal = document.getElementById('crystalSizeVal');
  const crystalBrightnessInput = document.getElementById('crystalBrightness');
  const crystalBrightnessVal = document.getElementById('crystalBrightnessVal');
  const autoChestBtn = document.getElementById('autoChest');
  const outfitColorSelect = document.getElementById('outfitColor');
  const rarityTierSelect = document.getElementById('rarityTier');
  const nameTemplateInput = document.getElementById('nameTemplate');
  const descriptionTemplateInput = document.getElementById('descriptionTemplate');
  const externalUrlInput = document.getElementById('externalUrl');
  const randomizeBtn = document.getElementById('randomize');
  const exportBtn = document.getElementById('exportBtn');
  const downloadCsvBtn = document.getElementById('downloadCsvBtn');
  const csvTableBody = document.querySelector('#csvTable tbody');

  /* Utility to convert hex color to rgba string */
  function hexToRgba(hex, alpha = 1) {
    let c = hex.replace('#', '');
    if (c.length === 3) {
      c = c
        .split('')
        .map(ch => ch + ch)
        .join('');
    }
    const r = parseInt(c.substring(0, 2), 16);
    const g = parseInt(c.substring(2, 4), 16);
    const b = parseInt(c.substring(4, 6), 16);
    return `rgba(${r},${g},${b},${alpha})`;
  }

  /* CSV escape helper */
  function escapeCSV(val) {
    if (val == null) return '';
    const str = String(val);
    if (/[,"\n]/.test(str)) {
      return '"' + str.replace(/"/g, '""') + '"';
    }
    return str;
  }

  /* Random number helper */
  function randInRange(min, max) {
    return min + Math.random() * (max - min);
  }

  /* Draw the current state to the canvas */
  function drawCanvas() {
    ctx.save();
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Background
    if (backgroundType === 'solid') {
      ctx.fillStyle = bgColor1;
      ctx.fillRect(0, 0, canvas.width, canvas.height);
    } else {
      const angleRad = (bgAngle % 360) * (Math.PI / 180);
      const x0 = 512 - Math.cos(angleRad) * 512;
      const y0 = 512 - Math.sin(angleRad) * 512;
      const x1 = 512 + Math.cos(angleRad) * 512;
      const y1 = 512 + Math.sin(angleRad) * 512;
      const grad = ctx.createLinearGradient(x0, y0, x1, y1);
      grad.addColorStop(0, bgColor1);
      grad.addColorStop(1, bgColor2);
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, canvas.width, canvas.height);
    }

    // Aura overlay
    if (auraType !== 'none') {
      switch (auraType) {
        case 'glow': {
          const grad = ctx.createRadialGradient(
            512,
            512,
            0,
            512,
            512,
            Math.max(canvas.width, canvas.height)
          );
          grad.addColorStop(0, hexToRgba(auraColor, auraStrength));
          grad.addColorStop(1, hexToRgba(auraColor, 0));
          ctx.fillStyle = grad;
          ctx.fillRect(0, 0, canvas.width, canvas.height);
          break;
        }
        case 'starry': {
          // draw random stars; deterministic seed not required
          for (let i = 0; i < 200; i++) {
            const x = Math.random() * canvas.width;
            const y = Math.random() * canvas.height;
            const alpha = Math.random() * auraStrength;
            ctx.fillStyle = hexToRgba(auraColor, alpha);
            const r = Math.random() * 2 + 1;
            ctx.beginPath();
            ctx.arc(x, y, r, 0, Math.PI * 2);
            ctx.fill();
          }
          break;
        }
        case 'swirl': {
          // approximate swirl using semi‑circular arcs with decreasing opacity
          for (let i = 0; i < 40; i++) {
            const radius = 200 + i * 6;
            const startAngle = (i / 40) * Math.PI * 2;
            const endAngle = startAngle + Math.PI / 2;
            ctx.strokeStyle = hexToRgba(auraColor, auraStrength * (1 - i / 40));
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.arc(512, 512, radius, startAngle, endAngle);
            ctx.stroke();
          }
          break;
        }
        case 'multicolor': {
          const palette = ['#ff0077', '#00ffcc', '#ffcc00', '#66ccff', '#ff66cc'];
          palette.forEach((col, idx) => {
            const grad = ctx.createRadialGradient(
              512,
              512,
              0,
              512,
              512,
              canvas.width / (idx + 1)
            );
            grad.addColorStop(0, hexToRgba(col, auraStrength));
            grad.addColorStop(1, hexToRgba(col, 0));
            ctx.fillStyle = grad;
            ctx.fillRect(0, 0, canvas.width, canvas.height);
          });
          break;
        }
      }
    }

    // Draw base image
    if (baseImg) {
      const imgW = baseImg.width;
      const imgH = baseImg.height;
      const targetW = canvas.width * (scale / 100);
      const factor = targetW / imgW;
      const targetH = imgH * factor;
      const x = (canvas.width - targetW) / 2;
      const y = (canvas.height - targetH) / 2 + offsetY;
      ctx.imageSmoothingEnabled = false;
      ctx.drawImage(baseImg, x, y, targetW, targetH);
      // Outline rectangle
      if (outline) {
        ctx.strokeStyle = hexToRgba('#ffffff', 0.8);
        ctx.lineWidth = 2;
        ctx.strokeRect(x - 1, y - 1, targetW + 2, targetH + 2);
      }
    }

    // Draw chest crystal
    if (crystalShape !== 'none') {
      drawCrystal(chestX, chestY, crystalSize, crystalColor, crystalBrightness, crystalShape);
    }

    ctx.restore();
  }

  /* Draw a crystal shape at (x, y) with given size and color */
  function drawCrystal(x, y, size, color, brightness, type) {
    const fill = hexToRgba(color, brightness);
    ctx.fillStyle = fill;
    ctx.beginPath();
    switch (type) {
      case 'circle':
        ctx.moveTo(x + size, y);
        ctx.arc(x, y, size, 0, Math.PI * 2);
        break;
      case 'diamond':
        ctx.moveTo(x, y - size);
        ctx.lineTo(x + size, y);
        ctx.lineTo(x, y + size);
        ctx.lineTo(x - size, y);
        break;
      case 'triangle':
        ctx.moveTo(x, y - size);
        ctx.lineTo(x + size, y + size);
        ctx.lineTo(x - size, y + size);
        break;
      case 'hexagon':
        for (let i = 0; i < 6; i++) {
          const ang = (Math.PI / 3) * i - Math.PI / 2;
          const vx = x + size * Math.cos(ang);
          const vy = y + size * Math.sin(ang);
          if (i === 0) ctx.moveTo(vx, vy);
          else ctx.lineTo(vx, vy);
        }
        break;
      case 'star':
        for (let i = 0; i < 10; i++) {
          const ang = (Math.PI / 5) * i - Math.PI / 2;
          const r = i % 2 === 0 ? size : size / 2;
          const vx = x + r * Math.cos(ang);
          const vy = y + r * Math.sin(ang);
          if (i === 0) ctx.moveTo(vx, vy);
          else ctx.lineTo(vx, vy);
        }
        break;
      case 'lightning':
        ctx.moveTo(x - size * 0.5, y - size);
        ctx.lineTo(x, y - size * 0.3);
        ctx.lineTo(x - size * 0.3, y - size * 0.3);
        ctx.lineTo(x + size * 0.3, y + size);
        ctx.lineTo(x, y + size * 0.3);
        ctx.lineTo(x + size * 0.3, y + size * 0.3);
        break;
      case 'spiral':
        {
          let r = size;
          ctx.moveTo(x, y);
          for (let i = 0; i < 40; i++) {
            const ang = i * 0.3;
            const vx = x + r * Math.cos(ang);
            const vy = y + r * Math.sin(ang);
            ctx.lineTo(vx, vy);
            r -= size / 40;
          }
        }
        break;
    }
    ctx.closePath();
    ctx.fill();
  }

  /* File upload handler */
  uploadInput.addEventListener('change', (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      baseImg = new Image();
      baseImg.onload = drawCanvas;
      baseImg.src = reader.result;
    };
    reader.readAsDataURL(file);
  });

  // Bind controls
  scaleInput.addEventListener('input', () => {
    scale = parseFloat(scaleInput.value);
    scaleValSpan.textContent = `${scale}%`;
    drawCanvas();
  });
  offsetYInput.addEventListener('input', () => {
    offsetY = parseInt(offsetYInput.value, 10);
    offsetYValSpan.textContent = offsetY;
    drawCanvas();
  });
  outlineCheckbox.addEventListener('change', () => {
    outline = outlineCheckbox.checked;
    drawCanvas();
  });
  bgTypeRadios.forEach((radio) => {
    radio.addEventListener('change', () => {
      backgroundType = radio.value;
      drawCanvas();
    });
  });
  bgColor1Input.addEventListener('input', () => {
    bgColor1 = bgColor1Input.value;
    drawCanvas();
  });
  bgColor2Input.addEventListener('input', () => {
    bgColor2 = bgColor2Input.value;
    drawCanvas();
  });
  bgAngleInput.addEventListener('input', () => {
    bgAngle = parseFloat(bgAngleInput.value);
    drawCanvas();
  });
  auraTypeSelect.addEventListener('change', () => {
    auraType = auraTypeSelect.value;
    drawCanvas();
  });
  auraColorInput.addEventListener('input', () => {
    auraColor = auraColorInput.value;
    drawCanvas();
  });
  auraStrengthInput.addEventListener('input', () => {
    auraStrength = parseFloat(auraStrengthInput.value);
    auraStrengthVal.textContent = auraStrength.toFixed(1);
    drawCanvas();
  });
  crystalShapeSelect.addEventListener('change', () => {
    crystalShape = crystalShapeSelect.value;
    drawCanvas();
  });
  crystalColorInput.addEventListener('input', () => {
    crystalColor = crystalColorInput.value;
    drawCanvas();
  });
  crystalSizeInput.addEventListener('input', () => {
    crystalSize = parseInt(crystalSizeInput.value, 10);
    crystalSizeVal.textContent = crystalSize;
    drawCanvas();
  });
  crystalBrightnessInput.addEventListener('input', () => {
    crystalBrightness = parseFloat(crystalBrightnessInput.value);
    crystalBrightnessVal.textContent = crystalBrightness.toFixed(2);
    drawCanvas();
  });
  autoChestBtn.addEventListener('click', () => {
    chestX = 512;
    chestY = 650;
    drawCanvas();
  });
  // Update chest position by clicking the canvas
  canvas.addEventListener('click', (e) => {
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    chestX = x;
    chestY = y;
    drawCanvas();
  });

  /* Randomize all tunable parameters */
  randomizeBtn.addEventListener('click', () => {
    // Scale between 70 and 75
    scale = Math.round(randInRange(70, 75) * 2) / 2;
    scaleInput.value = scale;
    scaleValSpan.textContent = `${scale}%`;
    // Offset between -200 and 200
    offsetY = Math.round(randInRange(-200, 200));
    offsetYInput.value = offsetY;
    offsetYValSpan.textContent = offsetY;
    // Background type
    backgroundType = Math.random() < 0.5 ? 'solid' : 'gradient';
    document.querySelector(`input[name="bgType"][value="${backgroundType}"]`).checked = true;
    // Colors
    function randomColor() {
      const letters = '0123456789ABCDEF';
      let c = '#';
      for (let i = 0; i < 6; i++) c += letters[Math.floor(Math.random() * 16)];
      return c;
    }
    bgColor1 = randomColor();
    bgColor1Input.value = bgColor1;
    bgColor2 = randomColor();
    bgColor2Input.value = bgColor2;
    bgAngle = Math.floor(randInRange(0, 360));
    bgAngleInput.value = bgAngle;
    // Aura
    const auraOptions = ['none', 'glow', 'starry', 'swirl', 'multicolor'];
    auraType = auraOptions[Math.floor(Math.random() * auraOptions.length)];
    auraTypeSelect.value = auraType;
    auraColor = randomColor();
    auraColorInput.value = auraColor;
    auraStrength = Math.round(randInRange(0.2, 0.8) * 10) / 10;
    auraStrengthInput.value = auraStrength;
    auraStrengthVal.textContent = auraStrength.toFixed(1);
    // Crystal
    const crystalOptions = ['none', 'diamond', 'star', 'circle', 'triangle', 'hexagon', 'lightning', 'spiral'];
    crystalShape = crystalOptions[Math.floor(Math.random() * crystalOptions.length)];
    crystalShapeSelect.value = crystalShape;
    crystalColor = randomColor();
    crystalColorInput.value = crystalColor;
    crystalSize = Math.round(randInRange(30, 150));
    crystalSizeInput.value = crystalSize;
    crystalSizeVal.textContent = crystalSize;
    crystalBrightness = Math.round(randInRange(0.4, 1) * 20) / 20;
    crystalBrightnessInput.value = crystalBrightness;
    crystalBrightnessVal.textContent = crystalBrightness.toFixed(2);
    chestX = Math.round(randInRange(300, 724));
    chestY = Math.round(randInRange(500, 850));
    // Traits
    const outfitOptions = ['gold', 'silver', 'black', 'white', 'red', 'green', 'blue', 'purple'];
    outfitColorSelect.value = outfitOptions[Math.floor(Math.random() * outfitOptions.length)];
    const rarityOptions = ['Common', 'Rare', 'Legendary'];
    rarityTierSelect.value = rarityOptions[Math.floor(Math.random() * rarityOptions.length)];
    drawCanvas();
  });

  /* Export current canvas to PNG and append a CSV row */
  exportBtn.addEventListener('click', () => {
    if (!baseImg) {
      alert('Please upload a base image first.');
      return;
    }
    // Generate file name
    const idStr = String(tokenID).padStart(3, '0');
    const fileName = `${idStr}.png`;
    const link = document.createElement('a');
    link.href = canvas.toDataURL('image/png');
    link.download = fileName;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    // Build metadata row
    const nameTemplate = nameTemplateInput.value || 'All Star Penguin #{{id}}';
    const name = nameTemplate.replace(/\{\{id\}\}/g, tokenID);
    const description = descriptionTemplateInput.value || '';
    const external = externalUrlInput.value || '';
    const row = [
      tokenID,
      name,
      description,
      fileName,
      external,
      outfitColorSelect.value,
      auraType,
      crystalShape,
      rarityTierSelect.value,
    ];
    csvRows.push(row);
    // Append to table visually
    const tr = document.createElement('tr');
    row.forEach((cell) => {
      const td = document.createElement('td');
      td.textContent = cell;
      tr.appendChild(td);
    });
    csvTableBody.appendChild(tr);
    tokenID++;
  });

  /* Download the accumulated CSV */
  downloadCsvBtn.addEventListener('click', () => {
    if (!csvRows.length) {
      alert('No rows to download yet.');
      return;
    }
    let csv =
      'tokenID,name,description,file_name,external_url,attributes[Outfit Color],attributes[Aura],attributes[Crystal],attributes[Rarity Tier]\n';
    csvRows.forEach((r) => {
      csv += r.map(escapeCSV).join(',') + '\n';
    });
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'metadata.csv';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  });

  // Initial draw
  drawCanvas();
});
<script>
  import { onMount } from 'svelte';
  
  export let data = [];
  export let type = 'line';
  export let title = '';
  export let width = 400;
  export let height = 300;
  export let color = '#D4AF37';

  let canvas;
  let ctx;

  onMount(() => {
    if (canvas) {
      ctx = canvas.getContext('2d');
      drawChart();
    }
  });

  function drawChart() {
    if (!ctx || !data.length) return;

    // Clear canvas
    ctx.clearRect(0, 0, width, height);

    // Set up chart area
    const padding = 40;
    const chartWidth = width - 2 * padding;
    const chartHeight = height - 2 * padding;

    // Find data bounds
    const maxValue = Math.max(...data.map(d => d.value));
    const minValue = Math.min(...data.map(d => d.value));
    const valueRange = maxValue - minValue || 1;

    // Draw background
    ctx.fillStyle = 'rgba(26, 26, 26, 0.9)';
    ctx.fillRect(0, 0, width, height);

    // Draw grid lines
    ctx.strokeStyle = 'rgba(212, 175, 55, 0.2)';
    ctx.lineWidth = 1;
    
    // Horizontal grid lines
    for (let i = 0; i <= 5; i++) {
      const y = padding + (chartHeight / 5) * i;
      ctx.beginPath();
      ctx.moveTo(padding, y);
      ctx.lineTo(width - padding, y);
      ctx.stroke();
    }

    // Vertical grid lines
    for (let i = 0; i <= data.length - 1; i++) {
      const x = padding + (chartWidth / (data.length - 1)) * i;
      ctx.beginPath();
      ctx.moveTo(x, padding);
      ctx.lineTo(x, height - padding);
      ctx.stroke();
    }

    if (type === 'line') {
      drawLineChart(chartWidth, chartHeight, padding, maxValue, minValue, valueRange);
    } else if (type === 'bar') {
      drawBarChart(chartWidth, chartHeight, padding, maxValue, minValue, valueRange);
    }

    // Draw title
    if (title) {
      ctx.fillStyle = '#D4AF37';
      ctx.font = '16px Arial';
      ctx.textAlign = 'center';
      ctx.fillText(title, width / 2, 25);
    }
  }

  function drawLineChart(chartWidth, chartHeight, padding, maxValue, minValue, valueRange) {
    ctx.strokeStyle = color;
    ctx.lineWidth = 2;
    ctx.beginPath();

    data.forEach((point, index) => {
      const x = padding + (chartWidth / (data.length - 1)) * index;
      const y = padding + chartHeight - ((point.value - minValue) / valueRange) * chartHeight;
      
      if (index === 0) {
        ctx.moveTo(x, y);
      } else {
        ctx.lineTo(x, y);
      }
    });

    ctx.stroke();

    // Draw data points
    ctx.fillStyle = color;
    data.forEach((point, index) => {
      const x = padding + (chartWidth / (data.length - 1)) * index;
      const y = padding + chartHeight - ((point.value - minValue) / valueRange) * chartHeight;
      
      ctx.beginPath();
      ctx.arc(x, y, 4, 0, 2 * Math.PI);
      ctx.fill();
    });
  }

  function drawBarChart(chartWidth, chartHeight, padding, maxValue, minValue, valueRange) {
    const barWidth = chartWidth / data.length * 0.8;
    const barSpacing = chartWidth / data.length * 0.2;

    ctx.fillStyle = color;
    
    data.forEach((point, index) => {
      const x = padding + (chartWidth / data.length) * index + barSpacing / 2;
      const barHeight = ((point.value - minValue) / valueRange) * chartHeight;
      const y = padding + chartHeight - barHeight;
      
      ctx.fillRect(x, y, barWidth, barHeight);
    });
  }

  $: if (ctx && data) {
    drawChart();
  }
</script>

<style>
  .chart-container {
    display: inline-block;
    border: 1px solid rgba(212, 175, 55, 0.2);
    border-radius: 8px;
    background: rgba(26, 26, 26, 0.9);
    padding: 1rem;
  }

  canvas {
    display: block;
  }
</style>

<div class="chart-container">
  <canvas bind:this={canvas} {width} {height}></canvas>
</div>
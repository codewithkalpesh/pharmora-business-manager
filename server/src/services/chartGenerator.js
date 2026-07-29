const { ChartJSNodeCanvas } = require('chartjs-node-canvas');
const path = require('path');
const fs = require('fs');

const createChartImage = async (config, width = 1200, height = 600) => {
  const chartCanvas = new ChartJSNodeCanvas({ width, height, backgroundColour: 'white' });
  return chartCanvas.renderToBuffer(config);
};

const buildLineChart = async (labels, values, label = 'Daily Sales') => {
  const config = {
    type: 'line',
    data: {
      labels,
      datasets: [{
        label,
        data: values,
        borderColor: '#2563eb',
        backgroundColor: 'rgba(37,99,235,0.12)',
        fill: true,
        tension: 0.3,
        pointRadius: 4,
        pointBackgroundColor: '#2563eb',
      }],
    },
    options: {
      responsive: false,
      plugins: {
        legend: { display: false },
        title: { display: true, text: label, font: { size: 18 } },
      },
      scales: {
        x: { grid: { display: false }, ticks: { maxRotation: 0, minRotation: 0 } },
        y: { grid: { color: '#e2e8f0' } },
      },
    },
  };
  return createChartImage(config, 900, 450);
};

const buildBarChart = async (labels, values, label = 'Daily Expenses') => {
  const config = {
    type: 'bar',
    data: {
      labels,
      datasets: [{
        label,
        data: values,
        backgroundColor: '#f97316',
        borderColor: '#fb923c',
        borderWidth: 1,
      }],
    },
    options: {
      responsive: false,
      plugins: {
        legend: { display: false },
        title: { display: true, text: label, font: { size: 18 } },
      },
      scales: {
        x: { grid: { display: false }, ticks: { maxRotation: 0, minRotation: 0 } },
        y: { grid: { color: '#e2e8f0' } },
      },
    },
  };
  return createChartImage(config, 900, 450);
};

const buildPieChart = async (labels, values, title = 'Payment Methods') => {
  const config = {
    type: 'pie',
    data: {
      labels,
      datasets: [{
        data: values,
        backgroundColor: ['#16a34a', '#2563eb', '#f97316', '#8b5cf6'],
        borderColor: '#ffffff',
        borderWidth: 2,
      }],
    },
    options: {
      responsive: false,
      plugins: {
        legend: { position: 'bottom' },
        title: { display: true, text: title, font: { size: 18 } },
      },
    },
  };
  return createChartImage(config, 900, 450);
};

module.exports = {
  buildLineChart,
  buildBarChart,
  buildPieChart,
};
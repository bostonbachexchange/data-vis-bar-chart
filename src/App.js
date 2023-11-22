import React, { useEffect, useState } from 'react';
import 'bootstrap/dist/css/bootstrap.min.css';
import * as d3 from 'd3';
import d3Tip from 'd3-tip';

function App() {
  const [data, setData] = useState([]);

  useEffect(() => {
    fetch('http://api.worldbank.org/v2/country/USA/indicator/FP.CPI.TOTL.ZG?format=json')
      .then(response => response.json())
      .then(apiData => {
        const chartData = apiData[1].map(entry => ({
          date: entry.date,
          value: entry.value,
        }));

        drawChart(chartData);
      })
      .catch(error => console.error('Error fetching data:', error));
  }, []);

  const drawChart = (chartData) => {
    const margin = { top: 20, right: 20, bottom: 30, left: 40 };
    const width = 600 - margin.left - margin.right;
    const height = 400 - margin.top - margin.bottom;

    // Check if SVG already exists
    const existingSvg = d3.select('#chart-container svg');
    const svg = existingSvg.empty()
      ? d3.select('#chart-container').append('svg')
        .attr('width', width + margin.left + margin.right)
        .attr('height', height + margin.top + margin.bottom)
        .append('g')
        .attr('transform', `translate(${margin.left},${margin.top})`)
      : existingSvg.select('g');

    const tip = d3Tip()
      .attr('class', 'd3-tip')
      .offset([-10, 0])
      .html(d => 
        `<strong >${d.date}:</strong> ${d.value.toString().substring(0, 3)}%`
        );

    svg.call(tip);

    const xScale = d3
      .scaleBand()
      .domain(chartData.map(d => d.date).reverse())
      .range([0, width])
      .padding(0.11);

    const yScale = d3
      .scaleLinear()
      .domain([0, d3.max(chartData, d => d.value)])
      .range([height, 0]);

    // const xAxis = d3.axisBottom(xScale).tickFormat(d => d).tickSize(0);

    const xAxis = d3.axisBottom(xScale).tickFormat(d => d).tickSize(0);



    const yAxis = d3.axisLeft(yScale);

    // Remove existing axis and bars
    svg.selectAll('.x-axis, .y-axis, .bar').remove();

    svg
    .append('g')
    .attr('class', 'x-axis')
    .attr('transform', `translate(0, ${height})`)
    .call(xAxis)
    .selectAll('text')
    .attr('transform', 'rotate(-45)')
    .style('text-anchor', 'end')
    .attr('dx', '-.8em') // Adjustments for rotated text
    .attr('dy', '.15em');
    // svg
    //   .append('g')
    //   .attr('class', 'x-axis')
    //   .attr('transform', `translate(0, ${height})`)
    //   .call(xAxis);

    svg
      .append('g')
      .attr('class', 'y-axis')
      .call(yAxis);

    svg
      .selectAll('.bar')
      .data(chartData)
      .enter()
      .append('rect')
      .attr('class', 'bar')
      .attr('x', d => xScale(d.date))
      .attr('width', xScale.bandwidth())
      // .attr('y', d => yScale(d.value))
      // .attr('height', d => height - yScale(d.value))
      .attr('y', d => (d.value >= 0 ? yScale(d.value) : yScale(0))) // Ensure y is non-negative
      .attr('height', d => Math.abs(yScale(0) - yScale(d.value))) // 
      .on('mouseover', (event, d) => tip.show(d, event.currentTarget))       
      .on('mouseout', tip.hide);
  };

  return (
    <div className="text-center">
      <div id="chart-container"></div>
    </div>
  );
}

export default App;

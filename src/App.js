import React, { useEffect, useState } from 'react';
import 'bootstrap/dist/css/bootstrap.min.css';
import * as d3 from 'd3';
import d3Tip from 'd3-tip';

function App() {
  // const [dataset, setDataset] = useState([]);
  const [country, setCountry] = useState("USA"); 
  const [countries, setCountries] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);


  const fetchCountriesByPage = async (page) => {
    const response = await fetch(`https://api.worldbank.org/v2/country?format=json&page=${page}`);
    const data = await response.json();
    return data[1] || []; // Return an empty array if data is undefined
  };

  useEffect(() => {
    const fetchCountries = async () => {
      const countriesData = await fetchCountriesByPage(currentPage);
      setCountries(prevCountries => [...prevCountries, ...countriesData]);
    };
    fetchCountries();
  }, [currentPage]);
  
  // button or some UI element to load more countries
  const loadMoreCountries = () => {
    setCurrentPage(prevPage => prevPage + 1);
  };

  useEffect(() => {
    fetch(`https://api.worldbank.org/v2/country/${country}/indicator/FP.CPI.TOTL.ZG?format=json`)
      .then(response => response.json())
      .then(apiData => {
        
        const countryData = {country: apiData[1][0]["country"]["value"]}
        const chartData = apiData[1].map(entry => ({
          date: entry.date,
          value: entry.value,
        }));
        // setDataset(chartData)
        setCountry(countryData)
        drawChart(chartData);
      })
      .catch(error => console.error('Error fetching data:', error));
  }, [country]);

    const drawChart = (chartData) => {
    const margin = { top: 20, right: 30, bottom: 40, left: 40 };
    const width = 1200 - margin.left - margin.right;
    const height = 450 - margin.top - margin.bottom;

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
      .style('background-color', '#f8f9fa') 
      .style('color', '#212529') 
      .offset([-10, 0])
      .html(d => `<strong>${d.date}:</strong> ${d.value.toString().substring(0, 4)}%`);
      svg.call(tip);

    const xScale = d3
      .scaleBand()
      .domain(chartData.map(d => d.date).reverse())
      .range([0, width ])
      .padding(0.2);

    const yScale = d3
      .scaleLinear()
      .domain([ 0 , d3.max(chartData, d => d.value)])
      // .domain([ d3.min(chartData, d => d.value) >= 0 ? d3.min(chartData, d => d.value) <= 0: 0 , d3.max(chartData, d => d.value)])
      .range([height, 0]);

    // const xAxis = d3.axisBottom(xScale).tickFormat(d => d).tickSize(0);

    // const xAxis = d3.axisBottom(xScale).tickFormat(d => d).tickSize(0);
    const xAxis = d3.axisBottom(xScale)
    .tickFormat(d => d )
    .ticks(chartData.length) // Set the number of ticks equal to the number of data points
    .tickValues(chartData.map(d => d.date).reverse());
    

    const yAxis = d3.axisLeft(yScale);

    // Remove existing axis and bars
    svg.selectAll('.x-axis, .y-axis, .bar').remove();

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
      .attr('height', d => Math.abs(yScale(0) - yScale(d.value)) ) // 
      .attr("fill", (d)=> (d.value >= 0 ? "darkgreen" : "rgb(255, 22, 0)"))
      .on('mouseover', (event, d) => tip.show(d, event.currentTarget))       
      .on('mouseout', tip.hide);

    svg
      .append('g')
      .attr('class', 'x-axis')
      .attr('transform', `translate(0, ${height })`)
      .call(xAxis)
      .selectAll('text')
      .attr('transform', 'rotate(-45)')
      .style('text-anchor', 'end')
      .attr('dx', '-.5em') // Adjustments for rotated text
      .attr('dy', '.15em')
      .style('font-size', '12px') 
      .style('margin-top', '15px');
  };

  const handleCountryChange = (event) => {
    setCountry(event.target.value);
  };

  return (
    <div className="text-center">
      <h1>Inflation for {country.country}</h1>
      <p>from 1973 until current</p>
      <div className='m-2 p-4' id="chart-container"></div>
      <h2 className='mt-2'>Select a Country</h2>
      <form className='mb-4'>
        <label>
          <b>Select Country: </b>
      
          <select value={country} onChange={handleCountryChange}>
              <option  value={""} key={"blank"}>
                Select
              </option>
            {countries.map((country, index) => (
              <option  value={country.id} key={index}>
                {country.name}
              </option>
            ))}
          </select>
        </label>
      </form>
      <div>{countries.length}</div>
      <button onClick={loadMoreCountries}>Load More Countries</button>
    </div>
  );
}

export default App;

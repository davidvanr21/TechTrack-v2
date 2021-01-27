/*
*	This educational eample serves to show the process of creating a dataviz from dirty data
* It still has a lot of intermediate steps you would remove if you were to put the code into production
*/

import { select } from 'd3'

//We need this proxy becuse our resource service hasn't allows cross origin requests explicitly
const proxyUrl = 'https://cors-anywhere.herokuapp.com/'
const overviewUrl = 'https://npropendata.rdw.nl/parkingdata/v2/'

const svg = select('svg')
const margin = {top: 48, right: 72, bottom: 220, left: 72}
const height = parseInt(svg.style('height'), 10) - margin.top - margin.bosttom
const width = parseInt(svg.style('width'), 10) - margin.left - margin.right

const group = svg
  .append('g')
  .attr('transform', 'translate(' + margin.left + ',' + margin.top + ')');

const x = d3.scaleBand().padding(0.2)
const y = d3.scaleLinear()
//A Global variable holding our data
let data
//This settings object is a nice way to encapsulate settings for your program
const settings = {
	useTestData: true,
  remoteParkingsAmount: 30,
}

makeVisualization()

// Our main function which runs other functions to make a visualization
async function makeVisualization(){
  if (settings.useTestData) {
    console.log("loading local data")
    data = await getData('dataSelection.json')
  }
  else if (! settings.useTestData){
    console.log("loading remote data")
    const allParkingFacilities = await getData(proxyUrl+overviewUrl)
  	const preparedData = await prepareData(allParkingFacilities, settings.remoteParkingsAmount)
		//This step is only useful while exploring the data and shouldn't be in production code
  	inspectData(preparedData)
  	data = transformData(preparedData)
  }
  console.log({ data })
 
  setupScales()
	setupAxes(group)
	drawBars(group)
  setupInput()
}

//Draw the initial bars
function drawBars(target) {
   const bars = target
    .selectAll('.bar')
    .data(data)
    .enter()
    .append('rect')
      .attr('class', 'bar')
      .attr('x', d => x(d.description))
      .attr('y', d => y(d.capacity))
      .attr('width', x.bandwidth())
      .attr('height', d => height - y(d.capacity))
}

//Set up the scales we'll use
function setupScales(){
  console.log("setting up scales")
  //We'll set the x domain to the different preferences
  x.domain(data.map(parking => parking.description))
  //The y-domain is set to the min and max of the current y variable
  y.domain([0, d3.max(data.map(parking => parking.capacity))])
  x.rangeRound([0, width])
  y.rangeRound([height, 0])
}

//Attach x and y axes to our svg
function setupAxes(target){
  target
    .append('g')
    .attr('class', 'axis axis-x')
  	.call(d3.axisBottom(x))
    	.attr('transform', 'translate(0,' + height + ')')
  		.selectAll("text")
  		//Note: There's prob a better way to do this...
  			.attr("transform", "rotate(45)")
        .attr("dx", 80)
        .attr("dy", "1em")
        
  target
    .append('g')
    .attr('class', 'axis axis-y')
  	.call(d3.axisLeft(y)
    	.ticks(10))
}

function setupInput(){
 //You can also create the filter html by hand if you can't follow what happens here
  console.log("setting up input")
  const input = d3.select('#filter')
      .on("click", filterUnknown)
}

function filterUnknown(){
	const filterOn = this? this.checked : false
  const dataSelection = filterOn? data.filter(parking => parking.capacity) : data
  //Update the domains
  x.domain(dataSelection.map(parking => parking.description))
  y.domain([0, d3.max(dataSelection.map(parking => parking.capacity))])
  
  //Bars will store all bars created so far
  const bars = group.selectAll('.bar')
  	.data(dataSelection)
  console.log(bars)
  //Update
  bars
  	.attr('x', d => x(d.description))
    .attr('y', d => y(d.capacity))
  	.attr('width', x.bandwidth())
    .attr('height', d => height - y(d.capacity))
  
  //Enter
  bars.enter()
  	.append('rect')
      .attr('class', 'bar')
      .attr('x', d => x(d.description))
      .attr('y', d => y(d.capacity))
      .attr('width', x.bandwidth())
      .attr('height', d => height - y(d.capacity))
  
  //Exit
  bars.exit()
  		.remove()

  //Update the ticks
  svg.select('.axis-x')
      .call(d3.axisBottom(x))    	
    	.attr('transform', 'translate(0,' + height + ')')
  		.selectAll("text")
  			.attr("transform", "rotate(45)")
        .attr("dx", 80)
        .attr("dy", "1em")
  svg.select('.axis-y')
      .call(d3.axisLeft(y).ticks(10))
}

//Here we'll transform the data so it has exactly the right structure we need for our dataviz
function transformData(data){
  //Let's start by getting only the properties we need
  //Note: You can also manipulate the original data here but I've chose to work with a copy
  const leanData = data.map(item => {
		return {
    	description: item.description,
    	//Note: this is a bit dirty, would be better to check if there are more than one specs sometimes
    	capacity: getPropIfExists(item, "specifications") ? getPropIfExists(item.specifications[0], "capacity") : null,
    	usage: getPropIfExists(item, "specifications") ? getPropIfExists(item.specifications[0], "usage") : null
    }
  })
  return leanData
}

function inspectData(dataArray){
	console.log(dataArray.map(item=> item.specifications[0].capacity))
  //Looks like there are quite a number of data entries without a capacity
  const limitedAccessArr = dataArray.map(item=> item.limitedAccess)
  console.log(listUnique(limitedAccessArr))
}

//Helper function to check if an object has a specific property
function getPropIfExists(dataObject, prop){
  if (!dataObject[prop]) return null
  return dataObject[prop]
}

async function getData(url){
  let data = await d3.json(url)
  return data
}

// Returns all unique values in an array
function listUnique(dataArray){
  //logica which finds unique values
  let uniqueArray = []
  dataArray.forEach(item => {
    if (uniqueArray.indexOf(item) == -1)
    {
      uniqueArray.push(item)
    }
  })
  return uniqueArray
}

//If this functions starts getting really big, it might be useful to set up a separate module for it
//I'm not quite happy with the separation of concerns yet
async function prepareData(allParkingFacilities, amount = 10){
	//We need to do this annoying step because our data is wrapped in an object called ParkingFacilities
  allParkingFacilities = allParkingFacilities.ParkingFacilities
  const selection = allParkingFacilities.slice(0, amount)
  console.log("selection", selection)
  const selectionIDs = selection.map(parkingLocation => parkingLocation.identifier)
  console.log("selectionIDs",selectionIDs)
  const baseURL = proxyUrl + overviewUrl + "static/"
  
  const promiseSomeFacilities = selectionIDs.map(id => getData(baseURL+id))
  
  console.log("promiseSomeFacilities", promiseSomeFacilities)
  const dataWrapped = await Promise.all(promiseSomeFacilities)
  console.log("dataWrapped", dataWrapped)
  const dataUnwrapped = dataWrapped.map(item => item.parkingFacilityInformation)
  return dataUnwrapped
}
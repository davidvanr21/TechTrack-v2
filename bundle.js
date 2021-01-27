(function (d3$1) {
    'use strict';
  
    /*
    *	This educational eample serves to show the process of creating a dataviz from dirty data
    * It still has a lot of intermediate steps you would remove if you were to put the code into production
    */
  
    const svg = d3$1.select('svg');
    const margin = {top: 48, right: 72, bottom: 220, left: 72};
    const height = parseInt(svg.style('height'), 30) - margin.top - margin.bottom;
    const width = parseInt(svg.style('width'), 30) - margin.left - margin.right;
  
    const group = svg
      .append('g')
      .attr('transform', 'translate(' + margin.left + ',' + margin.top + ')');
  
    const x = d3.scaleBand().padding(0.2);
    const y = d3.scaleLinear();
    //A Global variable holding our data
    let data;
  
    makeVisualization();
  
    // Our main function which runs other functions to make a visualization
    async function makeVisualization(){
      {
        console.log("loading local data");
        data = await getData('dataSelection.json');
      }
      console.log({ data });
     
      setupScales();
        setupAxes(group);
        drawBars(group);
      setupInput();
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
          .attr('height', d => height - y(d.capacity));
    }
  
    //Set up the scales we'll use
    function setupScales(){
      console.log("setting up scales");
      //We'll set the x domain to the different preferences
      x.domain(data.map(parking => parking.description));
      //The y-domain is set to the min and max of the current y variable
      y.domain([0, d3.max(data.map(parking => parking.capacity))]);
      x.rangeRound([0, width]);
      y.rangeRound([height, 0]);
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
            .attr("dy", "1em");
            
      target
        .append('g')
        .attr('class', 'axis axis-y')
          .call(d3.axisLeft(y)
            .ticks(10));
    }
  
    function setupInput(){
     //You can also create the filter html by hand if you can't follow what happens here
      console.log("setting up input");
      const input = d3.select('#filter')
          .on("click", filterUnknown);
    }
  
    function filterUnknown(){
        const filterOn = this? this.checked : false;
      const dataSelection = filterOn? data.filter(parking => parking.capacity) : data;
      //Update the domains
      x.domain(dataSelection.map(parking => parking.description));
      y.domain([0, d3.max(dataSelection.map(parking => parking.capacity))]);
      
      //Bars will store all bars created so far
      const bars = group.selectAll('.bar')
          .data(dataSelection);
      console.log(bars);
      //Update
      bars
          .attr('x', d => x(d.description))
        .attr('y', d => y(d.capacity))
          .attr('width', x.bandwidth())
        .attr('height', d => height - y(d.capacity));
      
      //Enter
      bars.enter()
          .append('rect')
          .attr('class', 'bar')
          .attr('x', d => x(d.description))
          .attr('y', d => y(d.capacity))
          .attr('width', x.bandwidth())
          .attr('height', d => height - y(d.capacity));
      
      //Exit
      bars.exit()
              .remove();
  
      //Update the ticks
      svg.select('.axis-x')
          .call(d3.axisBottom(x))    	
            .attr('transform', 'translate(0,' + height + ')')
              .selectAll("text")
                  .attr("transform", "rotate(45)")
            .attr("dx", 80)
            .attr("dy", "1em");
      svg.select('.axis-y')
          .call(d3.axisLeft(y).ticks(10));
    }
  
    async function getData(url){
      let data = await d3.json(url);
      return data
    }
  
  }(d3));
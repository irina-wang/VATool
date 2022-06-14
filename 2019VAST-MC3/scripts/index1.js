let wsData;
let totalData;
let mapHourData;
let wordData;
let timeWordData;

function rscAreaChart(csvData, zoneData) {
  let wsRawData = [];

  const main = "#resource-timeline > svg";

  const initialOption = "events";
  const categories = [{
      id: "events",
      subTopic: false,
    },
    {
      id: "earthquake",
      subTopic: true,
      color: "red",
      parent: "events",
      content: [
        "seismic",
        "earthquake",
        "quake",
        "quaking",
        "shake",
        "shaking",
        "wobble",
        "wobbling",
        "quiver",
        "epicenter",
      ],
    },
    // {
    //   id: "rumble",
    //   subTopic: true,
    //   color: "blue",
    //   parent: "events",
    //   content: ["rumble"],
    // },
    {
      id: "resources",
      subTopic: false,
    },
    {
      id: "water",
      subTopic: true,
      color: "teal",
      parent: "resources",
      content: [
        "sewage",
        "water",
        "discharge",
        "drain",
        "irrigation",
        "sewer",
        "reservoir",
      ],
    },
    {
      id: "energy",
      subTopic: true,
      color: "green",
      parent: "resources",
      content: [
        "blackout",
        "electric",
        "candle",
        "energy",
        "flashlight",
        "fuel",
        "gas",
        "generator",
        "nuclear",
        "power",
        "radiant",
        "radiation",
        "radio rays",
        "valve",
      ],
    },
    {
      id: "medical",
      subTopic: true,
      color: "orange",
      parent: "resources",
      content: [
        "ambulance",
        "blood",
        "bruise",
        "dehydrate",
        "emergency",
        "escape",
        "evacuate",
        "evacuating",
        "evacuation",
        "fatal",
        "first aid",
        "fracture",
        "hurt",
        "illness",
        "infection",
        "injure",
        "lump",
        "medic",
        "red cross",
        "rescue",
        "rescuing",
        "respiratory",
        "suffering",
        "swollen",
        "urgent",
        "victim",
        "wound",
      ],
    },
    {
      id: "shelter",
      subTopic: true,
      color: "purple",
      parent: "resources",
      content: [
        "shelter",
        "housing",
        "building",
        "collapse",
        "construction",
        "house",
      ],
    },
    {
      id: "transportation",
      subTopic: true,
      color: "brown",
      parent: "resources",
      content: [
        "bridge",
        "traffic",
        "congestion",
        "avalanche",
        "highway",
        "lane",
        "logistic",
        "jammed",
        "route",
        "street",
        "transportation",
      ],
    },
    {
      id: "food",
      subTopic: true,
      color: "pink",
      parent: "resources",
      content: ["food"],
    },
  ];
  const stopwords = [];
  const startDate = Date.parse("2020-04-06 00:00:00");
  const endDate = Date.parse("2020-04-10 11:59:00");
  const hourToMilliSeconds = 60 * 60 * 1000;
  const streamStepUnit = 1;
  const formatTimeLegend = d3.timeFormat("%Y-%m-%d, %-I:%M:%S %p");
  const formatTimeWS = d3.timeFormat("%-m/%-d %-I%p");
  const topics = ["message", "location"];
  const margin = {
      top: 25,
      right: 20,
      bottom: 30,
      left: 30
    },
    width = $(main).width() - margin.left - margin.right,
    height = $(main).height() - margin.top - margin.bottom;
  const initTimestamp = 1586217315000;
  const bisect = d3.bisector((d) => {
    return d.time;
  }).left;
  let data;
  let streamStep = streamStepUnit * hourToMilliSeconds;
  let streamRawData;
  let highestStack;
  let keyList;
  let xScale = d3.scaleTime().range([0, width]);
  let yScale = d3.scaleLinear().range([height, 0]);

  let current;
  // 时间段 取几个小时
  let numHourAfter = 5;
  let slidingGroup;
  let slidingWindow;
  let slidingWidth = function (numHourAfter) {
    return d3
      .scaleLinear()
      .domain([0, 31])
      .range([0, (31 / 108) * width])(numHourAfter);
  };
  let vertical;
  let dataOption = [];
  let rangedData;

  loadData();

  function countMultiple(d, dataOption, streamData00, wsRawData) {
    let obj = {};
    for (let i = 0; i < dataOption.length; i++) {
      for (let j = 0; j < dataOption[i].content.length; j++) {
        if (d.message.toLowerCase().indexOf(dataOption[i].content[j]) >= 0) {
          streamData00[dataOption[i].id].push(d.time);
          if (!obj[d.time]) {
            wsRawData.push(d);
            obj[d.time] = true;
          }
          break;
        }
      }
    }
  }

  function styleAxis(axisNodes) {
    axisNodes.selectAll(".tick text");
  }
  function processStreamData(streamData00) {
    let streamData = [];
    let streamData11 = {};
    keyList = d3.keys(streamData00);
    keyList.forEach((d) => {
      streamData11[d] = [];
      for (let i = startDate; i < endDate; i += streamStep) {
        streamData11[d].push({
          timestamp: i,
          count: streamData00[d].slice(
            d3.bisect(streamData00[d], i),
            d3.bisect(streamData00[d], i + streamStep)
          ).length,
        });
      }
    });
    for (let i = 0; i < streamData11[keyList[0]].length; i++) {
      let obj = {};
      obj.time = streamData11[keyList[0]][i].timestamp;
      keyList.forEach((key) => {
        obj[key] = streamData11[key][i].count;
      });
      streamData.push(obj);
    }
    return streamData;
  }

  function getStreamData(data, dataOption) {
    wsRawData = [];
    let streamData00 = {};
    for (let i = 0; i < dataOption.length; i++) {
      streamData00[dataOption[i].id] = [];
    }
    data.forEach((d) => {
      countMultiple(d, dataOption, streamData00, wsRawData);
    });
    
    return processStreamData(streamData00);
  }

  function updateWindow(current) {
    let thisNearestHour = nearestHour(current);
    rangedData = getRangedData(
      wsRawData,
      thisNearestHour,
      thisNearestHour + numHourAfter * hourToMilliSeconds
    );
    // console.log(wsRawData,thisNearestHour,thisNearestHour + numHourAfter * hourToMilliSeconds);
    wsData = getWSdata(rangedData);
    // 处理数据
    timeWordData = getRangedWordData(
      wordData,
      thisNearestHour,
      thisNearestHour + numHourAfter * hourToMilliSeconds
    );
    mapHourData = getMapHourData(
      totalData,
      thisNearestHour,
      thisNearestHour + numHourAfter * hourToMilliSeconds
    );
    // 调用画词云的方法
    drawWordCloud();
    let streamRangedData = getRangedDataScratch(
      highestStack,
      thisNearestHour,
      thisNearestHour + numHourAfter * hourToMilliSeconds
    );
    let peak = d3.max(streamRangedData, (d) => d.y);
    peak = peak !== undefined ? peak : 0;
    slidingGroup
      .attr(
        "transform",
        "translate(" + +vertical.attr("x1") + "," + yScale(peak) + ")"
      )
      .select("text")
      .attr("x", +slidingWindow.attr("width") / 2)
      .attr("text-anchor", "middle")
      .text(numHourAfter + (numHourAfter > 1 ? " hours" : " hour"));

    slidingWindow
      .attr("height", height - yScale(peak))
      .attr("width", slidingWidth(numHourAfter));

    drawResorceMap();
  }

  function nearestHour(milliseconds) {
    return Date.parse(d3.timeHour.floor(new Date(milliseconds)));
  }

  function getRangedWordData(data, start, end) {
    let wordMap = new Map();
    let filterData = data.forEach((d) => {
      if (start < d.time && d.time < end) {
        (d.lemma_tokens?eval('('+d.lemma_tokens+')'):[]).forEach((t) => {
          let str = t.trim()
          if (wordMap.get(str)) {
            const arr = wordMap.get(str);
            arr.push(d)
            wordMap.set(str, arr)
          } else {
            wordMap.set(str, [d])
          }
        })
      }
    });
    return [...wordMap].map(d=>({id:d[0], value:d[1].length, words:d[1]}))
  }
  function getMapHourData(data, start, end){
    return data.filter((d) => {
      return start < d.time && d.time < end;
    });
  }

  function getRangedData(data, start, end) {
    return data.filter((d) => {
      return start < d.time && d.time < end;
    });
  }

  function getRangedDataScratch(data, start, end) {
    return data.filter((d) => {
      return start < d.time && d.time < end;
    });
  }

  function splitText(text) {
    return text
      .toLowerCase()
      .replace(/\.|\,|\(|\)|\;|\:|\[|\]|\&|\!|\’|\?|\#|\"|\d/gi, "")
      .split(" ")
      .filter((e) => {
        return stopwords.indexOf(e) < 0;
      });
  }

  function removeChar(text) {
    return "_" + text.toLowerCase().replace(/\W/gi, "");
  }

  function getWSdata(rangedData) {
    let wsData = {};
    let timeObj = {};
    rangedData.forEach((d) => {
      let thisHour = nearestHour(d.time);
      timeObj[thisHour] = true;
      let date = formatTimeWS(new Date(d.time));

      let wordArray = splitText(d.message);

      if (!wsData[date]) wsData[date] = {};

      wsData[date]["message"] = wsData[date]["message"] ?
        wsData[date]["message"].concat(wordArray) :
        wordArray;
      wsData[date]["location"] = wsData[date]["location"] ?
        wsData[date]["location"].concat(d.location) :
        [d.location];
    });

    wsData = d3.keys(wsData).map(function (date, i) {
      var words = {};
      topics.forEach((topic) => {
        var counts = wsData[date][topic].reduce(function (obj, word) {
          if (!obj[word]) {
            obj[word] = 0;
          }
          obj[word]++;
          return obj;
        }, {});
        words[topic] = d3
          .keys(counts)
          .map(function (d) {
            return {
              text: d,
              frequency: counts[d],
              topic: topic,
              id: removeChar(d) + d3.keys(timeObj)[i],
            };
          })
          .sort(function (a, b) {
            return b.frequency - a.frequency;
          });
      });
      return {
        time: d3.keys(timeObj)[i],
        date: date,
        words: words,
      };
    });
    return wsData;
  }

  function loadData() {
    Promise.all([d3.csv("data/YInt.csv"), d3.csv("data/YInt_LDA_1_0.csv")]).then(function (values) {
      // 地图和折线图的数据
      inputData = values[0];
      data = inputData.map((d) => {
        return {
          time: Date.parse(d.time),
          location: d.location,
          account: d.account,
          message: d.message,
        };
      });
      totalData = data;
     
      dataOption = categories.filter((d) => d.parent === initialOption);
      streamRawData = getStreamData(data, dataOption);
      
      current = initTimestamp;

      drawGraph();
      // drawPanel();

      let thisNearestHour = nearestHour(current);
      rangedData = getRangedData(
        wsRawData,
        thisNearestHour,
        thisNearestHour + numHourAfter * hourToMilliSeconds
      );
      mapHourData = getMapHourData(
        totalData,
        thisNearestHour,
        thisNearestHour + numHourAfter * hourToMilliSeconds
      );
      wsData = getWSdata(rangedData);

      let streamRangedData = getRangedDataScratch(
        highestStack,
        thisNearestHour,
        thisNearestHour + numHourAfter * hourToMilliSeconds
      );
      let peak = d3.max(streamRangedData, (d) => d.y);
      peak = peak !== undefined ? peak : 0;
      slidingGroup
        .attr(
          "transform",
          "translate(" + +vertical.attr("x1") + "," + yScale(peak) + ")"
        )
        .select("text")
        .attr("x", +slidingWindow.attr("width") / 2)
        .attr("text-anchor", "middle")
        .text(numHourAfter + (numHourAfter > 1 ? " hours" : " hour"));

      slidingWindow
        .attr("height", height - yScale(peak))
        .attr("width", slidingWidth(numHourAfter));

      drawResorceMap();
      /*******地图和折线图结束**********/
      wordCsv = values[1];
      wordData = wordCsv.map((d) => {
        return {
          topicKeywords: d.Topic_Keywords,
          time: Date.parse(d.time),
          timeStr: d.time,
          lemma_tokens: d.lemma_tokens,
          location: d.location,
          account: d.account,
          message: d.message,
        };
      });
      // Process data
      timeWordData = getRangedWordData(
        wordData,
        thisNearestHour,
        thisNearestHour + numHourAfter * hourToMilliSeconds
      );
      // Draw word cloud
      drawWordCloud();
     
    });
    function DateFormat (date, fmt='yyyy-MM-dd hh:mmm:ss') {
      if(!(date instanceof Date)){
        date=Number(date);
       if(!isNaN(date)){
         date=new Date(date)
       }else{
         return '';
       }
      }
     var o = {
       "M+" : date.getMonth()+1,                 // Month
       "d+" : date.getDate(),                    // Day
       "h+" : date.getHours(),                   // Hou
       "m+" : date.getMinutes(),                 // Minute
       "s+" : date.getSeconds(),                 // Second
       "q+" : Math.floor((date.getMonth()+3)/3), // Season
       "S"  : date.getMilliseconds()             // mSecond
     };
   
     if(/(y+)/.test(fmt)){
       fmt=fmt.replace(RegExp.$1, (date.getFullYear()+"").substring(4 - RegExp.$1.length));
     }
           
     for(var k in o){
       if(new RegExp("("+ k +")").test(fmt)){
         fmt = fmt.replace(
           RegExp.$1, (RegExp.$1.length==1) ? (o[k]) : (("00"+ o[k]).substr((""+ o[k]).length)));  
       }       
     }
   
     return fmt;
   }
    function drawGraph() {
      d3.select("body").append("div");

      let svg = d3
        .select(main)
        .attr("height", height + margin.top + margin.bottom);

      let g = svg
        .append("g")
        .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

      const stack = d3.stack().keys(keyList).offset(d3.stackOffsetNone);

      const stacks = stack(streamRawData);
      highestStack = stacks[stacks.length - 1].map((d) => {
        return {
          y: d[1],
          time: d.data.time,
        };
      });
      xScale.domain([startDate, endDate]);
      yScale.domain(d3.extent(stacks.flat().flat()));
      const xAxisGroup = g
        .append("g")
        .attr("transform", "translate(0," + height + ")");
      const xAxis = d3.axisBottom(xScale);
      let xAxisNodes = xAxisGroup.call(xAxis);
      styleAxis(xAxisNodes);

      d3.selectAll(".tick")
      .selectAll('text')
      .each(function(t) {
        var textDom = d3.select(this);
        var str = DateFormat(t,'hh:mm MM-dd')
        
        textDom.html('')
        .selectAll("tspan")
        .data(str.split(" "))
        .enter()
        .append("tspan")
        .attr("x", 0)
        .attr("y", function (d, i, nodes) {
          return 17 * i + 8;
        })
        .text(function (d) {
          return d;
        });
      });
      const yAxisGroup = g.append("g").attr("id", "yAxis");
      const yAxis = d3.axisLeft(yScale);
       let yAxisNodes = yAxisGroup.call(yAxis);
      const areaGen = d3
        .area()
        .x((d) => xScale(d.data.time))
        .y0((d) => yScale(d[0]))
        .y1((d) => yScale(d[1]))
        .curve(d3.curveMonotoneX);

      g.append("g")
        .attr("id", "streamG")
        .selectAll(".layer")
        .data(stacks)
        .enter()
        .append("path")
        .attr("class", "layer")
        .attr("d", areaGen)
        .attr("stroke","rgb(79,174,279)")
        .attr("fill", "rgba(37,83,226,0.5)");

      let tooltip = d3
        .select(main)
        .append("div")
        .attr("class", "timeSlider")
        .style("top", height + margin.top / 2 + margin.bottom + "px")
        .style("pointer-events", "none")
        .html("<text>" + formatTimeLegend(initTimestamp) + "</text>")
        .style("left", margin.left + xScale(initTimestamp) + "px");

      vertical = g
        .append("line")
        .attr("id", "vertical")
        .style("stroke", "black")
        .attr("y1", 0)
        .attr("y2", 0)
        .attr("x1", xScale(initTimestamp))
        .attr("x2", xScale(initTimestamp))
        .raise();

      let windowSize = {
        height: 287,
        width: slidingWidth(numHourAfter),
      };

      slidingGroup = g.append("g").attr("id", "slidingGroup");
      slidingWindow = slidingGroup
        .append("rect")
        .attr("x", 0)
        .attr("y", 0)
        .attr("width", slidingWidth(6))
        .attr("height", windowSize.height)
        .attr("fill", "#aaaaaa")
        .attr("fill-opacity", 0.7)
        .attr("stroke", "rgba(255,255,255,0.7)");

      let slidingText = slidingGroup
        .append("text")
        .attr("x", +slidingWindow.attr("width") / 2)
        .attr("y", -10)
        .attr("text-anchor", "middle")
        .text(numHourAfter + " hours");

      slidingGroup
        .attr(
          "transform",
          "translate(" +
          xScale(initTimestamp) +
          "," +
          (height - windowSize.height) +
          ")"
        )
        .raise();

      g.append("rect")
        .attr("class", "overlay")
        .attr("id", "overlayStreamG")
        .attr("width", width)
        .attr("height", height)
        .on("mousemove", function () {
          let mouseX = d3.mouse(this)[0];
          current = Date.parse(xScale.invert(mouseX));
          current = Math.min(Math.max(current, startDate), endDate);
          mouseX = Math.min(Math.max(mouseX, 0), width);
          updateMouseDependant(mouseX);
        });

      function updateMouseDependant(mouseX) {
        vertical.attr("x1", mouseX).attr("x2", mouseX);

        slidingGroup.attr(
          "transform",
          "translate(" +
          mouseX +
          "," +
          (height - +slidingWindow.attr("height")) +
          ")"
        );

        tooltip
          .html("<text>" + formatTimeLegend(xScale.invert(mouseX)) + "</text>")
          .style("left", mouseX + margin.left + "px");

        updateWindow(current);
      }
    }
  }
}

let opacityMap = d3.scaleLinear().domain([0, 200]).range([0.2, 1]);

function drawResorceMap() {
  if (wsData === undefined) {
    return;
  }

  colorMapData = [...zoneData];
  colorMapData = colorMapData.map(d=>{
    return {
      ...d,
      count:(mapHourData||[]).filter(mh => mh.location == d.Name).length,
    }
  });
  wsData.forEach((d) => {
    d.words.location.forEach((location) => {
      str1 = location.text; 
      let dat = colorMapData.find((z) => z.Name === str1);

      if (dat === undefined) {
        return;
      }

      if (!dat.hasOwnProperty("freq")) {
        dat.freq = 0;
      }
      dat.freq = location.frequency;
    });
  });

  let maxCount = d3.max(colorMapData, (d) => d.count);

  opacityMap.domain([0, maxCount]);
  d3.selectAll("#zones > path")
    .data(colorMapData, (d) => {
      return d.ZoneId;
    })
    .style("fill", "#1E66F8")
    .style("fill-opacity", function (d) {
      return opacityMap(d.count);
    });

  mapOver = function (d, i) {
    tipText = `conut: ${d.count}`;
  };

  mapOff = function (d, i) {
    tooltipDiv.select("t").text("");
    tooltipDiv.select("h4").text("");
  };
}

/* Draw Word cloud */
function drawWordCloud() {
  const wordContainer = "#Wordcloud";
  const margin = {
      top: 30,
      right: 30,
      bottom: 30,
      left: 30
  },
  width  = $(wordContainer).width() - margin.left - margin.right,
  height = $(wordContainer).height()- margin.top - margin.bottom;
  
  var wordSum = 70; // Control the total circles 
  let wordSvg = d3.select(wordContainer)
    .select('svg')
    .attr('width', width)
    .attr('height', height)
    .select('g.wordG');
  wordSvg.html('')
  var format = d3.format(",d");

  // Sort data
  var sortData =  timeWordData.sort((a,b)=> b.value - a.value) // Decending
                              .filter((d,i)=> i < wordSum);    // Keep 70 counts

  // Scale the data - Map quantity to bubble radius
  var rScale = d3.scaleLinear()
  .domain([sortData.length > 1 ? sortData[sortData.length-1].value: (sortData[0].value || 0),
                                                                          sortData[0].value])
  .range([20, 100]); // Min & Max bubble radius

  // Create bubble charts with pack layout 
  var pack = d3.pack()
    .size([width - 2, height - 2])
    .radius((d) => rScale(d.value))
    .padding(3);

  var root = d3.hierarchy({
      children: sortData
    })
    .sum((d) => d.value)
    .sort((a, b) => b.value - a.value);

  pack(root);

  // Add all elements to DOM
  var node = wordSvg.append("g")
    .selectAll("g")
    .data(root.children)
    .enter().append("g")
    .attr("transform", (d) => "translate(" + d.x + "," + d.y + ")")
    .attr("class", "node")
    .on('click',function(w){
      let html = w.data.words.map((d)=>{
        return `<tr>
            <td class="column-time">
                ${d.timeStr}
            </td>
            <td class="column-location">
            ${d.location}
            </td>
            <td class="column-account">
            ${d.account}
            </td>
            <td class="column-message">
            ${d.message}
            </td>
        </tr>`
      })
      d3.select(".word-tip").select('tbody')
      .html(html.join(''))
      d3.select(".word-tip")
        .style("display", null)
      d3.select(".word-tip")
        .select('p')
        .html(w.data.id)
    });

  node.append("circle")
    .attr('fill','url(#filter1)')
    .attr("id", (d) => "node-" + d.data.id)
    .attr("r", (d) => d.r);

  node.append("clipPath")
    .attr("id", d => "clip-" + d.data.id)
    .append("use")
    .attr("xlink:href", function (d) {
      return "#node-" + d.data.id + "";
    });

  node.append("text")
    .attr("clip-path", function (d) {
      return "url(#clip-" + d.data.id + ")";
    })
    .selectAll("tspan")
    .data(function (d) {
      return d.data.id.split(".").pop().split(/(?=[A-Z][^A-Z])/g);
    })
    .enter().append("tspan")
    .attr("x", 0)
    .attr("y", function (d, i, nodes) {
      return 13 + (i - nodes.length / 2 - 0.5) * 10;
    })
    .text(function (d) {
      return d;
    });

  node.append("title")
    .text(function (d) {
      return d.data.id + "\n" + format(d.value);
    });
}

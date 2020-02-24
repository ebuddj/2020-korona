import React, {Component} from 'react'
import style from './../styles/styles.less';

// https://alligator.io/react/axios-react/
import axios from 'axios';

// https://underscorejs.org/
import _ from 'underscore';

// https://github.com/topojson/topojson
import * as topojson from 'topojson';

// https://www.npmjs.com/package/rc-slider
import Slider from 'rc-slider/lib/Slider';
import 'rc-slider/assets/index.css';
import './../styles/rc-slider-override.css';

// https://d3js.org/
import * as d3 from 'd3';

let interval, g, path;
const projection = d3.geoAzimuthalEquidistant().center([33,57]).scale(800);

const countyCenters = {
  "France": {"Lat":46.603354, "Long":1.8883335},
  "Germany": {"Lat":51.0834196, "Long":10.4234469},
  "Finland": {"Lat":63.2467777, "Long":25.9209164},
  "Italy": {"Lat":42.6384261, "Long":12.674297},
  "United Kingdom": {"Lat":54.7023545, "Long":-3.2765753},
  "Russia": {"Lat":55.76158905029297, "Long":37.609458923339844},
  "Sweden": {"Lat":59.6749712, "Long":14.5208584},
  "Spain": {"Lat":39.3262345, "Long":-4.8380649},
  "Belgium": {"Lat":50.6402809, "Long":4.6667145}
} 

class App extends Component {
  constructor(props) {
    super(props);
    
    this.state = {
      data:{},
      dates:[],
      total_cases:0,
      total_deaths:0,
      year_month_idx:0
    }
  }
  componentDidMount() {
    axios.get('./data/data.json', {
    })
    .then((response) => {
      this.setState((state, props) => ({
        confirmed:response.data.confirmed,
        deaths:response.data.deaths,
        dates: _.keys(response.data.confirmed['Finland']).filter((value, index, arr) => {
          return !(value === 'Country' || value === 'Continent' || value === 'Province/State' || value === 'Lat' || value === 'Long');
        })
      }), this.drawMap);
    })
    .catch(function (error) {
    })
    .then(function () {
    });
  }
  drawMap() {
    let width = 720;
    let height = 720;
    
    let svg = d3.select('.' + style.map_container).append('svg').attr('width', width).attr('height', height);
    path = d3.geoPath().projection(projection);
    g = svg.append('g');

    let tooltip = d3.select('.' + style.map_container)
      .append('div')
      .attr('class', style.hidden + ' ' + style.tooltip);
    d3.json('./data/europe.topojson').then((topology) => {
      g.selectAll('path').data(topojson.feature(topology, topology.objects.europe).features)
        .enter()
        .append('path')
        .attr('d', path)
        .attr('class', style.path)
        .attr('fill', (d, i) => {
          return this.getCountryColor(d.properties.NAME);
        });

      g.selectAll('circle').data(Object.keys(this.state.confirmed).map(i => this.state.confirmed[i]))
        .enter()
        .append('circle')
        .attr('cx', (d, i) => {
          return projection([countyCenters[d.Country].Long, countyCenters[d.Country].Lat])[0];
        })
        .attr('cy', (d, i) => {
          return projection([countyCenters[d.Country].Long, countyCenters[d.Country].Lat])[1];
        })
        .attr('r', (d, i) => {
          return 0;
        })
        .attr('class', style.circle)
        .style('fill', 'rgba(255, 82, 51, 0.75)');

      g.selectAll('text').data(Object.keys(this.state.confirmed).map(i => this.state.confirmed[i]))
        .enter()
        .append('text')
        .attr('text-anchor', 'middle')
        .attr('alignment-baseline', 'central')
        .attr('class', style.number)
        .attr('x', (d, i) => {
          return projection([countyCenters[d.Country].Long, countyCenters[d.Country].Lat])[0] + 0.3;
        })
        .attr('y', (d, i) => {
          return projection([countyCenters[d.Country].Long, countyCenters[d.Country].Lat])[1] + 1;
        })
        .html('')
      let date = this.state.dates[this.state.year_month_idx].split('/');
      this.text = svg.append('text')
        .attr('alignment-baseline', 'top')
        .attr('class', style.text)
        .attr('text-anchor', 'middle')
        .attr('x', '50%')
        .attr('y', '95%')
        .html('' + date[1] + '.' + date[0] + '.' + date[2] + '20, 0 confirmed');
    });
    setTimeout(() => {
      this.createInterval();
    }, 3000);
  }
  changeCountryAttributes() {
    // Change fill color.
    g.selectAll('path')
      .attr('fill', (d, i) => {
        return this.getCountryColor(d.properties.NAME);
      });
    g.selectAll('circle')
      .attr('r', (d, i) => {
        this.setState((state, props) => ({
          total_cases:state.total_cases + d[this.state.dates[this.state.year_month_idx]]
        }));
        return Math.sqrt(d[this.state.dates[this.state.year_month_idx]] / Math.PI) * 12;
      });
    g.selectAll('text')
      .style('font-size', (d, i) => {
        return parseInt(Math.sqrt(d[this.state.dates[this.state.year_month_idx]] / Math.PI) * 12) + 'px';
      })
      .html((d, i) => {
        if (d[this.state.dates[this.state.year_month_idx]] > 0) {
          return d[this.state.dates[this.state.year_month_idx]];
        }
        else {
          return '';
        }
      });
  }
  getCountryColor(country) {
    if (this.state.confirmed[country] !== undefined) {
      if (this.state.confirmed[country][this.state.dates[this.state.year_month_idx]] > 0) {
        return '#808080';
      }
      else {
        return '#e5e5e5';
      }
    }
    else {
      return '#e5e5e5';
    }
  }
  onBeforeSliderChange(value) {
    if (interval) {
      clearInterval(interval)
    }
  }
  onSliderChange(value) {
    this.setState((state, props) => ({
      total_cases:0,
      year_month_idx:value
    }), this.changeCountryAttributes);
  }
  onAfterSliderChange(value) {
  }
  componentWillUnMount() {
    clearInterval(interval);
  }
  createInterval() {
    this.changeCountryAttributes();
    interval = setInterval(() => {
      this.setState((state, props) => ({
        total_cases:0,
        year_month_idx:this.state.year_month_idx + 1
      }), this.changeCountryAttributes);
      if (this.state.year_month_idx >= (this.state.dates.length - 1)) {
        clearInterval(interval);
        setTimeout(() => {
          this.setState((state, props) => ({
            total_cases:0,
            year_month_idx:0
          }), this.createInterval);
        }, 2000);
      }
    }, 1000);
  }
  render() {
    if (this.text) {
      let datetime = this.state.dates[this.state.year_month_idx].split(' ');
      let date = datetime[0].split('/');
      let time = datetime[1];
      this.text.html('' + date[1] + '.' + date[0] + '.' + date[2] + '20, ' + this.state.total_cases + ' confirmed');
    }
    return (
      <div className={style.plus}>
        <div>
          <Slider
            className={style.slider_container}
            dots={false}
            max={this.state.dates.length - 1}
            onAfterChange={this.onAfterSliderChange.bind(this)}
            onBeforeChange={this.onBeforeSliderChange}
            onChange={this.onSliderChange.bind(this)}
            value={this.state.year_month_idx}
          />
          <div className={style.map_container}></div>
        </div>
      </div>
    );
  }
}
export default App;
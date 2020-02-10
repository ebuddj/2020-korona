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

class App extends Component {
  constructor(props) {
    super(props);
    
    this.state = {
      data:{},
      dates:[],
      total_cases:0,
      year_month_idx:0
    }
  }
  componentDidMount() {
    axios.get('./data/data.json', {
    })
    .then((response) => {
      this.setState((state, props) => ({
        data:response.data,
        dates: _.keys(response.data['Finland']).filter((value, index, arr) => {
          return !(value === 'Continent' || value === 'Province/State' || value === 'Lat' || value === 'Long' || value === '1/24/20 12:00' || value === '1/25/20 0:00' || value === '1/25/20 12:00' || value === '1/26/20 11:00' || value === '1/27/20 9:00' || value === '1/27/20 19:00' || value === '1/28/20 13:00' || value === '1/28/20 18:00' || value === '1/29/20 13:30' || value === '1/29/20 14:30' || value === '2/4/20 9:40' || value === '2/5/20 9:00' || value === '2/6/20 9:00' || value === '2/7/20 20:13' || value === '2/8/20 22:04' || value === '2/9/20 10:30');
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

      g.selectAll('circle').data(Object.keys(this.state.data).map(i => this.state.data[i]))
        .enter()
        .append('circle')
        .attr('cx', (d, i) => {
          return projection([d.Long, d.Lat])[0];
        })
        .attr('cy', (d, i) => {
          return projection([d.Long, d.Lat])[1];
        })
        .attr('r', (d, i) => {
          return 0;
        })
        .attr('class', style.circle)
        .style('fill', '#FF5233');

      g.selectAll('text').data(Object.keys(this.state.data).map(i => this.state.data[i]))
        .enter()
        .append('text')
        .attr('text-anchor', 'middle')
        .attr('alignment-baseline', 'central')
        .attr('class', style.number)
        .attr('x', (d, i) => {
          return projection([d.Long, d.Lat])[0] + 0.3;
        })
        .attr('y', (d, i) => {
          return projection([d.Long, d.Lat])[1] + 1;
        })
        .html('')
      let datetime = this.state.dates[this.state.year_month_idx].split(' ');
      let date = datetime[0].split('/');
      let time = datetime[1];
      this.text = svg.append('text')
        .attr('alignment-baseline', 'top')
        .attr('class', style.text)
        .attr('text-anchor', 'middle')
        .attr('x', '50%')
        .attr('y', '95%')
        .html('By ' + date[1] + '.' + date[0] + '.' + date[2] + '20, 0 cases in total');
    });
    setTimeout(() => {
      this.createInterval();
    }, 3000);
  }
  changeCountryAttributes(type) {
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
        return Math.sqrt(d[this.state.dates[this.state.year_month_idx]] / Math.PI) * 20;
      });
    g.selectAll('text')
      .style('font-size', (d, i) => {
        return parseInt(Math.sqrt(d[this.state.dates[this.state.year_month_idx]] / Math.PI) * 20) + 'px';
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
    if (this.state.data[country] !== undefined) {
      if (this.state.data[country][this.state.dates[this.state.year_month_idx]] > 0) {
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
      this.text.html('By ' + date[1] + '.' + date[0] + '.' + date[2] + '20, ' + this.state.total_cases + ' cases in total');
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
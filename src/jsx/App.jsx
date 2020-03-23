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

// https://www.gps-coordinates.net/
const countryCenters = {
  "Albania": {"Lat":41.000028, "Long":19.9999619},
  "Andorra": {"Lat":42.5407167, "Long":1.5732033},
  "Armenia": {"Lat":40.7696272, "Long":44.6736646},
  "Austria": {"Lat":47.2000338, "Long":13.199959},
  "Azerbaijan": {"Lat":40.3936294, "Long":47.7872508},
  "Belarus": {"Lat":53.4250605, "Long":27.6971358},
  "Belgium": {"Lat":50.6402809, "Long":4.6667145},
  "Channel Islands": {"Lat":49.34659957885742, "Long":-2.362060546875},
  "Isle of Man": {"Lat":54.2358167, "Long":-4.5145987},
  "Cyprus": {"Lat":34.9823018, "Long":33.1451285},
  "Croatia": {"Lat":45.5643442, "Long":17.0118954},
  "Czechia": {"Lat":49.8167003, "Long":15.4749544},
  "Denmark": {"Lat":55.670249, "Long":10.3333283},
  "Estonia": {"Lat":58.7523778, "Long":25.3319078},
  "Faroe Islands": {"Lat":62.1985004, "Long":-6.8174124},
  "Finland": {"Lat":63.2467777, "Long":25.9209164},
  "France": {"Lat":46.603354, "Long":1.8883335},
  "Georgia": {"Lat":42, "Long":44.0287382},
  "Germany": {"Lat":51.0834196, "Long":10.4234469},
  "Greece": {"Lat":38.9953683, "Long":21.9877132},
  "Gibraltar": {"Lat":36.106747, "Long":-5.3352772},
  "Hungary": {"Lat":47.1817585, "Long":19.5060937},
  "Iceland": {"Lat":64.9841821, "Long":-18.1059013},
  "Ireland": {"Lat":52.865196, "Long":-7.9794599},
  "Italy": {"Lat":42.6384261, "Long":12.674297},
  "Latvia": {"Lat":56.8406494, "Long":24.7537645},
  "Liechtenstein": {"Lat":47.1416307, "Long":9.5531527},
  "Lithuania": {"Lat":55.3500003, "Long":23.7499997},
  "Luxembourg": {"Lat":49.8158683, "Long":6.1296751},
  "Monaco": {"Lat":43.7384402, "Long":7.4242474},
  "Montenegro": {"Lat":42.9868853, "Long":19.5180992},
  "Netherlands": {"Lat":52.5001698, "Long":5.7480821},
  "North Macedonia": {"Lat":41.512351989746094, "Long":21.751619338989258},
  "Jersey": {"Lat":49.2123066, "Long":-2.1256},
  "Norway": {"Lat":60.5000209, "Long":9.0999715},
  "Poland": {"Lat":52.215933, "Long":19.134422},
  "Portugal": {"Lat":40.0332629, "Long":-7.8896263},
  "Romania": {"Lat":45.9852129, "Long":24.6859225},
  "Russia": {"Lat":55.76158905029297, "Long":37.609458923339844},
  "San Marino": {"Lat":43.9458623, "Long":12.458306},
  "Spain": {"Lat":40, "Long":-3.25},
  "Kosovo": {"Lat":42.5869578, "Long":20.9021231},
  "Sweden": {"Lat":59.6749712, "Long":14.5208584},
  "Switzerland": {"Lat":46.7985624, "Long":8.2319736},
  "Ukraine": {"Lat":49.4871968, "Long":31.2718321},
  "Moldova": {"Lat":47.2879608, "Long":28.5670941},
  "Bulgaria": {"Lat":42.6073975, "Long":25.4856617},
  "Ireland": {"Lat":52.865196, "Long":-7.9794599},
  "Malta": {"Lat":35.8885993, "Long":14.4476911},
  "Holy See": {"Lat":41.9038149, "Long":12.4531527},
  "Slovakia": {"Lat":48.7411522, "Long":19.4528646},
  "Serbia": {"Lat":44.0243228, "Long":21.0765743},
  "Slovenia": {"Lat":45.8133113, "Long":14.4808369},
  "Bosnia and Herzegovina": {"Lat":44.3053476, "Long":17.5961467},
  "Turkey": {"Lat":38.9597594, "Long":34.9249653},
  "United Kingdom": {"Lat":54.7023545, "Long":-3.2765753}
}
const languages = {
  'en': {
    confirmed:'confirmed',
    deaths:'deaths'
  },
  'sv':{
    confirmed:'bekräftade'
  }
}

function getHashValue(key) {
  let matches = location.hash.match(new RegExp(key+'=([^&]*)'));
  return matches ? matches[1] : null;
}

const l = getHashValue('l') ? getHashValue('l') : 'en';
const type = getHashValue('type') ? getHashValue('type') : 'confirmed';

const multiplier = (type === 'confirmed') ? 5 : 9; 

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
    // https://raw.githubusercontent.com/CSSEGISandData/COVID-19/master/csse_covid_19_data/csse_covid_19_time_series/time_series_19-covid-Confirmed.csv
    axios.get('./data/data.json', {
    })
    .then((response) => {
      this.setState((state, props) => ({
        confirmed:response.data.confirmed,
        deaths:response.data.deaths,
        dates:_.keys(response.data[type]['Finland']).filter((value, index, arr) => {
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

      g.selectAll('circle').data(Object.keys(this.state[type]).map(i => this.state[type][i]))
        .enter()
        .append('circle')
        .attr('cx', (d, i) => {
          return projection([countryCenters[d.Country].Long, countryCenters[d.Country].Lat])[0];
        })
        .attr('cy', (d, i) => {
          return projection([countryCenters[d.Country].Long, countryCenters[d.Country].Lat])[1];
        })
        .attr('r', (d, i) => {
          return 0;
        })
        .attr('class', style.circle)
        .style('fill', 'rgba(255, 82, 51, 0.75)');

      g.selectAll('text').data(Object.keys(this.state[type]).map(i => this.state[type][i]))
        .enter()
        .append('text')
        .attr('text-anchor', 'middle')
        .attr('alignment-baseline', 'central')
        .attr('class', style.number)
        .attr('x', (d, i) => {
          return projection([countryCenters[d.Country].Long, countryCenters[d.Country].Lat])[0] + 0.3;
        })
        .attr('y', (d, i) => {
          return projection([countryCenters[d.Country].Long, countryCenters[d.Country].Lat])[1] + 1;
        })
        .html('')
      let date = this.state.dates[this.state.year_month_idx].split('/');
      this.text = svg.append('text')
        .attr('alignment-baseline', 'top')
        .attr('class', style.text)
        .attr('text-anchor', 'middle')
        .attr('x', '50%')
        .attr('y', '95%')
        .html('' + date[1] + '.' + date[0] + '.' + date[2] + '20, 0 ' + languages[l][type]);
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
        return Math.log2(Math.sqrt(d[this.state.dates[this.state.year_month_idx]] / Math.PI) + 1) * multiplier;
      });
    g.selectAll('text')
      .style('font-size', (d, i) => {
        return (Math.log2(Math.sqrt(d[this.state.dates[this.state.year_month_idx]] / Math.PI) + 1) * multiplier) + 'px';
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
    if (this.state[type][country] !== undefined) {
      if (this.state[type][country][this.state.dates[this.state.year_month_idx]] > 0) {
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
      if (this.state.dates[this.state.year_month_idx]) {
        let datetime = this.state.dates[this.state.year_month_idx].split(' ');
        let date = datetime[0].split('/');
        let time = datetime[1];
        this.text.html('' + date[1] + '.' + date[0] + '.' + date[2] + '20, ' + this.state.total_cases + ' ' + languages[l][type]);
      }
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
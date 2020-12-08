import React, {Component} from 'react'
import style from './../styles/styles.less';

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

const languages = {
  'en': {
    confirmed:'confirmed',
    deaths:'deaths'
  },
  'sv':{
    confirmed:'bekräftade'
  }
}
let interval, g, path;
const projection = d3.geoAzimuthalEquidistant().center([33,57]).scale(800);

// https://www.gps-coordinates.net/
const areaInfo = {
  "Albania": {"population":2877797,"Lat":41.000028,"Long":19.9999619,"abbr":"AL"},"Andorra": {"population":77265,"Lat":42.5407167,"Long":1.5732033,"abbr":"AD"},"Armenia": {"population":2965652,"Lat":40.7696272,"Long":44.6736646,"abbr":"AM"},"Austria": {"population":9006398,"Lat":47.2000338,"Long":13.199959,"abbr":"AT"},"Azerbaijan": {"population":10139177,"Lat":40.3936294,"Long":47.7872508,"abbr":"AZ"},"Belarus": {"population":9449323,"Lat":53.4250605,"Long":27.6971358,"abbr":"BY"},"Belgium": {"population":11589623,"Lat":50.6402809,"Long":4.6667145,"abbr":"BE"},"Bosnia and Herzegovina": {"population":3280819,"Lat":44.3053476,"Long":17.5961467,"abbr":"BA"},"Bulgaria": {"population":6948445,"Lat":42.6073975,"Long":25.4856617,"abbr":"BG"},"Croatia": {"population":4105267,"Lat":45.5643442,"Long":17.0118954,"abbr":"HR"},"Cyprus": {"population":1207359,"Lat":34.9823018,"Long":33.1451285,"abbr":"CY"},"Czechia": {"population":10708981,"Lat":49.8167003,"Long":15.4749544,"abbr":"CZ"},"Denmark": {"population":5792202,"Lat":55.670249,"Long":10.3333283,"abbr":"DK"},"Estonia": {"population":1326535,"Lat":58.7523778,"Long":25.3319078,"abbr":"EE"},"Finland": {"population":5540720,"Lat":63.2467777,"Long":25.9209164,"abbr":"FI"},"France": {"population":65273511,"Lat":46.603354,"Long":1.8883335,"abbr":"FR"},"Georgia": {"population":3985826,"Lat":42,"Long":44.0287382,"abbr":"GE"},"Germany": {"population":83783942,"Lat":51.0834196,"Long":10.4234469,"abbr":"DE"},"Greece": {"population":10423054,"Lat":38.9953683,"Long":21.9877132,"abbr":"GR"},"Holy See": {"population":801,"Lat":41.9038149,"Long":12.4531527,"abbr":"VA"},"Hungary": {"population":9660351,"Lat":47.1817585,"Long":19.5060937,"abbr":"HU"},"Iceland": {"population":341243,"Lat":64.9841821,"Long":-18.1059013,"abbr":"IS"},"Ireland": {"population":4937786,"Lat":52.865196,"Long":-7.9794599,"abbr":"IE"},"Italy": {"population":60461826,"Lat":42.6384261,"Long":12.674297,"abbr":"IT"},"Kosovo": {"population":1870981,"Lat":42.5869578,"Long":20.9021231,"abbr":"XK"},"Latvia": {"population":1886198,"Lat":56.8406494,"Long":24.7537645,"abbr":"LV"},"Liechtenstein": {"population":38128,"Lat":47.1416307,"Long":9.5531527,"abbr":"LI"},"Lithuania": {"population":2722289,"Lat":55.3500003,"Long":23.7499997,"abbr":"LT"},"Luxembourg": {"population":625978,"Lat":49.8158683,"Long":6.1296751,"abbr":"LU"},"Malta": {"population":441543,"Lat":35.8885993,"Long":14.4476911,"abbr":"MT"},"Moldova": {"population":4033963,"Lat":47.2879608,"Long":28.5670941,"abbr":"MD"},"Monaco": {"population":39242,"Lat":43.7384402,"Long":7.4242474,"abbr":"MC"},"Montenegro": {"population":628066,"Lat":42.9868853,"Long":19.5180992,"abbr":"ME"},"Netherlands": {"population":17134872,"Lat":52.5001698,"Long":5.7480821,"abbr":"NL"},"North Macedonia": {"population":2083374,"Lat":41.512351989746094,"Long":21.751619338989258,"abbr":"MK"},"Norway": {"population":5421241,"Lat":60.5000209,"Long":9.0999715,"abbr":"NO"},"Poland": {"population":37846611,"Lat":52.215933,"Long":19.134422,"abbr":"PL"},"Portugal": {"population":10196709,"Lat":40.0332629,"Long":-7.8896263,"abbr":"PT"},"Romania": {"population":19237691,"Lat":45.9852129,"Long":24.6859225,"abbr":"RO"},"Russia": {"population":145934462,"Lat":55.76158905029297,"Long":37.609458923339844,"abbr":"RU"},"San Marino": {"population":33931,"Lat":43.9458623,"Long":12.458306,"abbr":"SM"},"Serbia": {"population":8737371,"Lat":44.0243228,"Long":21.0765743,"abbr":"RS"},"Slovakia": {"population":5459642,"Lat":48.7411522,"Long":19.4528646,"abbr":"SK"},"Slovenia": {"population":2078938,"Lat":45.8133113,"Long":14.4808369,"abbr":"SI"},"Spain": {"population":46754778,"Lat":40,"Long":-3.25,"abbr":"ES"},"Sweden": {"population":10099265,"Lat":59.6749712,"Long":14.5208584,"abbr":"SE"},"Switzerland": {"population":8654622,"Lat":46.7985624,"Long":8.2319736,"abbr":"CH"},"Turkey": {"population":84730672,"Lat":38.9597594,"Long":34.9249653,"abbr":"TR"},"Ukraine": {"population":43733762,"Lat":49.4871968,"Long":31.2718321,"abbr":"UA"},"United Kingdom": {"population":67886011,"Lat":54.7023545,"Long":-3.2765753,"abbr":"GB"}
}

function getHashValue(key) {
  let matches = location.hash.match(new RegExp(key+'=([^&]*)'));
  return matches ? matches[1] : null;
}

const l = getHashValue('l') ? getHashValue('l') : 'en';
const type = getHashValue('type') ? getHashValue('type') : 'deaths';

const multiplier = (type === 'confirmed') ? 4 : 4; 

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
    d3.json('./data/data.json').then((data) => {
      this.setState((state, props) => ({
        confirmed:data.confirmed,
        deaths:data.deaths,
        dates:_.keys(data[type]['Albania']).filter((value, index, arr) => {
          return !(value === 'Province_State');
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
          return this.getAreaColor(d.properties.name);
        });

      let data = Object.keys(this.state[type]).map(i => this.state[type][i]);

      g.selectAll('circle').data(data)
        .enter()
        .append('circle')
        .attr('cx', (d, i) => {
          return projection([areaInfo[d.Province_State].Long, areaInfo[d.Province_State].Lat])[0];
        })
        .attr('cy', (d, i) => {
          return projection([areaInfo[d.Province_State].Long, areaInfo[d.Province_State].Lat])[1];
        })
        .attr('r', (d, i) => {
          return 0;
        })
        .attr('class', style.circle)
        .style('fill', 'rgba(255, 82, 51, 0.75)');

      g.selectAll('text').data(data)
        .enter()
        .append('text')
        .attr('text-anchor', 'middle')
        .attr('alignment-baseline', 'central')
        .attr('class', style.number)
        .attr('x', (d, i) => {
          return projection([areaInfo[d.Province_State].Long, areaInfo[d.Province_State].Lat])[0] + 0.3;
        })
        .attr('y', (d, i) => {
          return projection([areaInfo[d.Province_State].Long, areaInfo[d.Province_State].Lat])[1] + 1;
        })
        .html('')
      let date = this.state.dates[this.state.year_month_idx].split('/');
      this.text = svg.append('text')
        .attr('alignment-baseline', 'top')
        .attr('class', style.text)
        .attr('text-anchor', 'middle')
        .attr('x', '50%')
        .attr('y', '95%')
        // .html('' + date[1] + '.' + date[0] + '.' + date[2] + '20, 0 ' + languages[l][type]);
        .html('' + date[1] + '.' + date[0] + '.' + date[2] + '20');
    });
    setTimeout(() => {
      this.createInterval();
    }, 1000);
  }
  changeAreaAttributes() {
    // Change fill color.
    g.selectAll('path')
      .attr('fill', (d, i) => {
        return this.getAreaColor(d.properties.name);
      });
    g.selectAll('circle')
      .attr('r', (d, i) => {
        this.setState((state, props) => ({
          total_cases:state.total_cases + parseInt(d[this.state.dates[this.state.year_month_idx]] / 14)
        }));
        // Math.log2(Math.sqrt(d[this.state.dates[this.state.year_month_idx]] / Math.PI) + 1) * multiplier;
        return Math.max(Math.sqrt(parseInt(d[this.state.dates[this.state.year_month_idx]] / areaInfo[d.Province_State].population * 100000)) * 5, 0);
      });
    g.selectAll('text')
      .style('font-size', (d, i) => {
        return Math.max(Math.sqrt(parseInt(d[this.state.dates[this.state.year_month_idx]] / areaInfo[d.Province_State].population * 100000)) * 4, 0) + 'px';
      })
      .html((d, i) => {
        if (d[this.state.dates[this.state.year_month_idx]] > 0) {
          return areaInfo[d.Province_State].abbr;
        }
        else {
          return '';
        }
      });
  }
  getAreaColor(area) {
    return '#e5e5e5';
    if (this.state[type][area] !== undefined) {
      if (this.state[type][area][this.state.dates[this.state.year_month_idx]] > 0) {
        return '#808080';
      }
      else {
        return '#e5e5e5';
      }
    }
    else {
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
    }), this.changeAreaAttributes);
  }
  onAfterSliderChange(value) {
  }
  componentWillUnMount() {
    clearInterval(interval);
  }
  createInterval() {
    this.changeAreaAttributes();
    interval = setInterval(() => {
      this.setState((state, props) => ({
        total_cases:0,
        year_month_idx:this.state.year_month_idx + 1
      }), this.changeAreaAttributes);
      if (this.state.year_month_idx >= (this.state.dates.length - 1)) {
        clearInterval(interval);
        setTimeout(() => {
          this.setState((state, props) => ({
            total_cases:0,
            year_month_idx:0
          }), this.createInterval);
        }, 2000);
      }
    }, 500);
  }
  render() {
    if (this.text) {
      if (this.state.dates[this.state.year_month_idx]) {
        let datetime = this.state.dates[this.state.year_month_idx].split(' ');
        let date = datetime[0].split('/');
        let time = datetime[1];
        // this.text.html('' + date[1] + '.' + date[0] + '.' + date[2] + '20, ' + this.state.total_cases + ' ' + languages[l][type]);
        this.text.html('' + date[1] + '.' + date[0] + '.' + date[2] + '20');
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
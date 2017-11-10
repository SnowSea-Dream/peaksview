import React from 'react'
import PropTypes from 'prop-types'

// Import Components
import { Row, Col, Button } from 'antd'
import cuid from 'cuid'
import haversine from 'haversine'
import axios from 'axios'
import 'antd/dist/antd.css'

import { TargetList, MapView } from './components'

// Import Styles
import './GeoTarget.css'

const MILE = 1609.34
class GeoTarget extends React.Component {
  constructor(props) {
    super(props)

    this.state = {
      data: this.getInitialData(props.initData) || [],
      center: props.center || { lat: 47.75, lng: -120.74 },
      isDropping: false,
      clicked: null,
      isMapLoaded: false,
      map: null,
      heatmap: false,
    }
  }

  componentWillReceiveProps({ initData }) {
    if (initData !== this.props.initData) {
      this.setState({data: this.getInitialData(initData)})
    }
  }

  onMapLoaded = (ref) => {
    this.setState({ isMapLoaded: true, map: ref })
  }

  loadCityOutline = (city) => {
    return axios.get(`http://nominatim.openstreetmap.org/search.php?q=${city}&polygon_geojson=1&format=json&limit=1`)
    .then(function (response) {
      if (response.status === 200) {
        let polygon = null

        const type = response.data[0].geojson.type
        if (type === 'Polygon') {
          polygon = [response.data[0].geojson.coordinates]
        } else if (type === 'MultiPolygon') {
          polygon = response.data[0].geojson.coordinates
        } else if (type === 'Point') {
          const box = response.data[0].boundingbox.map(e => parseFloat(e))
          polygon = [[
            [
              [box[2], box[0]],
              [box[2], box[1]],
              [box[3], box[1]],
              [box[3], box[0]],
            ],
          ]]
        }

        return polygon.map(p => (
          p[0].map(e => ({
            lng: e[0],
            lat: e[1],
          }))
        ))
      } else {
        console.log('Error')
      }
    })
    .catch(function (error) {
      console.log(error);
    });
  }

  onPlacesChanged = (places) => {
    if (places.length === 0) {
      console.log('No Place')
      return
    }

    let target = null
    let data = this.state.data.slice()
    if (places.length === 1) {
      const place = places[0]
      if (!(place.formatted_address.match(/United States$/g) || place.formatted_address.match(/USA$/g))) {
        return
      }

      if (data.findIndex(e => e.name === place.name) !== -1) return

      this.setState({ center: place.geometry.location })
      if (place.types.includes('locality') || place.types.includes('postal_code')) { // City
        this.loadCityOutline(place.formatted_address).then((path) => {
          target = {
            id: cuid(),
            type: 'city',
            name: place.name,
            center: place.geometry.location.toJSON(),
            path,
            isInclude: true,
          }
          data = this.state.data.slice()
          data.unshift(target)
          this.setState({ data })

          this.notifyChange(data)
        })
      } else { // Address
        target = {
          id: cuid(),
          type: 'address',
          name: place.name,
          center: place.geometry.location.toJSON(),
          radius: 10,
          isInclude: true,
        }
      }
    } else { // Places
      target = {
        id: cuid(),
        type: 'places',
        isInclude: true,
      }
      const subTargets = []
      const center = {
        latitude: typeof this.state.center.lat === 'function' ? this.state.center.lat() : this.state.center.lat,
        longitude: typeof this.state.center.lng === 'function' ? this.state.center.lng() : this.state.center.lng,
      }
      for (let i = 0; i < places.length; i += 1) {
        if (!(places[i].formatted_address.match(/United States$/g) || places[i].formatted_address.match(/USA$/g))) {
          break;
        }

        const pos = {
          latitude: places[i].geometry.location.lat(),
          longitude: places[i].geometry.location.lng(),
        }
        
        if (haversine(center, pos, { unit: 'mile' }) <= this.props.maxPlaceRadius) {
          const subTarget = {
            id: cuid(),
            parent: target.id,
            type: 'place',
            name: places[i].name,
            center: places[i].geometry.location.toJSON(),
            radius: 2,
            isDeactive: true,
            isInclude: false,
          }
          subTargets.push(subTarget)
        }
      }

      if (subTargets.length) {
        target.targets = subTargets
        target.name = places[0].name
      } else {
        target = null
      }
    }

    if (target) {
      data.unshift(target)
      this.setState({ data })
      if (!target.targets) this.notifyChange(data)
    }
  }

  getBounds = (center) => {
    if (this.state.isMapLoaded) {
      const circle = new window.google.maps.Circle({
        center,
        radius: MILE * this.props.maxPlaceRadius,
      })

      return circle.getBounds()
    }
    return null
  }

  changeCenter = (center) => {
    this.setState({ center })
  }

  showBox = (target) => {
    if (target.isDeactive === true) {
      const data = this.state.data.slice()
      const t = target
      t.isDeactive = false
      t.isInclude = true
      this.setState({ data })
      this.notifyChange(data)
    } else {
      this.setState({ clicked: target })
    }
  }

  closeBox = () => {
    this.setState({ clicked: null })
  }

  toggleContain = (target) => {
    const data = this.state.data.slice()
    const t = target
    t.isInclude = !t.isInclude
    this.setState({ data })

    this.notifyChange(data)
  }

  removeTarget = (target) => {
    const data = this.state.data.slice()
    if (target.type === 'place') {
      const parent = data.find(e => e.id === target.parent)
      const index = parent.targets.findIndex(e => e.id === target.id)
      parent.targets.splice(index, 1)
      if (!parent.targets.length) {
        const i = data.findIndex(e => e.id === target.parent)
        data.splice(i, 1)
      }
    } else {
      const index = data.findIndex(e => e.id === target.id)
      data.splice(index, 1)
    }

    if (this.state.clicked) {
      if (target.type === 'places') {
        if (target.targets.findIndex(e => e.id === this.state.clicked.id) !== -1) {
          this.setState({ clicked: null })
        }
      } else {
        if (target.id === this.state.clicked.id) {
          this.setState({ clicked: null })
        }
      }
    }

    this.setState({ data })

    this.notifyChange(data)
  }

  dropPin = (pin) => {
    const target = {
      id: cuid(),
      type: 'pin',
      center: pin.latLng.toJSON(),
      radius: 10,
      isInclude: true,
    }

    const data = this.state.data.slice()
    data.unshift(target)
    this.setState({ data, isDropping: false })

    this.notifyChange(data)
  }

  changeRadius = (target, value) => {
    const data = this.state.data.slice()
    const t = target
    t.radius = value
    this.setState({ data })

    this.notifyChange(data)
  }

  dragPin = (target, pin) => {
    const data = this.state.data.slice()
    const t = data.find(e => e.id === target.id)
    t.center = pin.latLng.toJSON()
    this.setState({ data })

    this.notifyChange(data)
  }

  toggleDropping = () => {
    this.setState({ isDropping: !this.state.isDropping })
  }

  toggleHeatmap = () => {
    this.setState({ heatmap: !this.state.heatmap })
  }

  getInitialData = (initData) => {
    if (!initData) return null
    return [...this._getInitialData(initData.include, true), ...this._getInitialData(initData.exclude, false)]
  }

  _getInitialData = (initData, isInclude) => {
    if (!initData) return []

    const data = initData.map(e => {
      if (e.type === 'CIRCLE') {
        return {
          id: e.id,
          type: e.name ? 'address' : 'pin',
          center: { lat: e.geometry[0], lng: e.geometry[1] },
          name: e.name,
          radius: e.radius,
          isInclude,
        }
      } else {
        const path = e.geometry.map(path => {
          return path.map( p => ({lat: p[0], lng: p[1]}) )
        })
        return {
          id: e.id,
          type: 'city',
          path,
          name: e.name,
          isInclude,
        }
      }
    })

    return data
  }

  notifyChange = (data) => {
    const result = {
      include: [],
      exclude: [],
    }

    data.forEach(e => {
      if (e.type === 'places') {
        e.targets.forEach(s => {
          if (s.isDeactive) return
          const target = {
            id: s.id,
            type: 'CIRCLE',
            name: s.name,
            geometry: [s.center.lat, s.center.lng],
            radius: s.radius,
          }
          result[s.isInclude  ? 'include' : 'exclude'].push(target)
        })
      } else {
        let geometry = null
        let type = ''
        if (e.type === 'address' || e.type === 'pin') {
          geometry = [ e.center.lat, e.center.lng ]
          type = 'CIRCLE'
        } else {
          geometry = e.path.map(path => {
            return path.map( p => ([p.lat, p.lng]) )
          })

          type = 'POLYLINE'
        }
        const target = {
          id: e.id,
          type,
          name: e.name,
          geometry,
          radius: e.radius,
        }
        
        result[e.isInclude ? 'include' : 'exclude'].push(target)
      }
    })

    this.props.onChange(result)
  }

  render() {
    const boxProps = {
      toggleContain: this.toggleContain,
      removeTarget: this.removeTarget,
      changeRadius: this.changeRadius,
    }

    const googleMapURL = `https://maps.googleapis.com/maps/api/js?v=3.exp&key=${this.props.apiKey}&libraries=visualization,places`
    return (
      <div className="geotarget">
        <Row style={{ height: '100%' }}>
          <Col span={6} style={{ height: '100%' }}>
            <TargetList
              googleMapURL={googleMapURL}
              bounds={this.getBounds(this.state.center)}
              targets={this.state.data}
              onPlacesChanged={this.onPlacesChanged}
              {...boxProps}
            />
          </Col>
          <Col span={18} style={{ height: '100%' }}>
            <div className="heatmap">
              <Button
                type={this.state.heatmap ? 'primary' : 'dashed'}
                icon={this.state.heatmap ? 'check' : 'close'}
                onClick={this.toggleHeatmap}
              >
                HeatMap
              </Button>
            </div>
            <div className="droppin">
              <Button
                type={this.state.isDropping ? 'primary' : 'dashed'}
                icon={this.state.isDropping ? 'check' : 'close'}
                onClick={this.toggleDropping}
              >
                Drop Pin
              </Button>
            </div>
            <MapView
              googleMapURL={googleMapURL}
              center={this.state.center}
              changeCenter={this.changeCenter}
              clicked={this.state.clicked}
              targets={this.state.data}
              heatmap={this.state.heatmap}
              showBox={this.showBox}
              closeBox={this.closeBox}
              isDropping={this.state.isDropping}
              dropPin={this.dropPin}
              dragPin={this.dragPin}
              onMapLoaded={this.onMapLoaded}
              {...boxProps}
            />
          </Col>
        </Row>
      </div>
    )
  }
}

GeoTarget.propTypes = {
  apiKey: PropTypes.string.isRequired,
  maxPlaceRadius: PropTypes.number,
  onChange: PropTypes.func,
  initData: PropTypes.array,
  center: PropTypes.object,
}

GeoTarget.defaultProps = {
  maxPlaceRadius: 20,
  onChange: () => {},
}

export default GeoTarget

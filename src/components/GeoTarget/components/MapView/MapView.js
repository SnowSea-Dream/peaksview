import React from 'react'
import PropTypes from 'prop-types'

// Import Components
import {
  GoogleMap,
  Marker,
  Circle,
  Polygon,
  OverlayView,
} from 'react-google-maps'

import TargetBox from '../TargetBox'

const MILE = 1609.34

class MapView extends React.Component {
  constructor(props) {
    super(props)

    this.state = {
      zoom: 10,
      currentTarget: {}, // Hover
      editing: false,
    }
  }

  componentWillReceiveProps({heatmap}) {
    if (heatmap !== this.props.heatmap) {
      if (heatmap) {
        this.showPopMap()
      } else {
        this.hidePopMap()
      }
    }
  }

  createPopLayer = () => {
    const styles = []
    for (let x = 0; x < 15; x++) {
      styles.push({
        where: `density > ${50 * x} AND density < ${50 * (x + 1)}`,
        polygonOptions: {
          fillOpacity: 0.7 * x
        }
      })
    }

    this.popLayer = new window.google.maps.FusionTablesLayer({
      query: {
        select: 'geometry, density',
        from: '1HeWKW3QlC3l1cPBVQNJLNhSHssgn8j1rxk7HHl1Q'
      },
      styles: [{
        polygonOptions: {
          fillColor: '#FF0000',
        }
      },
      ...styles,
      ]
    })
  }

  showPopMap = () => {
    this.popLayer.setMap(this.map)
  }

  hidePopMap = () => {
    this.popLayer.setMap(null)
  }

  onZoomChanged = () => {
    this.setState({ zoom: this.map.zoom })
  }

  onCircleOver = (target) => {
    if (this.state.currentTarget.id !== target.id) {
      this.setState({ currentTarget: target })
    }
  }

  onCircleOut = (target) => {
    if (this.state.currentTarget.id === target.id) {
      this.setState({ currentTarget: {} })
    }
  }

  onClick = (pin) => {
    if (!this.state.editing) {
      if (this.props.isDropping) {
        this.props.dropPin(pin)
      } else {
        this.props.closeBox()
      }
    }
  }

  onBoxOver = () => {
    this.setState({ editing: true })
  }

  onBoxOut = () => {
    this.setState({ editing: false })
  }

  onRemoveTarget = (target) => {
    this.onBoxOut()
    this.props.removeTarget(target)
  }

  getLocation = (target) => {
    return target.center
  }

  onMapLoaded = (ref) => {
    this.map = ref.context.__SECRET_MAP_DO_NOT_USE_OR_YOU_WILL_BE_FIRED
    this.createPopLayer()

    this.props.onMapLoaded(ref)
  }

  render() {
    const { targets, center, clicked, isDropping, 
      changeCenter, showBox, toggleContain, changeRadius, dragPin } = this.props
    const includeOption = { fillColor: '#2ecc71', fillOpacity: 0.2, strokeWeight: 2, strokeColor: '#27ae60' }
    const excludeOption = { fillColor: '#e74c3c', fillOpacity: 0.2, strokeWeight: 2, strokeColor: '#c0392b' }
    const deactiveOption = { fillColor: '#000', fillOpacity: 0.2, strokeWeight: 2, strokeColor: '#333' }

    const renderTargets = targets.map((e) => {
      if (e.type === 'address' || e.type === 'pin') {
        const fillOpacity = this.state.currentTarget.id === e.id ? 0.4 : 0.2
        return (
          <div key={e.id}>
            <Marker position={e.center} draggable={e.type === 'pin'} onDragEnd={pin => dragPin(e, pin)} />
            <Circle
              center={e.center} radius={e.radius * MILE}
              options={e.isInclude ?
                { ...includeOption, fillOpacity } :
                { ...excludeOption, fillOpacity }}
              onMouseOver={() => { this.onCircleOver(e) }}
              onMouseOut={() => { this.onCircleOut(e) }}
              onMouseUp={() => { showBox(e) }}
            />
          </div>
        )
      } else if (e.type === 'places') {
        return e.targets.map((s) => {
          const fillOpacity = this.state.currentTarget.id === s.id ? 0.4 : 0.2
          return (
            <div key={s.id}>
              <div>
                <Marker position={s.center} />
                <Circle
                  center={s.center} radius={s.radius * MILE}
                  options={s.isDeactive ?
                    { ...deactiveOption, fillOpacity } :
                    (s.isInclude ?
                      { ...includeOption, fillOpacity } :
                      { ...excludeOption, fillOpacity })}
                  onMouseOver={() => { this.onCircleOver(s) }}
                  onMouseOut={() => { this.onCircleOut(s) }}
                  onMouseUp={() => { showBox(s) }}
                />
              </div>
            </div>
          )
        })
      } else if (e.type === 'city') {
        const fillOpacity = this.state.currentTarget.id === e.id ? 0.4 : 0.2
        return (
          <div key={e.id}>
            {/* <Marker position={e.center} /> */}
            <Polygon
              options={e.isInclude ?
                  { ...includeOption, fillOpacity } :
                  { ...excludeOption, fillOpacity }}
              onMouseOver={() => { this.onCircleOver(e) }}
              onMouseOut={() => { this.onCircleOut(e) }}
              onMouseUp={() => { showBox(e) }}
              paths={e.path}
            />
          </div>
        )
      } else {
        return null
      }
    })

    return (
      <GoogleMap
        zoom={this.state.zoom}
        onZoomChanged={this.onZoomChanged}
        onCenterChanged={() => changeCenter(this.map.center)}
        onClick={this.onClick}
        center={center}
        ref={this.onMapLoaded}
        options={{ draggableCursor: isDropping ? 'crosshair' : '', disableDefaultUI: true }}
      >
        { renderTargets }
        { clicked && (
          <OverlayView
            position={clicked.center}
            mapPaneName={OverlayView.OVERLAY_MOUSE_TARGET}
            getPixelPositionOffset={width => ({
              x: -(width / 2),
              y: 0,
            })}
          >
            <TargetBox
              target={clicked}
              toggleContain={toggleContain}
              changeRadius={changeRadius}
              removeTarget={this.onRemoveTarget}
              onMouseOver={this.onBoxOver}
              onMouseOut={this.onBoxOut}
            />
          </OverlayView>
        ) }
      </GoogleMap>
    )
  }
}

MapView.propTypes = {
  center: PropTypes.object,
  targets: PropTypes.array,
  isDropping: PropTypes.bool,
  toggleContain: PropTypes.func,
  changeRadius: PropTypes.func,
  removeTarget: PropTypes.func,
  dropPin: PropTypes.func,
  closeBox: PropTypes.func,
}

export default MapView

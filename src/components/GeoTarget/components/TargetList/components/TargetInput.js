import React from 'react'
import PropTypes from 'prop-types'

// Import Components
import { compose, withProps, lifecycle } from 'recompose'
import { withScriptjs } from 'react-google-maps'
import StandaloneSearchBox from 'react-google-maps/lib/components/places/StandaloneSearchBox'

// Import Styles
import './TargetInput.css'

const TargetInput = compose(
  withProps({
    loadingElement: <div style={{ height: '100%' }} />,
    containerElement: <div style={{ height: '400px' }} />,
  }),
  lifecycle({
    componentWillMount() {
      const refs = {}

      this.setState({
        places: [],
        onSearchBoxMounted: (ref) => {
          refs.searchBox = ref
        },
        onPlacesChanged: () => {
          const places = refs.searchBox.getPlaces()

          this.setState({
            places,
          })

          this.props.onPlacesChanged(places)
        },
      })
    },
  }),
  withScriptjs,
)(props => (
  <div data-standalone-searchbox="">
    <StandaloneSearchBox
      ref={props.onSearchBoxMounted}
      bounds={props.bounds}
      onPlacesChanged={props.onPlacesChanged}
    >
      <input type="text" placeholder="Enter a city, address or place" className="target-input" />
    </StandaloneSearchBox>
  </div>
))

TargetInput.propTypes = {
  googleMapURL: PropTypes.string.isRequired,
  onPlacesChanged: PropTypes.func.isRequired,
}

export default TargetInput

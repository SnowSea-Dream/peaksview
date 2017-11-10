import React from 'react'

// Import Utils
import { compose, withProps } from 'recompose'
import {
  withScriptjs,
  withGoogleMap,
} from 'react-google-maps'

// Import View
import MapView from './MapView'

export default compose(
  withProps({
    loadingElement: <div style={{ height: '100%' }} />,
    containerElement: <div style={{ height: '100vh' }} />,
    mapElement: <div style={{ height: '100%' }} />,
  }),
  withScriptjs,
  withGoogleMap,
)(MapView)

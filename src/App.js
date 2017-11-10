import React, { Component } from 'react'

import './App.css'
import GeoTarget from './components/GeoTarget'

const initData = {
  include: [
    {
      id: "cj99ozdew00003c5vrsf4o285",
      radius: 10,
      geometry: [47.930146201090984, -120.4764175415039],
      type: 'CIRCLE'
    }
  ],
}

class App extends Component {
  
  render() {
    return (
      <div className="App">
        <GeoTarget
          center={{ lat: 47.75, lng: -130.74 }}
          initData={initData}
          onChange={data => {console.log(data)}}
          apiKey={'AIzaSyAmjP0h8n7SnIohdlZwOf0CU1Iph7OqwDY'}
          maxPlaceRadius={20} />
      </div>
    );
  }
}

export default App

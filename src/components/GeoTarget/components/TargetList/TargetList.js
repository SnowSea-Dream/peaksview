import React from 'react'
import PropTypes from 'prop-types'

// Import Components
import { Row, Col } from 'antd'
import TargetBox from '../TargetBox'
import TargetInput from './components/TargetInput'

// Import Styles
import './TargetList.css'

const TargetList = ({ googleMapURL, bounds, targets, onPlacesChanged, ...boxProps }) => {
  const renderTargets = targets.map(e => (
    <div key={e.id}>
      <TargetBox target={e} {...boxProps} />
    </div>
  ))

  return (
    <div className="target-list">
      <Row gutter={8}>
        <Col span={24}>
          <div style={{ padding: '5px' }}>
            <TargetInput
              bounds={bounds} onPlacesChanged={onPlacesChanged}
              googleMapURL={googleMapURL}
            />
          </div>
        </Col>
      </Row>
      <Row gutter={8}>
        <Col span={24}>
          <div style={{ padding: '5px' }}>
            { renderTargets }
          </div>
        </Col>
      </Row>
    </div>
  )
}

TargetList.propTypes = {
  targets: PropTypes.array,
  onPlacesChanged: PropTypes.func.isRequired,
  toggleContain: PropTypes.func,
  changeRadius: PropTypes.func,
  removeTarget: PropTypes.func,
}

export default TargetList

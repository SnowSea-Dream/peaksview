import React from 'react'
import PropTypes from 'prop-types'

// Import Components
import { Row, Col, Dropdown, Menu, Button, Icon, Slider, InputNumber } from 'antd'

// Import Styles
import './TargetBox.css'

class TargetBox extends React.Component {
  constructor(props) {
    super(props)

    this.state = {
      showRadiusMenu: false,
    }
  }

  onRadiusMenuVisible = (flag) => {
    this.setState({ showRadiusMenu: flag });
  }

  onContainMenu = (e) => {
    if (e.key === 'contain') {
      this.props.toggleContain(this.props.target)
    }
  }

  onRemove = () => {
    this.props.removeTarget(this.props.target)
  }

  render() {
    const target = this.props.target

    const containMenu = (
      <Menu onClick={this.onContainMenu}>
        <Menu.Item key="contain">
          { target.isInclude ? 'Exclude' : 'Include' }
        </Menu.Item>
      </Menu>
    )

    const radiusMenu = (
      <Menu>
        <Menu.Item>
          <Row>
            <Col span={24}>
              <InputNumber
                size={'xs'}
                min={2} max={100}
                value={target.radius} onChange={value => this.props.changeRadius(target, value)}
              />
            </Col>
            <Col span={24}>
              <Slider
                min={2} max={100}
                value={target.radius} onChange={value => this.props.changeRadius(target, value)}
              />
            </Col>
          </Row>
        </Menu.Item>
      </Menu>
    )

    let name = target.name
    if (!name) {
      name = `(${target.center.lat.toFixed(2)}, ${target.center.lng.toFixed(2)})`
    }

    return (
      <div
        className={ `target-box ${target.isInclude ? 'include' : 'exclude'}` }
        onMouseOver={this.props.onMouseOver} onMouseOut={this.props.onMouseOut}
      >
        <Row type="flex" justify="end" gutter={8} style={{ marginBottom: '10px' }}>
          <Col span={18} style={{ textAlign: 'left' }}>
            { name }
          </Col>
          <Col span={6} style={{ textAlign: 'right' }}>
            { (target.type === 'address' || target.type === 'place' || target.type === 'pin' || target.type === 'city') &&
              <Dropdown overlay={containMenu} placement="bottomRight">
                <Icon type="down-circle-o" />
              </Dropdown>
            }
            <Button shape="circle" icon="close" size="small" ghost style={{ borderWidth: 0 }} onClick={this.onRemove} />
          </Col>
        </Row>

        <Row type="flex" justify="end">
          <Col span={12} style={{ textAlign: 'left' }}>
            { (target.type === 'address' || target.type === 'place' || target.type === 'pin') &&
              <Dropdown
                overlay={radiusMenu}
                placement="bottomLeft"
                onVisibleChange={this.onRadiusMenuVisible}
                visible={this.state.showRadiusMenu}
              >
                <div>
                  { target.radius } mi
                  <Icon type="down" />
                </div>
              </Dropdown>
            }
          </Col>
          <Col span={12} style={{ textAlign: 'right' }}>
            
          </Col>
        </Row>
      </div>
    )
  }
}

TargetBox.propTypes = {
  target: PropTypes.object.isRequired,
  toggleContain: PropTypes.func,
  removeTarget: PropTypes.func,
  changeRadius: PropTypes.func,
  onMouseOver: PropTypes.func,
  onMouseOut: PropTypes.func,
}

TargetBox.defaultProps = {
  isInclude: true,
}

export default TargetBox

import React, {Component} from "react"

export class MouseAim extends Component {
    constructor(props) {
      super(props);
      this.state = {
        mousePosition: { x: 0, y: 0 }
      };
      this.handleMouseMovement = this.handleMouseMovement.bind(this);
    }
  
    handleMouseMovement(e) {
      const {left, top} = this.gameArea.getBoundingClientRect();  
      this.setState({
        mousePosition: {
          x: e.pageX,
          y: e.pageY
        }
      });
    }
  
    componentDidMount() {
      window.addEventListener('mousemove', this.handleMouseMovement);
    }
  
    componentWillUnmount() {
      window.removeEventListener('mousemove', this.handleMouseMovement);
    }
  
    render() {
        return (
        <>
            <div ref={el => this.gameArea = el} style={{width: '100%', height: '100vh'}}>
            <Reacteroids mousePosition={this.state.mousePosition} />
            </div>
            
        </>
  );}
}
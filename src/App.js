import React, { Component } from 'react';
import './App.css';
import p5 from 'p5';

/**
 * TODO:
 * [ ] Fix edge behaviour bug
 * [ ] Stop generation when all cells are dead or when equilibrium state is reached
 * [ ] Show iteration count
 * [ ] Add an About section
 * [ ] Time travel feature
 * [ ] Ability to Import/Export Simulations
 * [ ] Add more simulations from https://bitstorm.org/gameoflife/
 * [ ] Refactor :p
 */


// TODO: Move to own class
const simulationTypes = {
  xkcd: [[-1, -4], [0, -4], [1, -4],
  [-1, -3], [1, -3],
  [-1, -2], [1, -2],
  [0, -1],
  [-3, 0], [-1, 0], [0, 0], [1, 0],
  [-2, 1], [0, 1], [2, 1],
  [0, 2], [3, 2],
  [-1, 3], [1, 3],
  [-1, 4], [1, 4]],
  glider: [[0, -1],
  [1, 0],
  [-1, 1], [0, 1], [1, 1]],
  smallExploder: [[0, -2],
  [-1, -1], [0, -1], [1, -1],
  [-1, 0],
  [1, 0], [0, 1]],
  exploder: [[-2, -2], [0, -2], [2, -2],
  [-2, -1], [2, -1],
  [-2, 0], [2, 0],
  [-2, 1], [2, 1],
  [-2, 2], [0, 2], [2, 2]],
  tenCellRow: [[-4, 0], [-3, 0], [-2, 0], [-1, 0], [1, 0], [0, 0], [1, 0], [2, 0], [3, 0], [4, 0], [5, 0]]
}

class App extends Component {
  constructor(props) {
    super(props)
    this.myRef = React.createRef()
    this.state = { isRunning: false, frameRate: 5, gridSize: 15, canvasType: 'blank' }
  }

  columns;
  rows;
  board;
  next;
  width = 550;
  height = 550;

  Sketch = (p) => {

    p.setup = () => {
      p.createCanvas(this.width, this.height);
      this.init();
    };

    p.draw = () => {
      p.background(255);
      if (this.state.isRunning) {
        this.generate()
        p.frameRate(this.state.frameRate);
      } else {
        p.frameRate(60)
      }
      for (let i = 0; i < this.columns; i++) {
        for (let j = 0; j < this.rows; j++) {
          if ((this.board[i][j] === 1)) {
            //p.fill(0);
            p.fill(237, 34, 93);
          }
          else {
            p.fill(255);
          }
          p.stroke(0);
          p.rect(i * this.state.gridSize, j * this.state.gridSize, this.state.gridSize - 0.5, this.state.gridSize - 0.5);
        }
      }
    };
    p.mouseClicked = () => {
      if (!this.state.isRunning) {
        let i = Math.floor(p.mouseX / this.state.gridSize);
        let j = Math.floor(p.mouseY / this.state.gridSize);
        // Temporary fix to handle this event being triggered even when the mouse click is outside the canvas
        if (i < this.rows && j < this.columns) {
          this.board[i][j] = Number(!Boolean(this.board[i][j]))
        }
      }
    }
  };

  init() {
    // Calculate columns and rows
    this.columns = Math.floor(this.width / this.state.gridSize);
    this.rows = Math.floor(this.height / this.state.gridSize);
    // Wacky way to make a 2D array is JS
    this.board = new Array(this.columns);
    for (let i = 0; i < this.columns; i++) {
      this.board[i] = (new Array(this.rows)).fill(0);
    }
    // Going to use multiple 2D arrays and swap them
    this.next = new Array(this.columns);
    for (let i = 0; i < this.columns; i++) {
      this.next[i] = (new Array(this.rows)).fill(0);
    }
    if (this.state.canvasType !== 'blank') {
      let midPointX = Math.floor(this.columns / 2)
      let midPointY = Math.floor(this.rows / 2)
      let points = simulationTypes[this.state.canvasType]
      points.forEach((point) => {
        this.board[midPointX + point[0]][midPointY + point[1]] = 1
      });
    }
  }

  generate() {
    // Loop through every spot in our 2D array and check spots neighbors
    for (let x = 1; x < this.columns - 1; x++) {
      for (let y = 1; y < this.rows - 1; y++) {
        // Add up all the states in a 3x3 surrounding grid
        let neighbors = 0;
        for (let i = -1; i <= 1; i++) {
          for (let j = -1; j <= 1; j++) {
            neighbors += this.board[x + i][y + j];
          }
        }

        // A little trick to subtract the current cell's state since
        // we added it in the above loop
        neighbors -= this.board[x][y];
        // Rules of Life
        if ((this.board[x][y] === 1) && (neighbors < 2)) {
          this.next[x][y] = 0;           // Loneliness
        }
        else if ((this.board[x][y] === 1) && (neighbors > 3)) {
          this.next[x][y] = 0;           // Overpopulation
        }
        else if ((this.board[x][y] === 0) && (neighbors === 3)) {
          this.next[x][y] = 1;           // Reproduction
        }
        else {
          this.next[x][y] = this.board[x][y]; // Stasis
        }
      }
    }

    // Swap!
    let temp = this.board;
    this.board = this.next;
    this.next = temp;
  }

  startGeneration() {
    this.setState({ isRunning: !this.state.isRunning })
  }

  updateSpeed(event) {
    let speed = Number.parseInt(event.target.value)
    this.setState({ frameRate: speed })
  }

  updateGridSize(event) {
    let size = Number.parseInt(event.target.value)
    this.setState({ gridSize: size })
    setTimeout(() => this.reset(), 0)
  }

  updateCanvasType(event) {
    this.setState({ canvasType: event.target.value })
    setTimeout(() => this.reset(), 0)
  }

  reset() {
    this.setState({ isRunning: false })
    this.init()
  }

  componentDidMount() {
    this.myP5 = new p5(this.Sketch, this.myRef.current)
  }

  render() {
    return (
      <div className="container">
        <span className="title">Conway's Game of Life</span>
        <div id="canvas" className="canvas" ref={this.myRef}></div>
        <div className="config-panel">
          <span>
            <button onClick={() => this.startGeneration()} >
              {this.state.isRunning ? 'STOP' : 'START'}
            </button>
            <button onClick={() => this.reset()} >
              RESET
            </button>
          </span>
          <span>
            Grid Size: {this.state.gridSize}
            <span>
              <input type="range" value={this.state.gridSize}
                min="5" max="50" id="sizeRange"
                onChange={(event) => this.updateGridSize(event)}></input>
            </span>
          </span>
          <span>
            Speed: {this.state.frameRate} fps
            <span>
              <input type="range" value={this.state.frameRate}
                min="1" max="60" id="speedRange"
                onChange={(event) => this.updateSpeed(event)}></input>
            </span>
          </span>
          <span>
            Simulation Type:
            <span>
              <select value={this.state.canvasType} onChange={(event) => this.updateCanvasType(event)}>
                <option value="blank">Blank</option>
                <option value="xkcd">XKCD RIP John Conway</option>
                <option value="glider">Glider</option>
                <option value="smallExploder">Small Exploder</option>
                <option value="exploder">Exploder</option>
                <option value="tenCellRow">10 Cell Row</option>
              </select>
            </span>
          </span>
        </div>
      </div>
    )
  }

}

export default App;

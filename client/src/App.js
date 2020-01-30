import React, { Component } from 'react';

import { shuffle } from './utils';

import Tile from './components/Tile';

import './App.css';

function setRevealedGameTiles(currentGameTiles, matchedIds) {
  return currentGameTiles.map(
    tile => matchedIds.includes(tile.id) ?
      {
        ...tile,
        isRevealed: true,
      }
      : tile
  );
}

/**
 *
 */
class App extends Component {
  constructor(props) {
    super(props);

    this.state = {
      originalTiles: [],
      currentSelection: [],
      currentGameTiles: [],
      status: '',
      attempts: 0,
      name: '',
      highScores: [],
      won: false,
      knownCelebs: {},
    }

  }

  componentDidMount() {
    fetch('/tile-set.json')
      .then((response) => {
        if (!response.ok) {
          console.error('Failed to load tile set');
        }

        response.json()
          .then(data => {
            this.setState({
              originalTiles: data.tiles
            }, this.resetGame);
          })
          .catch(error => console.error('Error loading tileset data:', error));
      });

    this.callGetScoresApi().then(scoresRes => {
      this.setState({highScores: scoresRes});
    })

  }

  onFlipTile(id) {
    const { currentSelection, currentGameTiles, isWaiting, attempts } = this.state;
    if (isWaiting) return;

    const nextSelection = currentSelection.concat(id);
    this.setState({ currentSelection: nextSelection });
    if (nextSelection.length === 2) {
      this.setState({ status: 'Comparing faces...', isWaiting: true });
      const [tileA, tileB] = currentGameTiles.filter(t => nextSelection.includes(t.id));
      //make Rekognition calls to compare faces
      Promise.all([
        this.getCelebRekognitionData(tileA.id),
        this.getCelebRekognitionData(tileB.id),
      ])
        .then(([tileAData, tileBData]) => {
          if (tileAData.CelebrityFaces[0].Name === tileBData.CelebrityFaces[0].Name) {
            this.setState({
              currentSelection: [],
              currentGameTiles: setRevealedGameTiles(currentGameTiles, nextSelection),
              status: 'Correct Match!',
              isWaiting: false
            });
            this.checkForWin().then(res => {
              this.setState({won: res});
            });
          } else {
            // Flip selected tiles back over
            this.setState({
              isWaiting: true,
              currentSelection: nextSelection,
              attempts: attempts + 1,
              status: 'Incorrect Match'
            });
            setTimeout(() => this.setState({ currentSelection: [], isWaiting: false }), 500);
          }
        })
        .catch(err => console.log(err));
    } else {
      this.setState({ currentSelection: nextSelection });
    }



  }

  checkForWin = async() => {
    let win = true;
    this.state.currentGameTiles.forEach(tile => {
      if(!tile.isRevealed) win = false;
    });
    return win;
  }

  getCelebRekognitionData = async (id) => {
    let rekognitionData = this.state.knownCelebs[id];
    if (!rekognitionData) {
      const response = await fetch ('/api/recognizeCelebrities/' + id);
      rekognitionData = response.json();

      if(response.status !== 200) throw Error(rekognitionData.message);
      
      this.setState(({ knownCelebs }) => ({
        knownCelebs: {
          ...knownCelebs,
          [id]: rekognitionData,
        }
      }));
    }

    return rekognitionData;
  };

  resetGame() {
    this.setState(prevState => {
      const nextGameTiles = prevState.originalTiles.slice();
      shuffle(nextGameTiles);

      // Make a copy of the array since shuffle is in-place
      return {
        currentGameTiles: nextGameTiles,
        attempts: 0,
      };
    });
  }

  renderTiles() {
    const { currentGameTiles, currentSelection } = this.state;

    return (
      <ul className="MemoryGrid">
        {currentGameTiles.map(tile => (
          <Tile
            key={tile.id}
            backAlt="Hidden state for the matching tile"
            backSrc="./tiles/tile-back.png"
            matchAlt={tile.caption}
            matchSrc={tile.src}
            isRevealed={currentSelection.includes(tile.id) || tile.isRevealed}
            onFlip={this.onFlipTile.bind(this, tile.id)}
          />
        ))}
      </ul>
    );
  }

  saveScore(event) {
    event.preventDefault();
    this.callSaveApi(this.state.attempts, this.state.name).then(res => {
      this.callGetScoresApi().then(scoresRes => {
        this.setState({highScores: scoresRes});
      })
    }).catch(err => console.log(err.stack));
  }

  callSaveApi = async (score, name) => {
    const response = await fetch ('/api/saveScore', {
      method: 'POST',
      body: JSON.stringify({
        name: name,
        score: score,
      }),
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json'
      },
    });

    if(response.status !== 200) throw Error(response.message);

    return response;
  };

  callGetScoresApi = async () => {
    const response = await fetch ('/api/getScores');
    const body = response.json();

    if(response.status !== 200) throw Error(body.message);

    return body;
  };

  handleNameChange(event) {
    this.setState({name: event.target.value});
  }

  render() {
    const { currentGameTiles } = this.state;
    const submitScoreIsEnabled = this.state.won;
    return (
      <div className="App">
        <header className="App-header">
          <h2>Memory Game</h2>
          <p>
            Flip over tiles below and look for matching pairs. When you find a match,
            the tiles will remain face up.
          </p>
        </header>
        <section className="main">
          {currentGameTiles.length ? this.renderTiles() : <div className="spinner" />}
        </section>
        <footer>
          <p>{this.state.status}</p>
          <p>Attempts: {this.state.attempts}</p>
          <form onSubmit={this.saveScore.bind(this)}>
            <label>
              Name:
              <input type="text" value={this.state.name} onChange={this.handleNameChange.bind(this)}
                     />
            </label>
            <input type="submit" value="Save Score" disabled={!submitScoreIsEnabled}/>
          </form>
          <p>High Scores:</p>
          <ul className="HighScoresList">
            {this.state.highScores.map(score => (
                <li key={score.Name}>{score.Name}: {score.Score}</li>
            ))}
          </ul>

        </footer>
      </div>
    );
  }
}

export default App;

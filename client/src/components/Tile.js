import React from 'react';
import PropTypes from 'prop-types';

import './Tile.css';

function Tile({
  backAlt,
  backSrc,
  matchAlt,
  matchSrc,
  isRevealed,
  onFlip,
}) {
  return (
      <li className="Tile">
        <img
          className="Tile-image"
          src={isRevealed ? matchSrc : backSrc}
          onClick={!isRevealed && onFlip}
          alt={isRevealed ? matchAlt : backAlt}
          width="100"
        />
      </li>
  );
}

Tile.propTypes = {
  backSrc: PropTypes.string,
  backAlt: PropTypes.string,
  isRevealed: PropTypes.bool,
  matchSrc: PropTypes.string,
  matchAlt: PropTypes.string,
  onFlip: PropTypes.func,
};
Tile.defaultProps = {
  backAlt: 'Hidden state of a matching tile',
  matchAlt: '',
};

export default Tile;

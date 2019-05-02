import React, { useState } from 'react';
import './ExpressionChooser.css';

const FLOAT_REGEX = /^[-+]?(?:\d*\.?\d+|\d+\.?\d*)(?:[eE][-+]?\d+)?$/;

function generateChoices(text) {
  if (FLOAT_REGEX.test(text)) {
    return [
      {
        type: 'number',
        value: Number(text),
      }
    ];
  } else {
    return [
      {
        type: 'undefined',
      }
    ];
  }
}

function Choice({ choice }) {
  switch (choice.type) {
    case 'undefined':
      return <em>undefined</em>

    case 'number':
    return <span>{choice.value}</span>

    default:
      throw new Error();
  }
}

export default function ExpressionChooser({ node, dispatch }) {
  const [text, setText] = useState(() => {
    // Initialize text based on existing node
    switch (node.type) {
      case 'UndefinedExpression':
        return '';

      case 'IntegerLiteral':
        return node.value.toString();

      default:
        throw new Error();
    }
  });

  // Update the expression node to reflect the current choice
  const realizeChoice = (state) => {
    const choice = state.choices[state.index];

    let newNode;
    switch (choice.type) {
      case 'undefined':
        newNode = {
          type: 'UndefinedExpression',
        }
        break;

      case 'number':
        newNode = {
          type: 'IntegerLiteral',
          value: choice.value,
        };
        break;

      default:
        throw new Error();
    }

    newNode.streamId = node.streamId;
    newNode.identifier = node.identifier;

    dispatch({type: 'UPDATE_NODE', newNode});
  };

  const recomputeDropdownChoices = (text) => {
    const newState = {
      choices: generateChoices(text),
      index: 0, // reset index to 0
    };
    realizeChoice(newState);
    return newState;
  };

  const adjustDropdownIndex = (amount) => {
    setDropdownState(oldState => {
      const newState = {
        ...oldState,
        index: (oldState.index + amount + oldState.choices.length) % oldState.choices.length,
      };
      realizeChoice(newState);
      return newState;
    });
  };

  const [dropdownState, setDropdownState] = useState(() => recomputeDropdownChoices(text));

  const onChange = e => {
    const newText = e.target.value;

    if (newText === '[') {
      // This is a special case, we bypass the normal dropdown/choice stuff
      dispatch({type: 'END_EXPRESSION_EDIT'});
      dispatch({type: 'CREATE_ARRAY'});
    } else {
      setText(newText);
      setDropdownState(recomputeDropdownChoices(newText));
    }
  };

  const onKeyDown = e => {
    switch (e.key) {
      case 'Enter':
        e.stopPropagation();
        dispatch({type: 'END_EXPRESSION_EDIT'});
        break;

      case 'Backspace':
        if (!e.target.value) {
          dispatch({type: 'END_EXPRESSION_EDIT'});
          dispatch({type: 'DELETE'});
        }
        break;

      case 'ArrowUp':
        e.stopPropagation();
        e.preventDefault();
        adjustDropdownIndex(-1);
        break;

      case 'ArrowDown':
        e.stopPropagation();
        e.preventDefault();
        adjustDropdownIndex(1);
        break;

      default:
        // do nothing
        break;
    }
  };

  return (
    <div>
      <input className="Editor-text-edit-input" value={text} onChange={onChange} onKeyDown={onKeyDown} autoFocus />
      <ul className="ExpressionChooser-dropdown">
        {dropdownState.choices.map((choice, idx) =>
          <li key={idx} className={(idx === dropdownState.index) ? 'ExpressionChooser-dropdown-selected' : ''}><Choice choice={choice} /></li>
        )}
      </ul>
    </div>
  );
}

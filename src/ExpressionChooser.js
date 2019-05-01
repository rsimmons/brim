import React, { useState } from 'react';

const FLOAT_REGEX = /^[-+]?(?:\d*\.?\d+|\d+\.?\d*)(?:[eE][-+]?\d+)?$/;

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

  const onChange = e => {
    const newText = e.target.value;

    setText(newText);

    if (newText === '[') {
      dispatch({type: 'END_EXPRESSION_EDIT'});
      dispatch({type: 'CREATE_ARRAY'});
    } else if (FLOAT_REGEX.test(newText)) {
      dispatch({
        type: 'UPDATE_NODE',
        newNode: {
          type: 'IntegerLiteral',
          streamId: node.streamId,
          identifier: node.identifier,
          value: Number(newText),
        },
      });
    } else {
      dispatch({
        type: 'UPDATE_NODE',
        newNode: {
          type: 'UndefinedExpression',
          streamId: node.streamId,
          identifier: node.identifier,
        },
      });
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

      default:
        // do nothing
        break;
    }
  };

  return <div><input className="Editor-text-edit-input" value={text} onChange={onChange} onKeyDown={onKeyDown} autoFocus /></div>
}

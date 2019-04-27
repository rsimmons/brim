import React, { createContext, useContext, useReducer, useRef, useEffect, useState } from 'react';
import { HotKeys, ObserveKeys } from "react-hotkeys";
import { initialState, reducer, nodeFromPath } from './EditReducer';
import './Editor.css';

const keyMap = {
  MOVE_UP: 'up',
  MOVE_DOWN: 'down',
  MOVE_LEFT: 'left',
  MOVE_RIGHT: 'right',

  ZOOM_IN: 'shift+right',
  ZOOM_OUT: 'shift+left',

  ENTER: 'enter', // could the command be TOGGLE_EDIT?

  INSERT_AFTER: [';', ','],

  DELETE: 'backspace',
  ASSIGN: '=',

/*
  CANCEL_EDIT: 'escape',
*/
};

// "Regular" (printable, basically) characters that are used as commands
const COMMAND_CHARS = [
  '=',
  ';',
  ',',
];

const DispatchContext = createContext();

const SelectedNodeContext = createContext();
function useWithSelectedClass(obj, cns = '') {
  const selectedNode = useContext(SelectedNodeContext);
  return (obj === selectedNode) ? (cns + ' Editor-selected') : cns;
}

const TextEditContext = createContext();

function TextEditInput() {
  const dispatch = useContext(DispatchContext);
  const textEdit = useContext(TextEditContext);

  const onChange = e => {
    dispatch({
      type: 'SET_TEXT',
      text: e.target.value,
    });
  };

  return <div><input className="Editor-text-edit-input Editor-selected" value={textEdit.text} onChange={onChange} autoFocus /></div>
}

function Hole() {
  return <div className="Editor-hole">&nbsp;</div>
}

function ProgramView({ program }) {
  return (
    <div className="Editor-program">
      {program.assignments.map((assignment) => (
        <AssignmentView assignment={assignment} key={assignment.uid} />
      ))}
    </div>
  );
}

function AssignmentView({ assignment }) {
  return (
    <div className={useWithSelectedClass(assignment, 'Editor-assignment')}>
      <IdentifierView identifier={assignment.identifier} />
      <div>&nbsp;=&nbsp;</div>
      <ExpressionView expression={assignment.expression} />
    </div>
  );
}

function NotEditingIdentifierView({ identifier }) {
  return (
    <div className={useWithSelectedClass(identifier)}>
      {(typeof identifier.name === 'string')
        ? identifier.name
        : <Hole />
      }
    </div>
  );
}

function IdentifierView({ identifier }) {
  const selected = (identifier === useContext(SelectedNodeContext));
  const textEdit = useContext(TextEditContext);
  if (selected && textEdit) {
    return <TextEditInput />
  } else {
    return <NotEditingIdentifierView identifier={identifier} />
  }
}

function IntegerLiteralView({ integerLiteral }) {
  return <div className={useWithSelectedClass(integerLiteral)}>{integerLiteral.value}</div>;
}

function ArrayLiteralView({ arrayLiteral }) {
  return (
    <div className={useWithSelectedClass(arrayLiteral)}>
      <div>[</div>
      <div className="Editor-array-items">
        {arrayLiteral.items.map(item => (
          <div className="Editor-array-item"><ExpressionView expression={item} /></div>
        ))}
      </div>
      <div>]</div>
    </div>
  );
}

function UndefinedExpressionView({ undefinedExpression }) {
  return <div className={useWithSelectedClass(undefinedExpression)}><Hole /></div>;
}

function NotEditingExpressionView({ expression }) {
  switch (expression.type) {
    case 'IntegerLiteral':
      return <IntegerLiteralView integerLiteral={expression} />

    case 'ArrayLiteral':
      return <ArrayLiteralView arrayLiteral={expression} />

    case 'UndefinedExpression':
      return <UndefinedExpressionView undefinedExpression={expression} />

    default:
      throw new Error();
  }
}

function ExpressionView({ expression }) {
  const selected = (expression === useContext(SelectedNodeContext));
  const textEdit = useContext(TextEditContext);

  if (selected && textEdit) {
    return <TextEditInput />
  } else {
    return <NotEditingExpressionView expression={expression} />
  }
}

export default function Editor({ autoFocus }) {
  const [state, dispatch] = useReducer(reducer, initialState);

  const editorElem = useRef();

  // Do auto-focus if prop is set
  const [constAutoFocus] = useState(autoFocus);
  useEffect(() => {
    if (constAutoFocus) {
      // Focus editor after initial render
      editorElem.current.focus();
    }
  }, [constAutoFocus]);

  // Restore focus to editor elem if input box just went away.
  // NOTE: This is hacky, but don't know better way to handle.
  const previouslyTextEditing = useRef(false);
  useEffect(() => {
    const textEditing = !!state.textEdit;
    if (previouslyTextEditing.current && !textEditing) {
      editorElem.current.focus();
    }
    previouslyTextEditing.current = textEditing;
  });

  // TODO: memoize generation of this
  const handlers = {};
  for (const k of Object.keys(keyMap)) {
    handlers[k] = (() => (e) => {
      if ((e.target.tagName.toLowerCase() !== 'input') || (COMMAND_CHARS.includes(e.key))) {
        // NOTE: This is important, otherwise keys like '=' will go into the input element
        e.preventDefault();
      }
      dispatch({type: k});
    })(); // IIFE to bind k
  }

  const onKeyDown = e => {
    if (e.target.tagName.toLowerCase() === 'input') {
      // Ignore if this came from an input box
      return;
    }
    // TODO: This is not a robust check, but the spec is complicated
    // (https://www.w3.org/TR/uievents-key/#keys-whitespace)
    if (([...e.key].length === 1) && !e.altkey && !e.ctrlKey && !e.metaKey && !COMMAND_CHARS.includes(e.key)) {
      e.preventDefault(); // If we generate a CHAR action, then don't also allow default
      dispatch({
        type: 'CHAR',
        char: e.key,
      });
    }
  };

  return (
    <HotKeys keyMap={keyMap} handlers={handlers}>
      <ObserveKeys>
        <div className="Editor" onKeyDown={onKeyDown} tabIndex="0" ref={editorElem}>
          <DispatchContext.Provider value={dispatch}>
            <SelectedNodeContext.Provider value={nodeFromPath(state.root, state.selectionPath)}>
              <TextEditContext.Provider value={state.textEdit}>
                <ProgramView program={state.root} />
              </TextEditContext.Provider>
            </SelectedNodeContext.Provider>
          </DispatchContext.Provider>
        </div>
      </ObserveKeys>
    </HotKeys>
  );
}

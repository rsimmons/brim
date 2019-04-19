import React, { createContext, useContext, useReducer, useRef, useEffect } from 'react';
import { HotKeys } from "react-hotkeys";
import { initialState, reducer, nodeFromPath } from './EditReducer';
import './Editor.css';

const keyMap = {
  MOVE_UP: "up",
  MOVE_DOWN: "down",
  MOVE_LEFT: "left",
  MOVE_RIGHT: "right",

  EXPAND: "shift+left",
  SHRINK: "shift+right",
  EXTEND_PREV: "shift+up",
  EXTEND_NEXT: "shift+down",

  BEGIN_EDIT: "enter",
  CANCEL_EDIT: "escape",
};

const SelectedNodeContext = createContext();
function useWithSelectedClass(obj, cns = '') {
  const selectedNode = useContext(SelectedNodeContext);
  return (obj === selectedNode) ? (cns + ' Editor-selected') : cns;
}

function ProgramView({ program }) {
  return (
    <div>
      {program.assignments.map((assignment) => (
        <AssignmentView assignment={assignment} key={assignment.identifier.name} />
      ))}
    </div>
  );
}

function AssignmentView({ assignment }) {
  return <div><span className={useWithSelectedClass(assignment)}><IdentifierView identifier={assignment.identifier} /> = <ExpressionView expression={assignment.expression} /></span></div>
}

function IdentifierView({ identifier }) {
  return <span className={useWithSelectedClass(identifier)}>{identifier.name}</span>
}

function ExpressionView({ expression }) {
  return <span className={useWithSelectedClass(expression)}>{expression.value}</span>
}

export default function Editor() {
  const [state, dispatch] = useReducer(reducer, initialState);

  const editorElem = useRef();
  useEffect(() => {
    // Focus editor after initial render
    editorElem.current.focus();
  }, []);

  // TODO: memoize generation of this
  const handlers = {};
  for (const k of Object.keys(keyMap)) {
    handlers[k] = (() => () => { dispatch({type: k}) })(); // IIFE to bind k
  }

  const onKeyDown = e => {
    if (e.target.tagName.toLowerCase() === 'input') {
      // Ignore if this came from an input box
      return;
    }
    // TODO: This is not a robust check, but the spec is complicated
    // (https://www.w3.org/TR/uievents-key/#keys-whitespace)
    if (([...e.key].length === 1) && !e.altkey && !e.ctrlKey && !e.metaKey) {
      dispatch({
        type: 'CHAR',
        char: e.key,
      });
    }
  };

  return (
    <HotKeys keyMap={keyMap} handlers={handlers}>
      <div className="Editor" onKeyDown={onKeyDown} tabIndex="0" ref={editorElem}>
        <SelectedNodeContext.Provider value={nodeFromPath(state.root, state.selectionPath)}>
          <ProgramView program={state.root} />
        </SelectedNodeContext.Provider>
      </div>
    </HotKeys>
  );
}

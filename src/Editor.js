import React, { createContext, useContext, useReducer, useRef, useEffect } from 'react';
import { HotKeys, ObserveKeys } from "react-hotkeys";
import { initialState, reducer, nodeFromPath } from './EditReducer';
import './Editor.css';

const keyMap = {
  MOVE_UP: "up",
  MOVE_DOWN: "down",
  MOVE_LEFT: "left",
  MOVE_RIGHT: "right",

  EXPAND: "shift+left",

  ENTER: "enter", // since this has multiple functions based on context, not sure how else to name
  SHIFT_ENTER: "shift+enter", // don't know how to name this either

  DELETE: "Backspace",

/*
  SHRINK: "shift+right",
  EXTEND_PREV: "shift+up",
  EXTEND_NEXT: "shift+down",
  CANCEL_EDIT: "escape",
*/
};

const COMMANDS_OBSERVED_IN_INPUTS = [
  "ENTER",
  // "ESCAPE",
];

const KEYS_OBSERVED_IN_INPUTS = COMMANDS_OBSERVED_IN_INPUTS.map(cmd => {
  if (!keyMap.hasOwnProperty(cmd)) {
    throw new Error();
  }
  return keyMap[cmd];
});

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

  return <input className="Editor-text-edit-input Editor-selected" value={textEdit.text} onChange={onChange} autoFocus />
}

function Hole() {
  return <span className="Editor-hole">&nbsp;</span>
}

function ProgramView({ program }) {
  return (
    <div>
      {program.assignments.map((assignment) => (
        <AssignmentView assignment={assignment} key={assignment.uid} />
      ))}
    </div>
  );
}

function AssignmentView({ assignment }) {
  return (
    <div className="Editor-assignment">
      <span className={useWithSelectedClass(assignment)}>
        <IdentifierView identifier={assignment.identifier} />
        {' = '}
        <ExpressionView expression={assignment.expression} />
      </span>
    </div>
  );
}

function IdentifierView({ identifier }) {
  const selected = (identifier === useContext(SelectedNodeContext));
  const textEdit = useContext(TextEditContext);
  if (selected && textEdit) {
    return <TextEditInput />
  } else {
    return (
      <span className={useWithSelectedClass(identifier)}>
        {(typeof identifier.name === 'string')
          ? identifier.name
          : <Hole />
        }
      </span>
    );
  }
}

function ExpressionView({ expression }) {
  const selected = (expression === useContext(SelectedNodeContext));
  const textEdit = useContext(TextEditContext);

  if (selected && textEdit) {
    return <TextEditInput />
  } else {
    return (
      <span className={useWithSelectedClass(expression)}>
        {(() => {
          switch (expression.type) {
            case 'IntegerLiteral':
              return expression.value;

            case 'UndefinedExpression':
              return <Hole />

            default:
              throw new Error();
          }
        })()}
      </span>
    );
  }
}

export default function Editor({ autoFocus }) {
  const [state, dispatch] = useReducer(reducer, initialState);

  const editorElem = useRef();

  // Do auto-focus if prop is set
  useEffect(() => {
    if (autoFocus) {
      // Focus editor after initial render
      editorElem.current.focus();
    }
  }, []);

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
      <ObserveKeys only={KEYS_OBSERVED_IN_INPUTS}>
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

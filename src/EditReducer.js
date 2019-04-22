const SCHEMA = {
  Program: {
    fields: {
      assignments: {type: 'nodes', nodeType: 'Assignment'},
    }
  },

  Assignment: {
    fields: {
      identifier: {type: 'node', nodeType: 'Identifier'},
      expression: {type: 'node', nodeType: 'Integer'},
    }
  },

  Identifier: {
    fields: {
      name: {type: 'value'},
    }
  },

  Integer: {
    fields: {
      value: {type: 'value'},
    }
  },
};

export function nodeFromPath(root, path) {
  let cur = root;
  for (const seg of path) {
    cur = cur[seg];
  }
  return cur;
}

export function nodeOnPath(node, root, path) {
  if (node === root) {
    return true;
  }

  let cur = root;
  for (const seg of path) {
    cur = cur[seg];
    if (node === cur) {
      return true;
    }
  }

  return false;
}

export function nodeSplitPath(node, root, path) {
  let cur = root;
  let idx = 0;
  for (const seg of path) {
    if (node === cur) {
      return [path.slice(0, idx), path.slice(idx)];
    }
    cur = cur[seg];
    idx++;
  }

  if (node === cur) {
    return [path.slice(0, idx), path.slice(idx)];
  } else {
    throw new Error('node was not in path');
  }
}

const equiv = (a, b) => JSON.stringify(a) === JSON.stringify(b);

const HANDLERS = [
  ['Assignment', ['MOVE_LEFT'], ({node, subpath}) => {
    if (subpath.length === 0) {
      return [node, ['identifier']]; // shrink to left
    } else if (equiv(subpath, ['expression'])) {
      return [node, ['identifier'], null];
    }
  }],

  ['Assignment', ['MOVE_RIGHT'], ({node, subpath}) => {
    if (subpath.length === 0) {
      return [node, ['expression']]; // shrink to right
    } else if (equiv(subpath, ['identifier'])) {
      return [node, ['expression'], null];
    }
  }],

  ['Assignment', ['EXPAND'], ({node, subpath}) => {
    if (subpath.length === 1) {
      return [node, [], null];
    }
  }],

  ['Program', ['MOVE_UP', 'MOVE_DOWN'], ({node, subpath, action}) => {
    // NOTE: This assumes that selection is on/in one of the assignments
    const newAssignmentIdx = () => {
      let newIdx = subpath[1] + ((action.type === 'MOVE_UP') ? -1 : 1);
      newIdx = Math.max(newIdx, 0);
      newIdx = Math.min(newIdx, node.assignments.length-1);
      return newIdx;
    }

    if (((subpath.length === 2) || (subpath.length === 3)) && (subpath[0] === 'assignments')) {
      return [node, ['assignments', newAssignmentIdx()], null];
    }
  }],

  ['Program', ['DELETE'], ({node, subpath}) => {
    if ((subpath.length === 2) && (subpath[0] === 'assignments')) {
      // TODO: Handle case where we delete the last assignment
      const removeIdx = subpath[1];
      const newNode = {
        ...node,
        assignments: node.assignments.slice(0, removeIdx).concat(node.assignments.slice(removeIdx+1)),
      };
      const newIdx = Math.min(removeIdx, newNode.assignments.length-1);
      return [newNode, ['assignments', newIdx], null];
    }
  }],

  ['Identifier', ['ENTER'], ({node, subpath, textEdit}) => {
    if (textEdit) {
      return [{
        ...node,
        name: textEdit.text,
      }, subpath, null];
    } else {
      return [node, subpath, {text: node.name}];
    }
  }],
];

/**
 * Returns null or [newNode, newSelectionPath, newTextEntry]
 */
function recursiveReducer(state, node, action) {
  // If this node is not on the selection path, we can short circuit
  if (!nodeOnPath(node, state.root, state.selectionPath)) {
    return null;
  }

  // Build new node, recursing into any child nodes
  // If nothing has changed, we try to return the original object to allow callers to memoize
  const nodeSchema = SCHEMA[node.type];
  if (!nodeSchema) {
    throw new Error();
  }
  const newNode = {
    type: node.type,
  };
  let newSelPath = null;
  let newTextEntry = null;
  let handled = false;
  for (const [fieldName, fieldInfo] of Object.entries(nodeSchema.fields)) {
    switch (fieldInfo.type) {
      case 'node': {
        const recResult = recursiveReducer(state, node[fieldName], action);
        if (recResult) {
          if (handled) {
            throw new Error('already handled');
          }
          const [n, sp, te] = recResult;
          newNode[fieldName] = n;
          newSelPath = sp;
          newTextEntry = te;
          handled = true;
        } else {
          newNode[fieldName] = node[fieldName];
        }
        break;
      }

      case 'nodes': {
        const newArr = [];
        for (const arrn of node[fieldName]) {
          const recResult = recursiveReducer(state, arrn, action);
          if (recResult) {
            if (handled) {
              throw new Error('already handled');
            }
            const [n, sp, te] = recResult;
            newArr.push(n);
            newSelPath = sp;
            newTextEntry = te;
            handled = true;
          } else {
            newArr.push(arrn);
          }
        }
        newNode[fieldName] = newArr;
        break;
      }

      case 'value':
        newNode[fieldName] = node[fieldName];
        break;

      default:
        throw new Error();
    }
  }

  // If the action has been handled, we can return now
  if (handled) {
    return [newNode, newSelPath, newTextEntry];
  }

  // Try any matching handlers
  for (const [nt, acts, hfunc] of HANDLERS) {
    if ((node.type === nt) && (acts.includes(action.type))) {
      const [pathBefore, pathAfter] = nodeSplitPath(node, state.root, state.selectionPath);
      const handlerResult = hfunc({
        node,
        subpath: pathAfter,
        action,
        textEdit: state.textEdit,
      });
      if (handlerResult) {
        const [handlerNewNode, handlerNewSubpath, handlerTextEntry] = handlerResult;
        return [handlerNewNode, pathBefore.concat(handlerNewSubpath), handlerTextEntry];
      }
    }
  }

  return null;
}

export function reducer(state, action) {
  console.log('action', action.type);

  // Some actions are handled specially
  if (action.type === 'SET_TEXT') {
    if (!state.textEdit) {
      throw new Error();
    }

    return {
      ...state,
      textEdit: {
        ...state.textEdit,
        text: action.text,
      }
    };
  }

  const recResult = recursiveReducer(state, state.root, action);
  if (recResult) {
    console.log('handled');
    const [newRoot, newSelectionPath, newTextEntry] = recResult;
    console.log('new textEdit is', newTextEntry);
    return {
      root: newRoot,
      selectionPath: newSelectionPath,
      textEdit: newTextEntry,
    };
  } else {
    console.log('not handled');
    return state;
  }
}

export const initialState = {
  // root: {
  //   type: 'Program',
  //   assignments: [],
  // },
  root: {
    type: 'Program',
    assignments: [
      {
        type: 'Assignment',
        identifier: {
          type: 'Identifier',
          name: 'foo',
        },
        expression: {
          type: 'Integer',
          value: 123,
        }
      },
      {
        type: 'Assignment',
        identifier: {
          type: 'Identifier',
          name: 'bar',
        },
        expression: {
          type: 'Integer',
          value: 456,
        }
      },
      {
        type: 'Assignment',
        identifier: {
          type: 'Identifier',
          name: 'baz',
        },
        expression: {
          type: 'Integer',
          value: 789,
        }
      },
    ]
  },
  selectionPath: ['assignments', 0, 'identifier'],
  textEdit: null,
};

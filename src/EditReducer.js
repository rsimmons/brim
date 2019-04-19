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

/**
 * Returns [newNode, maybeNewSelectionPath, consumed]
 */
function recursiveReducer(state, node, action) {
  // If this node is not on the selection path, we can short circuit
  if (!nodeOnPath(node, state.root, state.selectionPath)) {
    return [node, null];
  }

  // Build new node, recursing into any child nodes
  const nodeSchema = SCHEMA[node.type];
  if (!nodeSchema) {
    throw new Error();
  }
  const newNode = {
    type: node.type,
  };
  let anyNodeChanges = false;
  let consumed = false;
  for (const [fieldName, fieldInfo] of Object.entries(nodeSchema.fields)) {
    switch (fieldInfo.type) {
      case 'node': {
        const [n, selp, cons] = recursiveReducer(state, node[fieldName], action);
        if (n !== node[fieldName]) {
          anyNodeChanges = true;
        }
        if (cons) {
          consumed = true;
        }
        newNode[fieldName] = n;
        break;
      }

      case 'nodes': {
        const newArr = [];
        for (const arrn of node[fieldName]) {
          const [n, selp, cons] = recursiveReducer(state, arrn, action);
          if (n !== arrn) {
            anyNodeChanges = true;
          }
          if (cons) {
            consumed = true;
          }
          newArr.push(n);
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

  // TOOD: if action has been handled, return
  // TODO: check if this node/action has a handler defined, maybe call handler
  // TODO:

  return [anyNodeChanges ? newNode : node, null, consumed];
}

export function reducer(state, action) {
  switch (action.type) {
    case 'char':
      console.log('action char', JSON.stringify(action.char));
      break;

    case 'cmd':
      console.log('action cmd', action.cmd);
      break;

    default:
      throw new Error();
  }

  const [newRoot, maybeNewSelectionPath, consumed] = recursiveReducer(state, state.root, action);

  return {
    root: newRoot,
    selectionPath: maybeNewSelectionPath ? maybeNewSelectionPath : state.selectionPath,
  };
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
};

import genuid from './uid';

// We don't make a discriminated union of specific actions, but maybe we could
interface Action {
  type: string;
  text?: string;
}

interface ProgramNode {
  type: 'Program';
  assignments: AssignmentNode[];
}
function isProgramNode(node: Node): node is ProgramNode {
  return node.type === 'Program';
}

interface AssignmentNode {
  type: 'Assignment';
  uid: string;
  identifier: IdentifierNode;
  expression: ExpressionNode;
}
function isAssignmentNode(node: Node): node is AssignmentNode {
  return node.type === 'Assignment';
}

interface IdentifierNode {
  type: 'Identifier';
  name: string | null;
}
function isIdentifierNode(node: Node): node is IdentifierNode {
  return node.type === 'Identifier';
}

type ExpressionNode = UndefinedExpressionNode | IntegerLiteralNode;
function isExpressionNode(node: Node): node is ExpressionNode {
  return isUndefinedExpressionNode(node) || isIntegerLiteralNode(node);
}

interface UndefinedExpressionNode {
  type: 'UndefinedExpression';
}
function isUndefinedExpressionNode(node: Node): node is UndefinedExpressionNode {
  return node.type === 'UndefinedExpression';
}

interface IntegerLiteralNode {
  type: 'IntegerLiteral';
  value: number;
}
function isIntegerLiteralNode(node: Node): node is IntegerLiteralNode {
  return node.type === 'IntegerLiteral';
}

type Node = ProgramNode | AssignmentNode | IdentifierNode | ExpressionNode;
function isNode(node: any): node is Node {
  return isProgramNode(node) || isAssignmentNode(node) || isIdentifierNode(node) || isExpressionNode(node);
}

type Path = (string | number)[];

interface TextEdit {
  text: string;
}

interface HandlerArgs {
  node: Node,
  subpath: Path,
  action: Action;
  textEdit: TextEdit | null;
}
type Handler = [string, string[], (args: HandlerArgs) => (undefined | [Node, Path, TextEdit | null])];

interface State {
  root: ProgramNode;
  selectionPath: Path;
  textEdit: TextEdit | null;
}

const SCHEMA_NODES = {
  Program: {
    fields: {
      assignments: {type: 'nodes', nodeType: 'Assignment'},
    }
  },

  Assignment: {
    fields: {
      uid: {type: 'uid'},
      identifier: {type: 'node', nodeType: 'Identifier'},
      expression: {type: 'node', nodeType: 'Expression'},
    }
  },

  Identifier: {
    fields: {
      name: {type: 'value'},
    }
  },

  UndefinedExpression: {
    fields: {
    }
  },

  IntegerLiteral: {
    fields: {
      value: {type: 'value'},
    }
  },
};

// TODO: If we want to include other classes in the lists, generate an expansion over the closure
const SCHEMA_CLASSES: {[nodeType: string]: string[]} = {
  Expression: ['UndefinedExpression', 'IntegerLiteral'],
}

export function nodeFromPath(root: Node, path: Path): Node {
  let cur: any = root;
  for (const seg of path) {
    cur = cur[seg];
  }
  return cur;
}

export function nodeOnPath(node: Node, root: Node, path: Path): boolean {
  if (node === root) {
    return true;
  }

  let cur: any = root;
  for (const seg of path) {
    cur = cur[seg];
    if (node === cur) {
      return true;
    }
  }

  return false;
}

export function nodeSplitPath(node: Node, root: Node, path: Path): [Path, Path] {
  let cur: any = root;
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

const equiv = (a: any, b: any): boolean => JSON.stringify(a) === JSON.stringify(b);

const HANDLERS: Handler[] = [
  ['Assignment', ['MOVE_LEFT'], ({node, subpath}) => {
    if (subpath.length === 0) {
      return [node, ['identifier'], null]; // shrink to left
    } else if (equiv(subpath, ['expression'])) {
      return [node, ['identifier'], null];
    }
  }],

  ['Assignment', ['MOVE_RIGHT'], ({node, subpath}) => {
    if (subpath.length === 0) {
      return [node, ['expression'], null]; // shrink to right
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
    if (!isProgramNode(node)) {
      throw new Error();
    }

    // NOTE: This assumes that selection is on/in one of the assignments
    const newAssignmentIdx = () => {
      const idx = subpath[1];
      if (typeof idx !== 'number') {
        throw new Error();
      }
      let newIdx = idx + ((action.type === 'MOVE_UP') ? -1 : 1);
      newIdx = Math.max(newIdx, 0);
      newIdx = Math.min(newIdx, node.assignments.length-1);
      return newIdx;
    }

    if (((subpath.length === 2) || (subpath.length === 3)) && (subpath[0] === 'assignments')) {
      return [node, ['assignments', newAssignmentIdx()], null];
    }
  }],

  ['Program', ['DELETE'], ({node, subpath}) => {
    if (!isProgramNode(node)) {
      throw new Error();
    }
    if ((subpath.length === 2) && (subpath[0] === 'assignments')) {
      // TODO: Handle case where we delete the last assignment
      const removeIdx = subpath[1];
      if (typeof(removeIdx) !== 'number') {
        throw new Error();
      }
      const newNode = {
        ...node,
        assignments: [
          ...node.assignments.slice(0, removeIdx),
          ...node.assignments.slice(removeIdx+1),
        ],
      };
      let newIdx = removeIdx-1;
      newIdx = Math.max(newIdx, 0);
      newIdx = Math.min(newIdx, node.assignments.length-1);
      return [newNode, ['assignments', newIdx], null];
    }
  }],

  ['Identifier', ['ENTER'], ({node, subpath, textEdit}) => {
    if (!isIdentifierNode(node)) {
      throw new Error();
    }
    if (textEdit) {
      return [{
        ...node,
        name: textEdit.text ? textEdit.text : null, // TODO: ensure that it's valid?
      }, subpath, null];
    } else {
      return [node, subpath, {text: node.name || ''}];
    }
  }],

  ['Expression', ['ENTER'], ({node, subpath, textEdit}) => {
    if (textEdit) {
      const FLOAT_REGEX = /^[-+]?(?:\d*\.?\d+|\d+\.?\d*)(?:[eE][-+]?\d+)?$/;

      if (FLOAT_REGEX.test(textEdit.text)) {
        return [{
          type: 'IntegerLiteral',
          value: Number(textEdit.text),
        }, [], null];
      } else {
        return [{
          type: 'UndefinedExpression',
        }, [], null];
      }
    } else {
      // Initialize the input
      switch (node.type) {
        case 'IntegerLiteral':
          return [node, subpath, {text: node.value.toString()}];

        case 'UndefinedExpression':
          return [node, subpath, {text: ''}];

        default:
          throw new Error();
      }
    }
  }],

  ['Program', ['ENTER'], ({node, subpath}) => {
    if (!isProgramNode(node)) {
      throw new Error();
    }
    if ((subpath.length === 2) && (subpath[0] === 'assignments')) {
      const afterIdx = subpath[1];
      if (typeof(afterIdx) !== 'number') {
        throw new Error();
      }
      const newNode: ProgramNode = {
        ...node,
        assignments: [
          ...node.assignments.slice(0, afterIdx+1),
          {
            type: 'Assignment',
            uid: genuid(),
            identifier: {
              type: 'Identifier',
              name: null,
            },
            expression: {
              type: 'UndefinedExpression',
            }
          },
          ...node.assignments.slice(afterIdx+1),
        ],
      };
      return [newNode, ['assignments', afterIdx+1, 'identifier'], {text: ''}];
    }
  }],
];

/**
 * Returns null or [newNode, newSelectionPath, newTextEdit]
 */
function recursiveReducer(state: State, node: Node, action: Action): (null | [Node, Path, TextEdit | null]) {
  // If this node is not on the selection path, we can short circuit
  if (!nodeOnPath(node, state.root, state.selectionPath)) {
    return null;
  }

  // Build new node, recursing into any child nodes
  // If nothing has changed, we try to return the original object to allow callers to memoize
  const nodeInfo = SCHEMA_NODES[node.type];
  if (!nodeInfo) {
    throw new Error();
  }
  const newNode: any = {
    type: node.type,
  };
  let newSelPath = null;
  let newTextEdit = null;
  let handled = false;
  const indexableNode = node as {[prop: string]: any}; // to avoid type errors
  for (const [fieldName, fieldInfo] of Object.entries(nodeInfo.fields)) {
    switch (fieldInfo.type) {
      case 'node': {
        const childNode = indexableNode[fieldName];
        const recResult = recursiveReducer(state, childNode, action);
        if (recResult) {
          if (handled) {
            throw new Error('already handled');
          }
          const [n, sp, te] = recResult;
          newNode[fieldName] = n;
          newSelPath = sp;
          newTextEdit = te;
          handled = true;
        } else {
          newNode[fieldName] = childNode;
        }
        break;
      }

      case 'nodes': {
        const newArr = [];
        const childNodes = indexableNode[fieldName];
        for (const arrn of childNodes) {
          const recResult = recursiveReducer(state, arrn, action);
          if (recResult) {
            if (handled) {
              throw new Error('already handled');
            }
            const [n, sp, te] = recResult;
            newArr.push(n);
            newSelPath = sp;
            newTextEdit = te;
            handled = true;
          } else {
            newArr.push(arrn);
          }
        }
        newNode[fieldName] = newArr;
        break;
      }

      case 'value':
        newNode[fieldName] = indexableNode[fieldName];
        break;

      case 'uid':
        newNode[fieldName] = indexableNode[fieldName];
        break;

      default:
        throw new Error();
    }
  }

  // If the action has been handled, we can return now
  if (handled) {
    if (!isNode(newNode)) {
      throw new Error();
    }
    if (!newSelPath) {
      throw new Error();
    }
    return [newNode, newSelPath, newTextEdit];
  }

  // Try any matching handlers
  for (const [nt, acts, hfunc] of HANDLERS) {
    const matchingTypes = SCHEMA_CLASSES[nt] ? SCHEMA_CLASSES[nt] : [nt];
    if (matchingTypes.includes(node.type) && acts.includes(action.type)) {
      const [pathBefore, pathAfter] = nodeSplitPath(node, state.root, state.selectionPath);
      const handlerResult = hfunc({
        node,
        subpath: pathAfter,
        action,
        textEdit: state.textEdit,
      });
      if (handlerResult) {
        console.log('handlerResult', handlerResult);
        const [handlerNewNode, handlerNewSubpath, handlerTextEdit] = handlerResult;
        return [handlerNewNode, pathBefore.concat(handlerNewSubpath), handlerTextEdit];
      }
    }
  }

  return null;
}

export function reducer(state: State, action: Action): State {
  console.log('action', action.type);

  // Some actions are handled specially
  if (action.type === 'SET_TEXT') {
    if (!state.textEdit) {
      throw new Error();
    }
    if (!action.text) {
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
    const [newRoot, newSelectionPath, newTextEdit] = recResult;
    console.log('new selectionPath is', newSelectionPath, 'textEdit is', newTextEdit);

    if (!isProgramNode(newRoot)) {
      throw new Error();
    }

    return {
      root: newRoot,
      selectionPath: newSelectionPath,
      textEdit: newTextEdit,
    };
  } else {
    console.log('not handled');
    return state;
  }
}

export const initialState: State = {
  // root: {
  //   type: 'Program',
  //   assignments: [],
  // },
  root: {
    type: 'Program',
    assignments: [
      {
        type: 'Assignment',
        uid: genuid(),
        identifier: {
          type: 'Identifier',
          name: 'foo',
        },
        expression: {
          type: 'IntegerLiteral',
          value: 123,
        }
      },
      {
        type: 'Assignment',
        uid: genuid(),
        identifier: {
          type: 'Identifier',
          name: 'bar',
        },
        expression: {
          type: 'IntegerLiteral',
          value: 456,
        }
      },
      {
        type: 'Assignment',
        uid: genuid(),
        identifier: {
          type: 'Identifier',
          name: 'baz',
        },
        expression: {
          type: 'IntegerLiteral',
          value: 789,
        }
      },
      {
        type: 'Assignment',
        uid: genuid(),
        identifier: {
          type: 'Identifier',
          name: null,
        },
        expression: {
          type: 'IntegerLiteral',
          value: 4321,
        }
      },
      {
        type: 'Assignment',
        uid: genuid(),
        identifier: {
          type: 'Identifier',
          name: 'quux',
        },
        expression: {
          type: 'UndefinedExpression',
        }
      },
    ]
  },
  selectionPath: ['assignments', 0, 'identifier'],
  textEdit: null,
};

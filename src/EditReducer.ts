import genuid from './uid';

// We don't make a discriminated union of specific actions, but maybe we could
interface Action {
  type: string;
  text?: string;
  char?: string;
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

type ExpressionNode = UndefinedExpressionNode | IntegerLiteralNode | ArrayLiteralNode;
function isExpressionNode(node: Node): node is ExpressionNode {
  return isUndefinedExpressionNode(node) || isIntegerLiteralNode(node)|| isArrayLiteralNode(node);
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

interface ArrayLiteralNode {
  type: 'ArrayLiteral';
  items: ExpressionNode[];
}
function isArrayLiteralNode(node: Node): node is ArrayLiteralNode {
  return node.type === 'ArrayLiteral';
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
type HandlerResult = (undefined | [Node, Path, TextEdit | null]);
type Handler = [string, string[], (args: HandlerArgs) => HandlerResult];

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

  ArrayLiteral: {
    fields: {
      items: {type: 'nodes', nodeType: 'Expression'},
    }
  },
};

// TODO: If we want to include other classes in the lists, generate an expansion over the closure
const SCHEMA_CLASSES: {[nodeType: string]: string[]} = {
  Expression: ['UndefinedExpression', 'IntegerLiteral', 'ArrayLiteral'],
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

function deleteAssignment(node: ProgramNode, removeIdx: number): [ProgramNode, Path, TextEdit | null] {
  // TODO: Handle case where we delete all assignments
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

  if (newNode.assignments.length) {
    let newIdx = removeIdx-1;
    newIdx = Math.max(newIdx, 0);
    newIdx = Math.min(newIdx, node.assignments.length-1);
    return [newNode, ['assignments', newIdx], null];
  } else {
    // We've deleted all assignments, so make a single empty one.
    newNode.assignments.push({
      type: 'Assignment',
      uid: genuid(),
      identifier: {
        type: 'Identifier',
        name: null,
      },
      expression: {
        type: 'UndefinedExpression',
      }
    });
    return [newNode, ['assignments', 0, 'identifier'], {text: ''}];
  }
}

function updateIdentifier(node: IdentifierNode, text: string): IdentifierNode {
  return {
    ...node,
    name: text ? text : null, // TODO: ensure that it's valid?
  };
}

function updateExpression(node: ExpressionNode, text: string): HandlerResult {
  const FLOAT_REGEX = /^[-+]?(?:\d*\.?\d+|\d+\.?\d*)(?:[eE][-+]?\d+)?$/;

  if (text === '[') {
    return [{
      type: 'ArrayLiteral',
      items: [
        {
          type: 'UndefinedExpression',
        }
      ],
    }, ['items', 0], {text: ''}];
  } else if (FLOAT_REGEX.test(text)) {
    return [{
      type: 'IntegerLiteral',
      value: Number(text),
    }, [], {text}];
  } else {
    return [{
      type: 'UndefinedExpression',
    }, [], {text}];
  }
}

const HANDLERS: Handler[] = [
  ['Assignment', ['MOVE_LEFT'], ({node, subpath, textEdit}) => {
    if (textEdit) {
      return;
    }
    if (equiv(subpath, ['expression'])) {
      return [node, ['identifier'], null];
    }
    if (equiv(subpath, ['identifier'])) { // NOTE: Behave like ZOOM_OUT since unambiguous
      return [node, [], null];
    }
  }],

  ['Assignment', ['MOVE_RIGHT'], ({node, subpath, textEdit}) => {
    if (textEdit) {
      return;
    }
    if (equiv(subpath, ['identifier'])) {
      return [node, ['expression'], null];
    }
    if (equiv(subpath, [])) { // NOTE: Behave like ZOOM_IN since unambiguous
      return [node, ['identifier'], null];
    }
  }],

  ['Assignment', ['ZOOM_IN'], ({node, subpath, textEdit}) => {
    if (textEdit) {
      return;
    }
    if (equiv(subpath, [])) {
      return [node, ['identifier'], null];
    }
  }],

  ['Assignment', ['ZOOM_OUT'], ({node, subpath, textEdit}) => {
    if (textEdit) {
      return;
    }
    if (equiv(subpath, ['identifier']) || equiv(subpath, ['expression'])) {
      return [node, [], null];
    }
  }],

  ['Program', ['MOVE_UP', 'MOVE_DOWN'], ({node, subpath, textEdit, action}) => {
    if (!isProgramNode(node)) {
      throw new Error();
    }

    if (textEdit) {
      return;
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

    if ((subpath.length === 2) && (subpath[0] === 'assignments')) {
      return [node, ['assignments', newAssignmentIdx()], null];
    } else if ((subpath.length === 3) && (subpath[0] === 'assignments')) {
      return [node, ['assignments', newAssignmentIdx(), subpath[2]], null];
    }
  }],

  ['Program', ['DELETE'], ({node, subpath, textEdit}) => {
    if (!isProgramNode(node)) {
      throw new Error();
    }
    if ((subpath.length === 2) && (subpath[0] === 'assignments')) {
      if (textEdit) {
        throw new Error();
      }
      const removeIdx = subpath[1];
      if (typeof(removeIdx) !== 'number') {
        throw new Error();
      }
      return deleteAssignment(node, removeIdx);
    }
  }],

  ['Identifier', ['ENTER'], ({node, subpath, textEdit}) => {
    if (!isIdentifierNode(node)) {
      throw new Error();
    }
    if (textEdit) {
      return [node, subpath, null];
    } else {
      const nameText = node.name || '';
      return [updateIdentifier(node, nameText), subpath, {text: nameText}];
    }
  }],

  ['Expression', ['ENTER'], ({node, subpath, textEdit}) => {
    if (textEdit) {
      return [node, subpath, null];
    } else {
      // Initialize the input
      switch (node.type) {
        case 'IntegerLiteral':
         return updateExpression(node, node.value.toString());

        case 'UndefinedExpression':
          return updateExpression(node, '');

        case 'ArrayLiteral':
          // Can't directly edit
          break;

        default:
          throw new Error();
      }
    }
  }],

  ['Program', ['INSERT_AFTER'], ({node, subpath, textEdit}) => {
    if (!isProgramNode(node)) {
      throw new Error();
    }
    if ((subpath.length >= 2) && (subpath[0] === 'assignments')) {
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

  /**
   * DELETE when editing the LHS of assignment will delete the assignment, if the input box is empty and the RHS is undefined.
   * This is mainly to allow us to easily "undo" adding a new assignment by just hitting DELETE.
   */
  ['Program', ['DELETE'], ({node, subpath, textEdit}) => {
    if (!isProgramNode(node)) {
      throw new Error();
    }
    if ((subpath.length === 3) && (subpath[0] === 'assignments') && (subpath[2] === 'identifier') && textEdit && (textEdit.text === '')) {
      const removeIdx = subpath[1];
      if (typeof(removeIdx) !== 'number') {
        throw new Error();
      }
      if (node.assignments[removeIdx].expression.type === 'UndefinedExpression') {
        if (typeof(removeIdx) !== 'number') {
          throw new Error();
        }
        return deleteAssignment(node, removeIdx);
      }
    }
  }],

  /**
   * Typing a character on an identifier jumps straight into editing it (overwriting)
   */
  ['Identifier', ['CHAR'], ({node, subpath, textEdit, action}) => {
    if (!isIdentifierNode(node)) {
      throw new Error();
    }
    if (textEdit || subpath.length || !action.char) {
      throw new Error();
    }
    // Space is not a "command character", but I don't think we want it to trigger the start of editing
    if (action.char !== ' ') {
      return [updateIdentifier(node, action.char), subpath, {text: action.char}];
    }
  }],

  /**
   * Typing a character on an expression jumps straight into editing it (overwriting)
   */
  ['Expression', ['CHAR'], ({node, subpath, textEdit, action}) => {
    if (!isExpressionNode(node)) {
      throw new Error();
    }
    if (textEdit || subpath.length || !action.char) {
      throw new Error();
    }
    // Space is not a "command character", but I don't think we want it to trigger the start of editing
    if (action.char !== ' ') {
      return updateExpression(node, action.char);
    }
  }],

  /**
   * ASSIGN on an assignment will move to editing the RHS in many cases.
   */
  ['Assignment', ['ASSIGN'], ({node, subpath, textEdit}) => {
    if (!isAssignmentNode(node)) {
      throw new Error();
    }
    if ((!textEdit && (equiv(subpath, []) || equiv(subpath, ['identifier']) || equiv(subpath, ['expression']))) ||
    (textEdit && equiv(subpath, ['identifier']))) {
      return [{
        ...node,
        expression: {
          type: 'UndefinedExpression'
        },
      }, ['expression'], {text: ''}];
    }
  }],

  ['Identifier', ['SET_TEXT'], ({node, subpath, textEdit, action}) => {
    if (!textEdit) {
      throw new Error();
    }
    if (typeof(action.text) !== 'string') {
      throw new Error();
    }
    if (subpath.length !== 0) {
      throw new Error();
    }
    if (!isIdentifierNode(node)) {
      throw new Error();
    }

    return [updateIdentifier(node, action.text), subpath, {text: action.text}];
  }],

  ['Expression', ['SET_TEXT'], ({node, subpath, textEdit, action}) => {
    if (!textEdit) {
      throw new Error();
    }
    if (typeof(action.text) !== 'string') {
      throw new Error();
    }
    if (!isExpressionNode(node)) {
      throw new Error();
    }

    return updateExpression(node, action.text);
  }],

  // NOTE: We only allow MOVE_LEFT to act as ZOOM_OUT here because we know array is displayed vertically for now
  ['ArrayLiteral', ['ZOOM_OUT', 'MOVE_LEFT'], ({node, subpath, textEdit}) => {
    if (textEdit) {
      return;
    }
    if (subpath.length === 2) {
      if ((subpath[0] !== 'items') || (typeof(subpath[1]) !== 'number')) {
        throw Error();
      }
      return [node, [], null];
    }
  }],

  // NOTE: We only allow MOVE_RIGHT to act as ZOOM_IN here because we know it will be in a vertical-list container
  ['ArrayLiteral', ['ZOOM_IN', 'MOVE_RIGHT'], ({node, subpath, textEdit}) => {
    if (textEdit) {
      return;
    }
    if (subpath.length === 0) {
      return [node, ['items', 0], null];
    }
  }],

  ['ArrayLiteral', ['MOVE_UP', 'MOVE_DOWN'], ({node, subpath, textEdit, action}) => {
    if (!isArrayLiteralNode(node)) {
      throw new Error();
    }

    if (textEdit) {
      return;
    }

    if ((subpath.length === 2) && (subpath[0] === 'items')) {
      const idx = subpath[1];
      if (typeof idx !== 'number') {
        throw new Error();
      }
      const newIdx = idx + ((action.type === 'MOVE_UP') ? -1 : 1);

      if ((newIdx < 0) || (newIdx >= node.items.length)) {
        return [node, [], null];
      } else {
        return [node, ['items', newIdx], null];
      }
    }
  }],

  ['ArrayLiteral', ['INSERT_AFTER'], ({node, subpath, textEdit}) => {
    if (!isArrayLiteralNode(node)) {
      throw new Error();
    }
    if ((subpath.length === 2) && (subpath[0] === 'items')) {
      const afterIdx = subpath[1];
      if (typeof(afterIdx) !== 'number') {
        throw new Error();
      }
      const newNode: ArrayLiteralNode = {
        ...node,
        items: [
          ...node.items.slice(0, afterIdx+1),
          {
            type: 'UndefinedExpression',
          },
          ...node.items.slice(afterIdx+1),
        ],
      };
      return [newNode, ['items', afterIdx+1], {text: ''}];
    }
  }],

  ['ArrayLiteral', ['DELETE'], ({node, subpath, textEdit}) => {
    if (!isArrayLiteralNode(node)) {
      throw new Error();
    }
    if (subpath.length === 2) {
      if (node.items.length === 0) {
        throw new Error();
      }

      // Selection is on an item
      if (node.items.length === 1) {
        // There is exactly one item
        if (textEdit) {
          // The single item is being edited, text edit is empty
          if (textEdit.text === '') {
            return [{
              type: 'UndefinedExpression',
            }, [], {text: ''}];
          }
        } else {
          // The single item is not being edited
          return [{
            ...node,
            items: [],
          }, [], null];
        }
      } else {
        // There is more than one item
        if (!textEdit || (textEdit.text === '')) {
          // We're not editing, or we are editing but text is empty, so we will delete this item
          const removeIdx = subpath[1];
          if (typeof(removeIdx) !== 'number') {
            throw new Error();
          }
          const newNode = {
            ...node,
            items: [
              ...node.items.slice(0, removeIdx),
              ...node.items.slice(removeIdx+1),
            ],
          };

          let newIdx = removeIdx-1;
          newIdx = Math.max(newIdx, 0);
          newIdx = Math.min(newIdx, node.items.length-1);
          return [newNode, ['items', newIdx], null];
        }
      }
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

/*
  // Some actions are handled specially
  if (action.type === 'SET_TEXT') {
    if (!state.textEdit) {
      throw new Error();
    }
    if (typeof(action.text) !== 'string') {
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
*/

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
          name: 'blap',
        },
        expression: {
          type: 'ArrayLiteral',
          items: [
            {
              type: 'IntegerLiteral',
              value: 123,
            },
            {
              type: 'ArrayLiteral',
              items: [
                {
                  type: 'IntegerLiteral',
                  value: 345,
                },
                {
                  type: 'IntegerLiteral',
                  value: 456,
                },
              ],
            },
            {
              type: 'IntegerLiteral',
              value: 234,
            },
          ],
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

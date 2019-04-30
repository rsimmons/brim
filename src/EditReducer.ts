import genuid from './uid';

// We don't make a discriminated union of specific actions, but maybe we could
interface Action {
  type: string;
  text?: string;
  char?: string;
}

interface ProgramNode {
  type: 'Program';
  expressions: ExpressionNode[];
}
function isProgramNode(node: Node): node is ProgramNode {
  return node.type === 'Program';
}

interface IdentifierNode {
  type: 'Identifier';
  name: string;
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
  uid: string;
  identifier: IdentifierNode | null;
}
function isUndefinedExpressionNode(node: Node): node is UndefinedExpressionNode {
  return node.type === 'UndefinedExpression';
}

interface IntegerLiteralNode {
  type: 'IntegerLiteral';
  uid: string;
  identifier: IdentifierNode | null;
  value: number;
}
function isIntegerLiteralNode(node: Node): node is IntegerLiteralNode {
  return node.type === 'IntegerLiteral';
}

interface ArrayLiteralNode {
  type: 'ArrayLiteral';
  uid: string;
  identifier: IdentifierNode | null;
  items: ExpressionNode[];
}
function isArrayLiteralNode(node: Node): node is ArrayLiteralNode {
  return node.type === 'ArrayLiteral';
}

type Node = ProgramNode | IdentifierNode | ExpressionNode;
function isNode(node: any): node is Node {
  return isProgramNode(node) || isIdentifierNode(node) || isExpressionNode(node);
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
      expressions: {type: 'nodes'},
    }
  },

  Identifier: {
    fields: {
      name: {type: 'value'},
    }
  },

  UndefinedExpression: {
    fields: {
      uid: {type: 'uid'},
      identifier: {type: 'node'},
    }
  },

  IntegerLiteral: {
    fields: {
      uid: {type: 'uid'},
      identifier: {type: 'node'},
      value: {type: 'value'},
    }
  },

  ArrayLiteral: {
    fields: {
      uid: {type: 'uid'},
      identifier: {type: 'node'},
      items: {type: 'nodes'},
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

function deleteExpression(node: ProgramNode, removeIdx: number): [ProgramNode, Path, TextEdit | null] {
  // TODO: Handle case where we delete all expressions
  if (typeof(removeIdx) !== 'number') {
    throw new Error();
  }
  const newNode = {
    ...node,
    expressions: [
      ...node.expressions.slice(0, removeIdx),
      ...node.expressions.slice(removeIdx+1),
    ],
  };

  if (newNode.expressions.length) {
    let newIdx = removeIdx-1;
    newIdx = Math.max(newIdx, 0);
    newIdx = Math.min(newIdx, node.expressions.length-1);
    return [newNode, ['expressions', newIdx], null];
  } else {
    // We've deleted all expressions, so make a single empty one.
    newNode.expressions.push({
      type: 'UndefinedExpression',
      uid: genuid(),
      identifier: null,
    });
    return [newNode, ['expressions', 0], {text: ''}];
  }
}

function updateExpression(node: ExpressionNode, text: string): HandlerResult {
  const FLOAT_REGEX = /^[-+]?(?:\d*\.?\d+|\d+\.?\d*)(?:[eE][-+]?\d+)?$/;

  if (FLOAT_REGEX.test(text)) {
    return [{
      type: 'IntegerLiteral',
      uid: node.uid,
      identifier: node.identifier,
      value: Number(text),
    }, [], {text}];
  } else {
    return [{
      type: 'UndefinedExpression',
      uid: node.uid,
      identifier: node.identifier,
    }, [], {text}];
  }
}

const HANDLERS: Handler[] = [
  ['Program', ['MOVE_UP', 'MOVE_DOWN'], ({node, subpath, textEdit, action}) => {
    if (!isProgramNode(node)) {
      throw new Error();
    }

    if (textEdit) {
      return;
    }

    // NOTE: This assumes that selection is on/in one of the expressions
    const newExpressionIdx = () => {
      const idx = subpath[1];
      if (typeof idx !== 'number') {
        throw new Error();
      }
      let newIdx = idx + ((action.type === 'MOVE_UP') ? -1 : 1);
      newIdx = Math.max(newIdx, 0);
      newIdx = Math.min(newIdx, node.expressions.length-1);
      return newIdx;
    }

    if ((subpath.length === 2) && (subpath[0] === 'expressions')) {
      return [node, ['expressions', newExpressionIdx()], null];
    }
  }],

  ['Program', ['DELETE'], ({node, subpath, textEdit}) => {
    if (!isProgramNode(node)) {
      throw new Error();
    }
    if (!textEdit && (subpath.length === 2) && (subpath[0] === 'expressions')) {
      if (textEdit) {
        throw new Error();
      }
      const removeIdx = subpath[1];
      if (typeof(removeIdx) !== 'number') {
        throw new Error();
      }
      return deleteExpression(node, removeIdx);
    }
  }],

  ['Expression', ['ENTER'], ({node, subpath, textEdit}) => {
    if (!isExpressionNode(node)) {
      throw new Error();
    }
    if (equiv(subpath, ['identifier'])) {
      if (!node.identifier) {
        throw new Error();
      }
      if (textEdit) {
        // Commit name
        const trimmedName = node.identifier.name.trim();
        if (trimmedName) {
          return [{
            ...node,
            identifier: {
              type: 'Identifier',
              name: trimmedName,
            },
          }, [], null];
        } else {
          // If the name is empty (after trim), get rid of identifier node
          return [{
            ...node,
            identifier: null,
          }, [], null];
        }
      } else {
        return [node, subpath, {text: node.identifier ? node.identifier.name : ''}];
      }
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
    if ((subpath.length >= 2) && (subpath[0] === 'expressions')) {
      const afterIdx = subpath[1];
      if (typeof(afterIdx) !== 'number') {
        throw new Error();
      }
      const newNode: ProgramNode = {
        ...node,
        expressions: [
          ...node.expressions.slice(0, afterIdx+1),
          {
            type: 'UndefinedExpression',
            uid: genuid(),
            identifier: null,
          },
          ...node.expressions.slice(afterIdx+1),
        ],
      };
      return [newNode, ['expressions', afterIdx+1], {text: ''}];
    }
  }],

  /**
   * DELETE when editing an expression at the top level will delete it, if there is no text.
   * This is mainly to allow us to easily "undo" adding a new expression by just hitting DELETE.
   */
  ['Program', ['DELETE'], ({node, subpath, textEdit}) => {
    if (!isProgramNode(node)) {
      throw new Error();
    }
    if ((subpath.length === 2) && (subpath[0] === 'expressions') && textEdit && (textEdit.text === '')) {
      const removeIdx = subpath[1];
      if (typeof(removeIdx) !== 'number') {
        throw new Error();
      }
      return deleteExpression(node, removeIdx);
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
   * NAME on an expression will move to editing identifer.
   */
  ['Expression', ['NAME'], ({node, subpath, textEdit}) => {
    if (!isExpressionNode(node)) {
      throw new Error();
    }
    if (equiv(subpath, [])) {
      return [{
        ...node,
        identifier: node.identifier ? node.identifier : {type: 'Identifier', name: ''},
      }, ['identifier'], {text: node.identifier ? node.identifier.name : ''}];
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

    return [{...node, name: action.text}, subpath, {text: action.text}];
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
    if (!isArrayLiteralNode(node)) {
      throw new Error();
    }
    if (textEdit) {
      return;
    }
    if (subpath.length === 0) {
      // We do a special thing here: If the array is empty, we create a single undefined item.
      // This gives us a way to add a new element to an empty array.
      if (node.items.length === 0) {
        return [{
          ...node,
          items: [
            {
              type: 'UndefinedExpression',
              uid: genuid(),
              identifier: null,
            }
          ],
        }, ['items', 0], null];
      } else {
        return [node, ['items', 0], null];
      }
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
            uid: genuid(),
            identifier: null,
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
              identifier: node.identifier,
              uid: node.uid,
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

  ['Expression', ['OPEN_ARRAY'], ({node, subpath, textEdit}) => {
    if (!isExpressionNode(node)) {
      throw new Error();
    }

    if ((subpath.length === 0) && (!textEdit || (textEdit.text === ''))) {
      return [{
        type: 'ArrayLiteral',
        uid: genuid(),
        identifier: null,
        items: [
          {
            type: 'UndefinedExpression',
            identifier: null,
            uid: genuid(),
          }
        ],
      }, ['items', 0], {text: ''}];
    }
  }],

  ['ArrayLiteral', ['CLOSE_ARRAY'], ({node, subpath, textEdit}) => {
    if (!isArrayLiteralNode(node)) {
      throw new Error();
    }
    if ((subpath.length === 2) && (subpath[0] === 'items') && textEdit) {
      const idx = subpath[1];
      if (typeof(idx) !== 'number') {
        throw new Error();
      }
      if (idx === (node.items.length-1)) {
        // Editing the last item
        if (textEdit.text === '') {
          // Delete (empty) node we were editing, go back to to array
          return [{
            ...node,
            items: node.items.slice(0, idx),
          }, [], null];
        } else {
          // Finish edit, go back to to array
          return [node, [], null];
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
  root: {
    type: 'Program',
    expressions: [
      {
        type: 'IntegerLiteral',
        uid: genuid(),
        identifier: {
          type: 'Identifier',
          name: 'foo',
        },
        value: 123,
      },
      {
        type: 'IntegerLiteral',
        uid: genuid(),
        identifier: null,
        value: 456,
      },
      {
        type: 'IntegerLiteral',
        uid: genuid(),
        identifier: {
          type: 'Identifier',
          name: 'bar',
        },
        value: 789,
      },
      {
        type: 'ArrayLiteral',
        uid: genuid(),
        identifier: {
          type: 'Identifier',
          name: 'an array literal',
        },
        items: [
          {
            type: 'IntegerLiteral',
            uid: genuid(),
            identifier: null,
            value: 123,
          },
          {
            type: 'ArrayLiteral',
            uid: genuid(),
            identifier: {
              type: 'Identifier',
              name: 'nice subarray',
            },
                items: [
              {
                type: 'IntegerLiteral',
                uid: genuid(),
                identifier: null,
                value: 345,
              },
              {
                type: 'IntegerLiteral',
                uid: genuid(),
                identifier: null,
                value: 456,
              },
            ],
          },
          {
            type: 'IntegerLiteral',
            uid: genuid(),
            identifier: null,
            value: 234,
          },
        ],
      },
      {
        type: 'UndefinedExpression',
        uid: genuid(),
        identifier: {
          type: 'Identifier',
          name: 'quux',
        },
      },
    ]
  },
  selectionPath: ['expressions', 0],
  textEdit: null,
};

export const initialState = {
  // doc: {
  //   type: 'Program',
  //   assignments: [],
  // },
  doc: {
    type: 'Program',
    assignments: [
      {
        type: 'Assignment',
        identifier: 'foo',
        expression: {
          type: 'Integer',
          value: 123,
        }
      },
      {
        type: 'Assignment',
        identifier: 'bar',
        expression: {
          type: 'Integer',
          value: 456,
        }
      },
      {
        type: 'Assignment',
        identifier: 'baz',
        expression: {
          type: 'Integer',
          value: 789,
        }
      },
    ]
  }
};

export function reducer(state, action) {
  switch (action.type) {
    case 'char':
      console.log('action char', JSON.stringify(action.char));
      return state;

    case 'cmd':
      console.log('action cmd', action.cmd);
      return state;

    default:
      throw new Error();
  }
}

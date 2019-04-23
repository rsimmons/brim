import React from 'react';
import './App.css';
import Editor from './Editor';

const App: React.FC = () => {
  return (
    <div className="App">
      <Editor autoFocus={true} />
    </div>
  );
}

export default App;

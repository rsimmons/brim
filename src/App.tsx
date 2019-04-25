import React from 'react';
import './App.css';
import Editor from './Editor';

const App: React.FC = () => {
  return (
    <div className="App">
      <Editor autoFocus={true} />
      <div>
        <h2>Testing Tips</h2>
        <ul>
          <li><strong>A bunch of shit only half-works.</strong></li>
          <li>If you don't see a green selection/cursor box, focus the editor.</li>
          <li>There's no mouse/touch support yet, only keyboard.</li>
          <li>Up/down arrows move up and down between assignments and array items.</li>
          <li>Left arrow generally moves "out" and right arrow generally moves "in" (to nested arrays, etc.).</li>
          <li>If LHS of an assignment is selected, left arrow moves "out" to select the entire assignment.</li>
          <li>Pressing enter on an identifier or number will begin editing it. Pressing enter again will stop editing.</li>
          <li>Instead of pressing enter, you can just start typing letters/numbers and it will begin the edit (overwriting what it there).</li>
          <li>Pressing the = key on the "top levels" of an assignment will beging editing the RHS.</li>
          <li>A red box indicates an undefined identifer or expression.</li>
          <li>If you enter an invalid number as an expression, it will ignore it and leave an undefined box.</li>
          <li>Shift-enter adds a new assignment below the current one, or a new array item below the current one.</li>
          <li>When an entire assignment is selected, delete will delete it.</li>
          <li><strong>TODO</strong> Allow creating array literals.</li>
          <li><strong>TODO</strong> Allow deleting array items.</li>
          <li><strong>TODO</strong> Validate LHS identifiers.</li>
          <li><strong>TODO</strong> Escape will revert any in-progress edit.</li>
        </ul>
      </div>
    </div>
  );
}

export default App;

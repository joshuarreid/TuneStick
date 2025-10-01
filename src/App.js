import React from 'react';
import MusicImportController from './components/MusicImportController';
import './App.css';

function App() {
    return (
        <div className="App">
            <header className="App-header">
                <h1>TuneStick</h1>
                <MusicImportController />
            </header>
        </div>
    );
}

export default App;
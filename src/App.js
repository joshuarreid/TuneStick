import React from 'react';
import './App.css';

function App() {
    return (
        <div className="App">
            <header className="App-header">
                <h1>Welcome to TuneStick!</h1>
                <p>Your Desktop Album Manager</p>
                <div className="buttons">
                    <button onClick={() => alert('Browse Albums clicked!')}>
                        Browse Albums
                    </button>
                    <button onClick={() => alert('Import Music clicked!')}>
                        Import Music
                    </button>
                    <button onClick={() => alert('Settings clicked!')}>
                        Settings
                    </button>
                </div>
            </header>
        </div>
    );
}

export default App;
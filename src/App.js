import React from 'react';
import { Routes, Route } from 'react-router-dom';
import AlbumSelectionPage from './screens/AlbumSelectionPage/AlbumSelectionPage';
import './App.css';
import Sidebar from './components/sidebar/Sidebar';

function App() {
    return (
        <>
            <Sidebar />
            <div className="main-content">
                <Routes>
                    <Route path="/" element={<AlbumSelectionPage />} />
                    {/* Add other routes here */}
                </Routes>
            </div>
        </>
    );
}
export default App;
import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
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
                    {/* Fallback: redirect any unknown path to the home route */}
                    <Route path="*" element={<Navigate to="/" replace />} />
                </Routes>
            </div>
        </>
    );
}

export default App;
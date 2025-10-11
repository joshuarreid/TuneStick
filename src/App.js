import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import AlbumSelectionPage from './components/AlbumSelectionPage';
import './App.css';
import Sidebar from './components/Sidebar';

function App() {
    return (
        <BrowserRouter>
            <Sidebar />
            <div className="main-content">
                <Routes>
                    <Route path="/" element={<AlbumSelectionPage />} />
                    {/* Add other routes here */}
                </Routes>
            </div>
        </BrowserRouter>
    );
}
export default App;
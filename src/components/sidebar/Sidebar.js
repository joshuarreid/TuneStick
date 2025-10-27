import { Link } from 'react-router-dom';
import './Sidebar.css';
import React, { useEffect, useState } from 'react';
import MusicLibraryService from '../../services/MusicLibraryService';

export default function Sidebar() {
    const [drives, setDrives] = useState([]);
    const [selectedDrive, setSelectedDrive] = useState(null);
    const [loadingDrives, setLoadingDrives] = useState(false);

    const loadDrives = async () => {
        setLoadingDrives(true);
        try {
            const res = await MusicLibraryService.listDrives();
            if (res && res.success) {
                setDrives(res.drives || []);
            } else {
                setDrives([]);
            }
            // Try to load previously selected drive (if any)
            const sel = await MusicLibraryService.getSelectedDrive();
            if (sel && sel.success && sel.drive) {
                setSelectedDrive(sel.drive);
            }
        } catch (err) {
            console.error('Failed to load drives', err);
            setDrives([]);
        } finally {
            setLoadingDrives(false);
        }
    };

    useEffect(() => {
        loadDrives();
    }, []);

    const onToggleDrive = async (drive) => {
        try {
            // enforce single selection: if already selected, unselect
            const newSelected = selectedDrive === drive.path ? null : drive.path;
            const res = await MusicLibraryService.setSelectedDrive(newSelected);
            if (res && res.success) {
                setSelectedDrive(newSelected);
            } else {
                console.warn('Failed to set selected drive', res && res.message);
            }
        } catch (err) {
            console.error('Error selecting drive', err);
        }
    };

    return (
        <div className="sidebar">
            <h2 className="sidebar-title">TuneStick</h2>
            <div className="sidebar-divider" />
            <ul className="sidebar-list">
                <li className="sidebar-list-item">
                    <Link to="/" className="sidebar-link">Library</Link>
                </li>
                <li className="sidebar-list-item">
                    <Link to="/settings" className="sidebar-link">Settings</Link>
                </li>
            </ul>

            <div className="sidebar-divider" />
            <div className="drives-section">
                <div className="drives-header">
                    <strong>Mounted Drives</strong>
                    <button className="refresh-drives-btn" onClick={loadDrives} disabled={loadingDrives} title="Refresh drives">↻</button>
                </div>
                {loadingDrives && <div className="drives-loading">Loading drives...</div>}
                {!loadingDrives && drives.length === 0 && (
                    <div className="no-drives">No drives found.</div>
                )}
                <ul className="drives-list">
                    {drives.map((drive) => (
                        <li key={drive.path} className="drive-item">
                            <label>
                                <input
                                    type="radio"
                                    name="selectedDrive"
                                    value={drive.path}
                                    checked={selectedDrive === drive.path}
                                    onChange={() => onToggleDrive(drive)}
                                />
                                <span className="drive-name">{drive.name}</span>
                                <div className="drive-path">{drive.path}</div>
                            </label>
                        </li>
                    ))}
                </ul>
            </div>
        </div>
    );
}
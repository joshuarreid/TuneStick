import { Link } from 'react-router-dom';
import './Sidebar.css';

export default function Sidebar() {
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
        </div>
    );
}
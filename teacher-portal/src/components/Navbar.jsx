import React from 'react';
import { Link } from 'react-router-dom';
import './Navbar.css'; // Add this line

function Navbar() {
  return (
    <nav className="navbar">
      <h2 className="navbar-title">Teacher Portal</h2>
      <ul className="nav-links">
        <li><Link to="/">Dashboard</Link></li>
        <li><Link to="/students">Students</Link></li>
        <li><Link to="/quests">Quests</Link></li>
        <li><Link to="/leaderboard">Leaderboard</Link></li>
        <li><Link to="/reports">Reports</Link></li>
      </ul>
    </nav>
  );
}

export default Navbar;
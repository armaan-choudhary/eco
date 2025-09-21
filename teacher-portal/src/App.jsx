import React, { useState, useEffect } from "react";
import { BrowserRouter as Router, Routes, Route, NavLink } from "react-router-dom";
import "./Dashboard.css";
import customTeacherPic from './assets/teacher-pic.png';

// --- LOGIN PAGE COMPONENT ---
function LoginPage({ setToken }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    try {
      const response = await fetch("http://127.0.0.1:8000/login", {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.detail || "Login failed");
      }
      setToken(data.access_token);
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <div className="login-container">
      <form className="login-form" onSubmit={handleSubmit}>
        <h1>Teacher Portal Login</h1>
        <div className="input-group">
          <label htmlFor="email">Email</label>
          <input type="email" id="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
        </div>
        <div className="input-group">
          <label htmlFor="password">Password</label>
          <input type="password" id="password" value={password} onChange={(e) => setPassword(e.target.value)} required />
        </div>
        <button type="submit">Login</button>
        {error && <p className="login-error">{error}</p>}
      </form>
    </div>
  );
}

// --- DATA-FETCHING PAGE COMPONENTS ---
function DashboardPage({ token }) {
  const [stats, setStats] = useState({ badges: 0, quests: 0, karma: 0 });
  useEffect(() => {
    if (!token) return;
    fetch("http://127.0.0.1:8000/me", { headers: { 'Authorization': `Bearer ${token}` }})
      .then(res => res.json()).then(data => {
        if(data) setStats(prev => ({ ...prev, karma: data.karma_points || 0, badges: data.badges?.length || 0 }));
      }).catch(console.error);
    fetch("http://127.0.0.1:8000/learning/content", { headers: { 'Authorization': `Bearer ${token}` }})
      .then(res => res.json()).then(data => {
        if (data?.content) setStats(prev => ({ ...prev, quests: data.content.filter(item => item.completed).length }));
      }).catch(console.error);
  }, [token]);
  return (
    <div className="dashboard-container">
      <h1>Dashboard</h1>
      <div className="cards-container">
        <div className="dashboard-card" id="badges-card"><h2>Badges Earned</h2><p>Total: {stats.badges}</p></div>
        <div className="dashboard-card" id="quests-card"><h2>Quests Completed</h2><p>Total: {stats.quests}</p></div>
        <div className="dashboard-card" id="karma-card"><h2>Karma Points</h2><p>Total: {stats.karma}</p></div>
      </div>
    </div>
  );
}
// In App.jsx, find and replace the entire StudentsPage function

function StudentsPage() {
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("http://127.0.0.1:8000/students")
      .then(res => res.json())
      .then(data => {
        setStudents(data);
        setLoading(false);
      })
      .catch(error => {
        console.error("Error fetching students:", error);
        setLoading(false);
      });
  }, []);

  if (loading) {
    return <div style={{ padding: "20px" }}><h1>Loading students...</h1></div>;
  }

  return (
    <div className="page-container">
      <h1>Students</h1>
      <div className="student-grid">
        {students.length > 0 ? (
          students.map(student => (
            <div key={student.id} className="student-tile">
              <div className="student-avatar">
                {student.name.charAt(0)}
              </div>
              <h3 className="student-name">{student.name}</h3>
              <div className="student-stats">
                <p><strong>Karma:</strong> {student.karma_points}</p>
                <p><strong>Badges:</strong> {student.badges ? student.badges.length : 0}</p>
              </div>
            </div>
          ))
        ) : (
          <p>No students found in the database.</p>
        )}
      </div>
    </div>
  );
}

function LeaderboardPage() {
  const [leaderboard, setLeaderboard] = useState([]);
  useEffect(() => {
    fetch("http://127.0.0.1:8000/leaderboard")
      .then(res => res.json())
      .then(data => setLeaderboard(data))
      .catch(console.error);
  }, []);
  return (
    <div style={{ padding: "20px" }}>
      <h1>Leaderboard</h1>
      <div className="leaderboard-grid">
        {leaderboard.length > 0 ? (
          leaderboard.map((user, index) => {
            let medalClass = '';
            if (index === 0) medalClass = 'gold-medal';
            else if (index === 1) medalClass = 'silver-medal';
            else if (index === 2) medalClass = 'bronze-medal';
            return (
              <div key={user.id} className={`leaderboard-tile ${medalClass}`}>
                <div className="rank-badge">
                  {index === 0 ? '🥇' : index === 1 ? '🥈' : index === 2 ? '🥉' : <span className="rank-number">{index + 1}</span>}
                </div>
                <h3 className="student-name">{user.name}</h3>
                <p className="karma-points">Karma Points: {user.karma}</p>
              </div>
            );
          })
        ) : (<p>Loading leaderboard...</p>)}
      </div>
    </div>
  );
}
// In App.jsx, replace the QuestsPage function

function QuestsPage() {
  const [quests, setQuests] = useState([]);
  const [questTitle, setQuestTitle] = useState("");
  const [questDescription, setQuestDescription] = useState("");

  // Function to fetch all quests from the backend
  const fetchQuests = () => {
    fetch("http://127.0.0.1:8000/quests")
      .then(res => res.json())
      .then(data => setQuests(data))
      .catch(console.error);
  };

  // Fetch quests when the component first loads
  useEffect(() => {
    fetchQuests();
  }, []);

  const handleCreateQuest = () => {
    if (!questTitle.trim()) return alert("Please enter a title.");
    
    fetch("http://127.0.0.1:8000/quests", {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title: questTitle, description: questDescription }),
    })
    .then(res => res.json())
    .then(() => {
      fetchQuests(); // Re-fetch all quests to update the list
      setQuestTitle("");
      setQuestDescription("");
    })
    .catch(console.error);
  };

  const handleDeleteQuest = (idToDelete) => {
    fetch(`http://127.0.0.1:8000/quests/${idToDelete}`, {
      method: 'DELETE',
    })
    .then(res => res.json())
    .then(() => {
      fetchQuests(); // Re-fetch all quests to update the list
    })
    .catch(console.error);
  };

  return (
    <div className="quests-container">
      <h1>Quest Management</h1>
      <div className="quest-form-container">
        <h2>Create New Quest</h2>
        <input type="text" placeholder="Quest Title" value={questTitle} onChange={(e) => setQuestTitle(e.target.value)} />
        <textarea placeholder="Quest Description" value={questDescription} onChange={(e) => setQuestDescription(e.target.value)}></textarea>
        <button onClick={handleCreateQuest}>Create Quest</button>
      </div>
      <div className="quest-list-container">
        <h2>Existing Quests</h2>
        <ul className="quest-list">
          {quests.length > 0 ? (
            quests.map((quest) => (
              <li key={quest._id}>
                <div className="quest-info">
                  <h3>{quest.title}</h3>
                  <p>{quest.description}</p>
                </div>
                <button className="delete-btn" onClick={() => handleDeleteQuest(quest._id)}>Delete</button>
              </li>
            ))
          ) : (<p>No quests found. Add one using the form above.</p>)}
        </ul>
      </div>
    </div>
  );
}
// --- NEW REPORTS PAGE ---
// In App.jsx, replace the ReportsPage function

function ReportsPage() {
  const handleDownload = (reportType) => {
    // We'll connect the 'students' report for now
    if (reportType !== 'students') {
      alert(`Downloading ${reportType} report... (This is a placeholder)`);
      return;
    }

    fetch("http://127.0.0.1:8000/reports/students")
      .then(response => {
        if (!response.ok) throw new Error("Network response was not ok");
        return response.blob(); // Get the response as a file Blob
      })
      .then(blob => {
        // Create a temporary URL for the blob
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.style.display = 'none';
        a.href = url;
        a.download = 'student_report.csv'; // The filename for the download
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url); // Clean up the URL object
        a.remove();
      })
      .catch(err => console.error('Download error:', err));
  };

  return (
    <div className="reports-container">
      <h1>Download Reports</h1>
      <p>Select a report to download it as a CSV file.</p>
      <div className="report-buttons">
        <button onClick={() => handleDownload('students')}>Download Student Activity Report</button>
        <button onClick={() => handleDownload('quests')}>Download Quest Completion Report</button>
        <button onClick={() => handleDownload('karma')}>Download Karma Points Summary</button>
      </div>
    </div>
  );
}
// --- NEW PROFILE PAGE ---
function ProfilePage() {
  const [profile, setProfile] = useState({ name: "Aksha", email: "teacher2@test.com" });
  const [isEditing, setIsEditing] = useState(false);

  const handleSave = () => {
    setIsEditing(false);
    alert("Profile saved!");
  };

  return (
    <div className="profile-container">
      <h1>Your Profile</h1>
      <div className="profile-card">
        <img src={customTeacherPic} alt="Profile" className="profile-card-pic" />
        {isEditing ? (
          <div className="profile-edit-view">
            <input type="text" value={profile.name} onChange={(e) => setProfile({...profile, name: e.target.value})} />
            <input type="email" value={profile.email} onChange={(e) => setProfile({...profile, email: e.target.value})} />
            <button onClick={handleSave}>Save</button>
          </div>
        ) : (
          <div className="profile-display-view">
            <h2>{profile.name}</h2>
            <p>{profile.email}</p>
            <button onClick={() => setIsEditing(true)}>Edit Profile</button>
          </div>
        )}
      </div>
    </div>
  );
}


// --- MAIN APP COMPONENT ---
function App() {
  const [token, setToken] = useState(null);
  const [teacherName] = useState("Your Name");
  const [profilePic] = useState(customTeacherPic);

  if (!token) {
    return <LoginPage setToken={setToken} />;
  }

  return (
    <Router>
      <div className="app-container">
        <div className="sidebar">
          <div className="sidebar-profile">
            <img src={profilePic} alt="Teacher" className="sidebar-profile-pic" />
            <h3 className="sidebar-profile-name">{teacherName}</h3>
          </div>
          <div className="sidebar-nav">
            <NavLink to="/" end>Dashboard</NavLink>
            <NavLink to="/students">Students</NavLink>
            <NavLink to="/quests">Quests</NavLink>
            <NavLink to="/leaderboard">Leaderboard</NavLink>
            <NavLink to="/reports">Reports</NavLink>
            <NavLink to="/profile">Profile</NavLink>
          </div>
        </div>
        <div className="page-content">
          <Routes>
            <Route path="/" element={<DashboardPage token={token} />} />
            <Route path="/students" element={<StudentsPage />} />
            <Route path="/quests" element={<QuestsPage />} />
            <Route path="/leaderboard" element={<LeaderboardPage />} />
            <Route path="/reports" element={<ReportsPage />} />
            <Route path="/profile" element={<ProfilePage />} />
          </Routes>
        </div>
      </div>
    </Router>
  );
}

export default App;
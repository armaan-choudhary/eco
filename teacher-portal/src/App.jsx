import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Link} from 'react-router-dom';
import Navbar from './components/Navbar';
import './Dashboard.css';

// --- Page Components ---
function DashboardPage() {
  return (
    <div className="dashboard-container">
      <h1>Dashboard</h1>
      <div className="cards-container">
        <div className="dashboard-card" id="badges-card">
          <h2>Badges Earned</h2>
          <p>Total: 150</p>
        </div>
        <div className="dashboard-card" id="quests-card">
          <h2>Quests Completed</h2>
          <p>Total: 75</p>
        </div>
        <div className="dashboard-card" id="karma-card">
          <h2>Karma Points</h2>
          <p>Total: 5000</p>
        </div>
      </div>
    </div>
  );
}

function StudentsPage() {
  const [students, setStudents] = useState([]);

  useEffect(() => {
    fetch('http://127.0.0.1:8000/students')
      .then(response => response.json())
      .then(data => {
        setStudents(data);
      })
      .catch(error => {
        console.error('Error fetching students:', error);
      });
  }, []);

  return (
    <div style={{ padding: '20px' }}>
      <h1>Students Tab</h1>
      <ul style={{ listStyle: 'none', padding: '0' }}>
        {students.length > 0 ? (
          students.map(student => (
            <li key={student.id} style={{ borderBottom: '1px solid #ccc', padding: '15px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <h3>{student.name}</h3>
                <p>Badges: {student.badges} | Karma Points: {student.karma}</p>
              </div>
            </li>
          ))
        ) : (
          <p>Loading students...</p>
        )}
      </ul>
    </div>
  );
}




function QuestsPage() {
  const [questTitle, setQuestTitle] = useState('');
  const [questDescription, setQuestDescription] = useState('');

  const [quests, setQuests] = useState([
    { id: 1, title: 'Plastic-Free Week', status: 'Active' },
    { id: 2, title: 'Water Conservation Challenge', status: 'Completed' },
    { id: 3, title: 'Tree Planting Day', status: 'Scheduled' },
  ]);

  const handleCreateQuest = () => {
    const newQuest = {
      id: quests.length + 1,
      title: questTitle,
      status: 'Active',
    };

    setQuests([...quests, newQuest]);
    setQuestTitle('');
    setQuestDescription('');
  };

  // New function to handle deleting a quest
const handleDownload = (reportType) => {
  console.log(`Downloading ${reportType} report...`);

  // We are making an API call to your backend
  fetch(`http://127.0.0.1:8000/reports/${reportType}`)
    .then(response => {
      if (!response.ok) {
        throw new Error('Network response was not ok');
      }
      return response.blob(); // We use response.blob() because it's a file
    })
    .then(blob => {
      // This part creates a link and clicks it to start the download
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${reportType}_report.csv`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
    })
    .catch(error => {
      console.error('There was a problem with the fetch operation:', error);
      alert('Error downloading report. Check the console for more details.');
    });
};

  return (
    <div style={{ padding: '20px' }}>
      <h1>Quests Tab</h1>

      {/* Form to Add New Quests */}
      <div style={{ marginBottom: '30px', padding: '20px', border: '1px solid #ccc', borderRadius: '8px' }}>
        <h2>Add New Quest</h2>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          <input
            type="text"
            placeholder="Quest Title"
            style={{ padding: '10px' }}
            value={questTitle}
            onChange={(e) => setQuestTitle(e.target.value)}
          />
          <textarea
            placeholder="Quest Description"
            style={{ padding: '10px' }}
            value={questDescription}
            onChange={(e) => setQuestDescription(e.target.value)}
          ></textarea>
          <button
            onClick={handleCreateQuest}
            style={{ padding: '10px', backgroundColor: '#007BFF', color: 'white', border: 'none', cursor: 'pointer' }}
          >
            Create Quest
          </button>
        </div>
      </div>

      {/* List of Existing Quests */}
      <div>
        <h2>Existing Quests</h2>
        <ul style={{ listStyle: 'none', padding: '0' }}>
          {quests.map(quest => (
            <li key={quest.id} style={{ borderBottom: '1px solid #ccc', padding: '15px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h3>{quest.title}</h3>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <span style={{ padding: '5px 10px', borderRadius: '15px', backgroundColor: '#f0f0f0' }}>{quest.status}</span>
                <button
                  onClick={() => handleDelete(quest.id)}
                  style={{ padding: '5px 10px', backgroundColor: '#dc3545', color: 'white', border: 'none', borderRadius: '5px', cursor: 'pointer' }}
                >
                  Delete
                </button>
              </div>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}

function LeaderboardPage() {
  const students = [
    { id: 1, name: 'Student A', karma: 100 },
    { id: 2, name: 'Student B', karma: 75 },
    { id: 3, name: 'Student C', karma: 120 },
    { id: 4, name: 'Student D', karma: 90 },
    { id: 5, name: 'Student E', karma: 150 },
  ];

  const sortedStudents = students.sort((a, b) => b.karma - a.karma);

  return (
    <div style={{ padding: '20px' }}>
      <h1>Leaderboard</h1>
      <ul style={{ listStyle: 'none', padding: '0' }}>
        {sortedStudents.map((student, index) => (
          <li key={student.id} style={{ borderBottom: '1px solid #ccc', padding: '15px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <h3>{index + 1}. {student.name}</h3>
              <p>Karma Points: {student.karma}</p>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
function ReportsPage() {
  const handleDownload = (reportType) => {
    // This is the new API call
    fetch(`http://127.0.0.1:8000/reports/${reportType}`)
      .then(response => {
        if (!response.ok) {
          throw new Error('Network response was not ok');
        }
        return response.blob();
      })
      .then(blob => {
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${reportType}_report.csv`;
        document.body.appendChild(a);
        a.click();
        a.remove();
        window.URL.revokeObjectURL(url);
      })
      .catch(error => {
        console.error('Error:', error);
        alert('Error downloading report. Check the console for details.');
      });
  };

  return (
    <div style={{ padding: '20px' }}>
      <h1>Reports Tab</h1>
      <p>Here you can view and download reports.</p>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '15px', marginTop: '20px' }}>
        <button
          onClick={() => handleDownload('karma')}
          style={{ padding: '10px 20px', backgroundColor: '#007BFF', color: 'white', border: 'none', cursor: 'pointer' }}
        >
          Download Karma Report
        </button>
        <button
          onClick={() => handleDownload('quests')}
          style={{ padding: '10px 20px', backgroundColor: '#007BFF', color: 'white', border: 'none', cursor: 'pointer' }}
        >
          Download Quests Report
        </button>
      </div>
    </div>
  );
}
// --- Main App Component ---
function App() {
  return (
    <Router>
      <Navbar />
      <div className="page-container">
        <Routes>
          <Route path="/" element={<DashboardPage />} />
          <Route path="/students" element={<StudentsPage />} />
          <Route path="/quests" element={<QuestsPage />} />
          <Route path="/leaderboard" element={<LeaderboardPage />} />
          <Route path="/reports" element={<ReportsPage />} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;
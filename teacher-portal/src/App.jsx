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
    const fetchOptions = { headers: { 'Authorization': `Bearer ${token}` }, cache: 'no-cache' };
    fetch("http://127.0.0.1:8000/me", fetchOptions)
      .then(res => res.json()).then(data => {
        if(data) setStats(prev => ({ ...prev, karma: data.karma_points || 0, badges: data.badges?.length || 0 }));
      }).catch(console.error);
    fetch("http://127.0.0.1:8000/learning/content", fetchOptions)
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

function StudentsPage() {
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    fetch("http://127.0.0.1:8000/students", { cache: 'no-cache' })
      .then(res => res.json())
      .then(data => {
        setStudents(data);
        setLoading(false);
      }).catch(error => {
        console.error("Error fetching students:", error);
        setLoading(false);
      });
  }, []);
  if (loading) return <div className="page-container"><h1>Loading students...</h1></div>;
  return (
    <div className="page-container">
      <h1>Students</h1>
      <div className="student-grid">
        {students.length > 0 ? (
          students.map(student => (
            <div key={student.id} className="student-tile">
              <div className="student-avatar">{student.name.charAt(0)}</div>
              <h3 className="student-name">{student.name}</h3>
              <div className="student-stats">
                <p><strong>Karma:</strong> {student.karma_points}</p>
                <p><strong>Badges:</strong> {student.badges ? student.badges.length : 0}</p>
              </div>
            </div>
          ))
        ) : (<p>No students found in the database.</p>)}
      </div>
    </div>
  );
}

function LeaderboardPage() {
  const [leaderboard, setLeaderboard] = useState([]);
  useEffect(() => {
    fetch("http://127.0.0.1:8000/leaderboard", { cache: 'no-cache' })
      .then(res => res.json())
      .then(data => setLeaderboard(data))
      .catch(console.error);
  }, []);
  return (
    <div className="page-container">
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
                <div className="rank-badge">{index === 0 ? '🥇' : index === 1 ? '🥈' : index === 2 ? '🥉' : <span className="rank-number">{index + 1}</span>}</div>
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

function QuestsPage() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalView, setModalView] = useState('');
  const [quests, setQuests] = useState([]);
  const [lessonTitle, setLessonTitle] = useState('');
  const [lessonContent, setLessonContent] = useState('');
  const [quizTitle, setQuizTitle] = useState('');
  const [questions, setQuestions] = useState([{ question_text: '', options: ['', '', '', ''], correct_answer_index: 0 }]);

  const fetchQuests = () => {
    fetch("http://127.0.0.1:8000/quests", { cache: 'no-cache' })
      .then(res => res.json()).then(data => setQuests(data)).catch(console.error);
  };
  useEffect(() => { fetchQuests(); }, []);

  const openModal = (view) => { setModalView(view); setIsModalOpen(true); };
  const closeModal = () => {
    setIsModalOpen(false);
    setLessonTitle(''); setLessonContent(''); setQuizTitle('');
    setQuestions([{ question_text: '', options: ['', '', '', ''], correct_answer_index: 0 }]);
  };
  const handleAddQuestion = () => setQuestions([...questions, { question_text: '', options: ['', '', '', ''], correct_answer_index: 0 }]);
  const handleQuestionChange = (index, field, value) => { const newQ = [...questions]; newQ[index][field] = value; setQuestions(newQ); };
  const handleOptionChange = (qIndex, oIndex, value) => { const newQ = [...questions]; newQ[qIndex].options[oIndex] = value; setQuestions(newQ); };
  
  // --- NEW, MORE RELIABLE SAVE LOGIC ---
  const handleSaveLesson = () => {
    fetch("http://127.0.0.1:8000/lessons", { 
      method: 'POST', 
      headers: { 'Content-Type': 'application/json' }, 
      body: JSON.stringify({ title: lessonTitle, content: lessonContent }), 
    })
    .then(res => res.json())
    .then(newLesson => {
      // Create a complete quest object with an empty questions array
      const updatedLesson = { ...newLesson, questions: [], type: 'lesson' };
      setQuests(prevQuests => [updatedLesson, ...prevQuests]); // Add new lesson to the top of the list
      closeModal(); 
    })
    .catch(console.error);
  };

  const handleSaveQuiz = () => {
    fetch("http://127.0.0.1:8000/quizzes", { 
      method: 'POST', 
      headers: { 'Content-Type': 'application/json' }, 
      body: JSON.stringify({ title: quizTitle, questions }), 
    })
    .then(res => res.json())
    .then(newQuiz => {
      // Add the new quiz to the state with the correct type
      const updatedQuiz = { ...newQuiz, type: 'quiz' };
      setQuests(prevQuests => [updatedQuiz, ...prevQuests]); // Add new quiz to the top of the list
      closeModal(); 
    })
    .catch(console.error);
  };

  const handleDeleteQuest = (idToDelete) => {
    fetch(`http://127.0.0.1:8000/quests/${idToDelete}`, { method: 'DELETE' })
    .then(res => {
      if (res.ok) {
        setQuests(prevQuests => prevQuests.filter(quest => quest._id !== idToDelete));
      }
    })
    .catch(console.error);
  };

  return (
    <div className="quests-container">
      <h1>Quest Management</h1>
      <div className="view-actions">
        <button onClick={() => openModal('lesson')}>+ Create New Lesson</button>
        <button onClick={() => openModal('quiz')}>+ Create New Quiz</button>
      </div>
      <div className="quest-list-container">
        <h2>Existing Quests</h2>
        <div className="quest-grid">
          {quests.map(quest => (
            <div key={quest._id} className="quest-tile">
              <span className={`quest-type-badge ${quest.type}`}>{quest.type}</span>
              <div className="quest-info">
                <h3>{quest.title}</h3>
                <p>{quest.type === 'lesson' ? '📖 Lesson' : `❓ ${quest.questions?.length || 0} Questions`}</p>
              </div>
              <button className="delete-btn" onClick={() => handleDeleteQuest(quest._id)}>&times;</button>
            </div>
          ))}
        </div>
      </div>
      {isModalOpen && (
        <div className="modal-overlay" onClick={closeModal}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <button className="close-modal-btn" onClick={closeModal}>&times;</button>
            {modalView === 'lesson' && (
              <div className="quest-form-container">
                <h2>Create New Lesson</h2>
                <input type="text" placeholder="Lesson Title" value={lessonTitle} onChange={e => setLessonTitle(e.target.value)} />
                <textarea placeholder="Lesson content..." rows="8" value={lessonContent} onChange={e => setLessonContent(e.target.value)}></textarea>
                <div className="form-actions"><button onClick={handleSaveLesson}>Save Lesson</button></div>
              </div>
            )}
            {modalView === 'quiz' && (
              <div className="quest-form-container">
                <h2>Create New Quiz</h2>
                <input type="text" placeholder="Quiz Title" value={quizTitle} onChange={e => setQuizTitle(e.target.value)} />
                {questions.map((q, qIndex) => (
                  <div key={qIndex} className="quiz-question-builder">
                    <h4>Question {qIndex + 1}</h4>
                    <input type="text" placeholder="Question Text" value={q.question_text} onChange={e => handleQuestionChange(qIndex, 'question_text', e.target.value)} />
                    {q.options.map((opt, oIndex) => (
                      <div className="quiz-option-builder" key={oIndex}>
                        <input type="radio" name={`correct_answer_${qIndex}`} checked={q.correct_answer_index === oIndex} onChange={() => handleQuestionChange(qIndex, 'correct_answer_index', oIndex)} />
                        <input type="text" placeholder={`Option ${oIndex + 1}`} value={opt} onChange={e => handleOptionChange(qIndex, oIndex, e.target.value)} />
                      </div>
                    ))}
                  </div>
                ))}
                <button className="secondary-btn" onClick={handleAddQuestion}>Add Another Question</button>
                <div className="form-actions"><button onClick={handleSaveQuiz}>Save Quiz</button></div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

function ReportsPage() {
  const handleDownload = (reportType, filename) => {
    let url = '';
    switch (reportType) {
      case 'students': url = 'http://127.0.0.1:8000/reports/students'; break;
      case 'quests': url = 'http://127.0.0.1:8000/reports/quests_completion'; break;
      case 'karma': url = 'http://127.0.0.1:8000/reports/karma'; break;
      default: return;
    }
    fetch(url).then(response => response.blob()).then(blob => {
      const downloadUrl = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.style.display = 'none';
      a.href = downloadUrl;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(downloadUrl);
      a.remove();
    }).catch(err => console.error('Download error:', err));
  };
  return (
    <div className="reports-container">
      <h1>Download Reports</h1>
      <p>Select a report to download it as a CSV file.</p>
      <div className="report-buttons">
        <button onClick={() => handleDownload('students', 'student_report.csv')}>Download Student Activity Report</button>
        <button onClick={() => handleDownload('quests', 'quest_completion_report.csv')}>Download Quest Completion Report</button>
        <button onClick={() => handleDownload('karma', 'karma_points_summary.csv')}>Download Karma Points Summary</button>
      </div>
    </div>
  );
}

function ProfilePage() {
  const [profile, setProfile] = useState({ name: "Aksha", email: "teacher2@test.com" });
  const [isEditing, setIsEditing] = useState(false);
  const handleSave = () => { setIsEditing(false); alert("Profile saved!"); };
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
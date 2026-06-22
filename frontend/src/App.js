import React, { useState, useEffect } from 'react';
import './App.css';
import axios from 'axios';

function App() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const response = await axios.get('http://localhost:5000/api/users');
      setUsers(response.data);
      setError(null);
    } catch (err) {
      setError('Failed to fetch users. Make sure the backend is running.');
      console.error('Error fetching users:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="App">
      <header className="App-header">
        <h1>Welcome to Airjet</h1>
        <p>Your Aviation Management Solution</p>
      </header>
      
      <main className="App-main">
        <div className="container">
          <h2>User Management</h2>
          
          {loading && <p className="loading">Loading users...</p>}
          
          {error && <p className="error">{error}</p>}
          
          {!loading && !error && (
            <div className="user-list">
              <h3>Users ({users.length})</h3>
              {users.length === 0 ? (
                <p>No users found. Add some users through the API.</p>
              ) : (
                <ul>
                  {users.map(user => (
                    <li key={user._id} className="user-item">
                      <strong>{user.name}</strong> - {user.email}
                      <span className={`role-badge ${user.role}`}>{user.role}</span>
                    </li>
                  ))}
                </ul>
              )}
              <button onClick={fetchUsers} className="refresh-btn">
                Refresh Users
              </button>
            </div>
          )}
        </div>
      </main>
      
      <footer className="App-footer">
        <p>&copy; 2024 Airjet. All rights reserved.</p>
      </footer>
    </div>
  );
}

export default App;

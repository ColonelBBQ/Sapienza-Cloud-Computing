import { Authenticator } from '@aws-amplify/ui-react'
import '@aws-amplify/ui-react/styles.css'
import { useEffect, useState } from "react";
import { BrowserRouter as Router, Routes, Route, useNavigate } from 'react-router-dom';
import type { Schema } from "../amplify/data/resource";
import { generateClient } from "aws-amplify/data";
import { fetchUserAttributes } from '@aws-amplify/auth';
import { Amplify } from 'aws-amplify';
import outputs from "../amplify_outputs.json";
import NewSession from './pages/NewSession';
import { format } from 'date-fns';

Amplify.configure(outputs);

const client = generateClient<Schema>({});

function Home() {
  const [sessions, setSessions] = useState<Array<Schema["Sessions"]["type"]>>([]);
  const [userName, setUserName] = useState<string>("");
  const navigate = useNavigate();

  useEffect(() => {
    client.models.Sessions.observeQuery().subscribe({
      next: (data) => setSessions([...data.items]),
    });

    fetchUserAttributes().then(attributes => {
      setUserName(attributes.given_name || attributes.givenName || "User");
    }).catch(console.error);
  }, []);

  return (
    <Authenticator signUpAttributes={['given_name', "email"]} socialProviders={['apple', 'google']}>
      {({ signOut }) => (
        <div className='app-container'>
          <div className='nav-container'>
            <button onClick={signOut}>Sign out</button>
          </div>
          <h1>Hi {userName}! Welcome to Your Meditation Diary!</h1>
          <div>
            <h3>Here are Your Recent Activities:</h3>
            <ul>
              {sessions.map((session) => (
                <li key={session.id}>
                  <div className='container-sessions'>
                    <div className='session'>
                      <div>Date: {format(new Date(session.createdAt), 'yyyy-MM-dd')}, Volume: {session.score_volume}, Rating: {session.score_rating}</div>
                      <div>Session Description: {session.content}</div>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
            <button onClick={() => navigate('/new-session')}>Start New Session!</button>
          </div>
        </div>
      )}
    </Authenticator>
  );
}

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/new-session" element={<NewSession client={client}/>} />
      </Routes>
    </Router>
  );
}

export default App;

import { Authenticator } from '@aws-amplify/ui-react'
import '@aws-amplify/ui-react/styles.css'
import { useEffect, useState } from "react";
import type { Schema } from "../amplify/data/resource";
import { generateClient } from "aws-amplify/data";
import { fetchUserAttributes } from '@aws-amplify/auth';
import { Amplify } from 'aws-amplify';
import outputs from "../amplify_outputs.json";
import Home from './pages/Home';
import HomeNoSession from './pages/HomeNoSession';
import { format } from 'date-fns';


Amplify.configure(outputs);

const client = generateClient<Schema>({});

function App() {
  const [sessions, setSessions] = useState<Array<Schema["Sessions"]["type"]>>([]);
  const [userName, setUserName] = useState<string>("");

  useEffect(() => {
    client.models.Sessions.observeQuery().subscribe({
      next: (data) => setSessions([...data.items]),
    });

  fetchUserAttributes().then(attributes => {
    setUserName(attributes.given_name || attributes.givenName || "User");
    }).catch(console.error);
  }, []);


  return (
    <Authenticator signUpAttributes={['given_name', "email"]} socialProviders={['apple', 'google']} >
      {({ signOut }) => {
        return (
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
                        <div>Date: {format(new Date(session.createdAt), 'yyyy-MM-dd')}, Duration: {format(new Date(session.createdAt), 'HH:mm')}, Rating: {session.score_rating}</div>
                        <div>Session Description: {session.content}</div>
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
              <button>Start New Session!</button>
            </div>

          </div>
        );
      }}
    </Authenticator>
  );
}

export default App;
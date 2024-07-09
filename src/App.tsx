import { Authenticator } from '@aws-amplify/ui-react'
import '@aws-amplify/ui-react/styles.css'
import { useEffect, useState } from "react";
import type { Schema } from "../amplify/data/resource";
import { generateClient } from "aws-amplify/data";
import { fetchUserAttributes } from '@aws-amplify/auth';
import { Amplify } from 'aws-amplify';
import outputs from "../amplify_outputs.json";

Amplify.configure(outputs);

const client = generateClient<Schema>({
  authMode: 'userPool',
});

function App() {
  const [sessions, setSessions] = useState<Array<Schema["Sessions"]["type"]>>([]);
  const [userName, setUserName] = useState<string>("");
  const [content, setContent] = useState('');
  const [rating, setRating] = useState('');

  useEffect(() => {
    client.models.Sessions.observeQuery().subscribe({
      next: (data) => setSessions([...data.items]),
    });

  fetchUserAttributes().then(attributes => {
    setUserName(attributes.given_name || attributes.givenName || "User");
    }).catch(console.error);
  }, []);
    
  function deleteSession(id: string) {
    client.models.Sessions.delete({ id })
  }

  async function createSession() {
    if (!content || !rating) {
      alert('Please enter both content and rating');
      return;
    }

    const numericRating = parseInt(rating, 10);
    if (numericRating < 1 || numericRating > 5) {
      alert('Rating must be between 1 and 5');
      return;
    }

    try {
      await client.models.Sessions.create({
        content: content,
        score_rating: numericRating,
        score_volume: 0
      });
      
      setContent('');
      setRating('');
      
      alert('Session created successfully!');
    } catch (error) {
      console.error('Error creating session:', error);
      alert('Failed to create session. Please try again.');
    }
  }

  return (
    <Authenticator signUpAttributes={['given_name', "email"]} socialProviders={['apple', 'google']} >
      {({ signOut }) => {
        return (
          <main>
            <h1>{userName}'s Meditation Sessions</h1>
            <div className='container-activity'>
              <input 
                type="text" 
                placeholder="Enter content"
                value={content}
                onChange={(e) => setContent(e.target.value)}
              />
              <input 
                type="number" 
                min="1" 
                max="5"
                placeholder="Rate (1-5)"
                value={rating}
                onChange={(e) => setRating(e.target.value)}
              />
              <button onClick={createSession}>Send</button>
            </div>
            <ul>
              {sessions.map((session) => (
                <li 
                  onClick={() => deleteSession(session.id)}
                  key={session.id}>{session.content}</li>
              ))}
            </ul>
            <button onClick={signOut}>Sign out</button>
          </main>
        );
      }}
    </Authenticator>
  );
}

export default App;
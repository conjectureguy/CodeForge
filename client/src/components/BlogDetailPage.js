// src/components/BlogDetailPage.js
import React, { useEffect, useState } from 'react';
import { Card, Button, Form, Alert, Container } from 'react-bootstrap';
import { useParams } from 'react-router-dom';
import io from 'socket.io-client';
import './community.css';

const socket = io('http://localhost:5000');

// Component for individual reply item
const ReplyItem = ({ reply, loggedInUser, voteReply, submitReply }) => {
  const [replyInput, setReplyInput] = useState('');
  const replyUserVote = loggedInUser && reply.voted_by ? reply.voted_by.find(v => v.user === loggedInUser) : null;

  return (
    <Card className="blog-card reply-card">
      <Card.Body>
        <Card.Subtitle className="mb-2 text-muted">
          {reply.author} - {new Date(reply.createdAt).toLocaleString()}
        </Card.Subtitle>
        <Card.Text>{reply.content}</Card.Text>
        <div className="vote-container">
          <div className="vote-buttons">
            <Button
              className={`upvote ${replyUserVote && replyUserVote.vote === 1 ? "active" : ""}`}
              size="sm"
              variant='outline-dark'
              onClick={() => voteReply(reply._id, 'up')}
            >
              ▲
            </Button>
            <span className="vote-count"> {reply.votes} </span>
            <Button
              className={`downvote ${replyUserVote && replyUserVote.vote === -1 ? "active" : ""}`}
              size="sm"
              variant='outline-dark'
              onClick={() => voteReply(reply._id, 'down')}
            >
              ▼
            </Button>
          </div>
        </div>
        
        <Form className="mt-3">
          <Form.Group>
            <Form.Control 
              type="text" 
              placeholder="Reply..." 
              value={replyInput} 
              onChange={(e) => setReplyInput(e.target.value)} 
            />
            <Button 
              variant="dark" 
              className="mt-2 w-100" 
              onClick={() => { 
                submitReply(reply._id, replyInput); 
                setReplyInput(''); 
              }}
            >
              Reply
            </Button>
          </Form.Group>
        </Form>

        {reply.replies && reply.replies.length > 0 && (
          <div className="nested-reply mt-3">
            {reply.replies.map(childReply => (
              <ReplyItem 
                key={childReply._id} 
                reply={childReply} 
                loggedInUser={loggedInUser} 
                voteReply={voteReply} 
                submitReply={submitReply} 
              />
            ))}
          </div>
        )}
      </Card.Body>
    </Card>
  );
};

const BlogDetailPage = ({ currentUser }) => {
  const { postId } = useParams();
  const [post, setPost] = useState(null);
  const [mainReplyText, setMainReplyText] = useState('');
  const [error, setError] = useState('');

  const loggedInUser = currentUser || localStorage.getItem('myHandle');

  const fetchPost = async () => {
    try {
      const res = await fetch(`http://localhost:5000/api/community/posts/${postId}`);
      if (!res.ok) throw new Error('Failed to fetch post');
      const data = await res.json();
      setPost(data);
    } catch (err) {
      console.error('Error fetching post:', err);
      setError('Error fetching post.');
    }
  };

  useEffect(() => {
    fetchPost();
    socket.on('postUpdated', (updatedPost) => {
      if (updatedPost._id === postId) setPost(updatedPost);
    });
    return () => {
      socket.off('postUpdated');
    };
  }, [postId]);

  const submitReply = async (parentReplyId, text) => {
    if (!text.trim()) return;
    if (!loggedInUser) {
      setError('You must be logged in to reply');
      return;
    }
    try {
      await fetch(`http://localhost:5000/api/community/posts/${postId}/reply`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: text, author: loggedInUser, parentReplyId })
      });
      setError('');
      fetchPost();
    } catch (err) {
      console.error('Error submitting reply:', err);
      setError('Error submitting reply.');
    }
  };

  const votePost = async (type) => {
    if (!loggedInUser) return alert("Please log in to vote");
    await fetch(`http://localhost:5000/api/community/posts/${postId}/vote`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ type, user: loggedInUser })
    });
    fetchPost();
  };

  const voteReply = async (replyId, type) => {
    if (!loggedInUser) return alert("Please log in to vote");
    await fetch(`http://localhost:5000/api/community/posts/${postId}/reply/${replyId}/vote`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ type, user: loggedInUser })
    });
    fetchPost();
  };

  if (!post) {
    return (
      <Container>
        <p>Loading post...</p>
        {error && <Alert variant="danger">{error}</Alert>}
      </Container>
    );
  }

  const userVote = loggedInUser && post.voted_by ? post.voted_by.find(v => v.user === loggedInUser) : null;

  return (
    <Container className="community-container">
      <Card className="blog-card my-3">
        <Card.Body>
          <Card.Title>{post.title}</Card.Title>
          <Card.Subtitle className="mb-2 text-muted">
            {post.author} - {new Date(post.createdAt).toLocaleString()}
          </Card.Subtitle>
          <Card.Text>{post.content}</Card.Text>
          <div className="vote-container">
            <div className="vote-buttons">
              <Button
                className={`upvote ${userVote && userVote.vote === 1 ? "active" : ""}`}
                size="sm"
                variant='outline-dark'
                onClick={() => votePost('up')}
              >
                ▲
              </Button>
              <span className="vote-count"> {post.votes} </span>
              <Button
                className={`downvote ${userVote && userVote.vote === -1 ? "active" : ""}`}
                size="sm"
                variant='outline-dark'
                onClick={() => votePost('down')}
              >
                ▼
              </Button>
            </div>
          </div>
        </Card.Body>
      </Card>
      
      <div className="community-header">
        <h3>Replies</h3>
      </div>

      {error && <Alert variant="danger">{error}</Alert>}
      
      <Form className="post-form mb-3">
        <Form.Group>
          <Form.Control
            as="textarea"
            placeholder="Add a reply..."
            value={mainReplyText}
            onChange={(e) => setMainReplyText(e.target.value)}
          />
        </Form.Group>
        <Button 
          variant="dark" 
          className="mt-3 w-100" 
          onClick={() => { 
            submitReply(null, mainReplyText); 
            setMainReplyText(''); 
          }}
        >
          Submit Reply
        </Button>
      </Form>
      
      {post.replies && post.replies.length > 0 && (
        <div className="mt-3">
          {post.replies.map(reply => (
            <ReplyItem 
              key={reply._id} 
              reply={reply} 
              loggedInUser={loggedInUser} 
              voteReply={voteReply} 
              submitReply={submitReply} 
            />
          ))}
        </div>
      )}
    </Container>
  );
};

export default BlogDetailPage;
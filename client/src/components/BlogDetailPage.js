// src/components/BlogDetailPage.js
import React, { useEffect, useState } from 'react';
import { Card, Button, Form, Alert, Container } from 'react-bootstrap';
import { useParams } from 'react-router-dom';
import io from 'socket.io-client';

const socket = io('http://localhost:5000');

// Component for individual reply item, including its nested replies.
const ReplyItem = ({ reply, loggedInUser, voteReply, submitReply }) => {
  const [replyInput, setReplyInput] = useState('');
  const replyUserVote = loggedInUser && reply.voted_by
    ? reply.voted_by.find(v => v.user === loggedInUser)
    : null;

  return (
    <Card className="mb-2">
      <Card.Body>
        <Card.Subtitle className="mb-2 text-muted">
          {reply.author} - {new Date(reply.createdAt).toLocaleString()}
        </Card.Subtitle>
        <Card.Text>{reply.content}</Card.Text>
        <div className="d-flex align-items-center">
          <Button 
            variant="success" 
            size="sm" 
            disabled={replyUserVote && replyUserVote.vote === 1}
            onClick={() => voteReply(reply._id, 'up')}
          >
            Upvote
          </Button>
          <span className="mx-2">{reply.votes}</span>
          <Button 
            variant="danger" 
            size="sm" 
            disabled={replyUserVote && replyUserVote.vote === -1}
            onClick={() => voteReply(reply._id, 'down')}
          >
            Downvote
          </Button>
        </div>
        {/* Local reply input for nested replies */}
        <Form.Group className="mt-2">
          <Form.Control 
            type="text" 
            placeholder="Reply..."
            value={replyInput}
            onChange={(e) => setReplyInput(e.target.value)}
          />
          <Button 
            variant="primary" 
            size="sm" 
            className="mt-1" 
            onClick={() => {
              submitReply(reply._id, replyInput);
              setReplyInput('');
            }}
          >
            Reply
          </Button>
        </Form.Group>
        {reply.replies && reply.replies.length > 0 && (
          <div className="ms-4">
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
  const [mainReplyText, setMainReplyText] = useState(''); // top-level reply input
  const [error, setError] = useState('');

  // Use currentUser prop or fallback to localStorage
  const loggedInUser = currentUser || localStorage.getItem('myHandle');

  const fetchPost = async () => {
    try {
      const res = await fetch(`http://localhost:5000/api/community/posts/${postId}`);
      if (!res.ok) {
        throw new Error('Failed to fetch post');
      }
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

  // submitReply handles both top-level (parentReplyId === null) and nested replies.
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

  const userVote = loggedInUser && post.voted_by
    ? post.voted_by.find(v => v.user === loggedInUser)
    : null;

  return (
    <Container>
      <Card className="my-3">
        <Card.Body>
          <Card.Title>{post.title}</Card.Title>
          <Card.Subtitle className="mb-2 text-muted">
            {post.author} - {new Date(post.createdAt).toLocaleString()}
          </Card.Subtitle>
          <Card.Text>{post.content}</Card.Text>
          <div className="d-flex justify-content-between align-items-center">
            <div>
              <Button 
                variant="success" 
                size="sm" 
                disabled={userVote && userVote.vote === 1}
                onClick={() => votePost('up')}
              >
                Upvote
              </Button>
              <span className="mx-2">{post.votes}</span>
              <Button 
                variant="danger" 
                size="sm" 
                disabled={userVote && userVote.vote === -1}
                onClick={() => votePost('down')}
              >
                Downvote
              </Button>
            </div>
          </div>
        </Card.Body>
      </Card>
      
      <h5>Replies</h5>
      {error && <Alert variant="danger">{error}</Alert>}
      {/* Top-level reply input */}
      <Form.Group className="mb-3">
        <Form.Control 
          type="text" 
          placeholder="Add a reply..." 
          value={mainReplyText} 
          onChange={(e) => setMainReplyText(e.target.value)}
        />
      </Form.Group>
      <Button 
        variant="secondary" 
        onClick={() => {
          submitReply(null, mainReplyText);
          setMainReplyText('');
        }}
      >
        Submit Reply
      </Button>
      
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

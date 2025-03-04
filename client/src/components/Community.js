import React, { useEffect, useState } from 'react';
import { Card, Button, Form, Alert } from 'react-bootstrap';
import io from 'socket.io-client';

// Connect to your backend Socket.io server (adjust the URL if necessary)
const socket = io('http://localhost:5000');

const Community = () => {
  const [posts, setPosts] = useState([]);
  const [newPost, setNewPost] = useState({ title: '', content: '', author: '' });
  const [error, setError] = useState('');

  // Fetch posts from the backend
  const fetchPosts = async () => {
    try {
      const res = await fetch('http://localhost:5000/api/community/posts');
      const data = await res.json();
      setPosts(data);
    } catch (err) {
      console.error('Error fetching posts:', err);
    }
  };

  useEffect(() => {
    fetchPosts();
    // Listen for real-time events
    socket.on('postCreated', (post) => {
      setPosts(prev => [post, ...prev]);
    });
    socket.on('postUpdated', (updatedPost) => {
      setPosts(prev => prev.map(post => post._id === updatedPost._id ? updatedPost : post));
    });
    return () => {
      socket.off('postCreated');
      socket.off('postUpdated');
    };
  }, []);

  const handlePostChange = (e) => {
    setNewPost({ ...newPost, [e.target.name]: e.target.value });
  };

  const submitPost = async (e) => {
    e.preventDefault();
    if (!newPost.title || !newPost.content || !newPost.author) {
      setError('Please fill in all fields');
      return;
    }
    try {
      const res = await fetch('http://localhost:5000/api/community/posts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newPost)
      });
      if (res.ok) {
        setNewPost({ title: '', content: '', author: '' });
        setError('');
      } else {
        const data = await res.json();
        setError(data.error || 'Error creating post');
      }
    } catch (err) {
      setError('Error creating post');
    }
  };

  const votePost = async (postId, type) => {
    try {
      await fetch(`http://localhost:5000/api/community/posts/${postId}/vote`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type })
      });
    } catch (err) {
      console.error('Error voting:', err);
    }
  };

  const addReply = async (postId, replyContent, parentReplyId = null, replyAuthor) => {
    if (!replyContent || !replyAuthor) return;
    try {
      await fetch(`http://localhost:5000/api/community/posts/${postId}/reply`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: replyContent, author: replyAuthor, parentReplyId })
      });
    } catch (err) {
      console.error('Error adding reply:', err);
    }
  };

  // Recursive component to render nested replies
  const RenderReplies = ({ replies, postId }) => {
    const [replyInput, setReplyInput] = useState({});
    const [replyAuthor, setReplyAuthor] = useState({});

    const handleReplyChange = (replyId, value) => {
      setReplyInput(prev => ({ ...prev, [replyId]: value }));
    };
    const handleAuthorChange = (replyId, value) => {
      setReplyAuthor(prev => ({ ...prev, [replyId]: value }));
    };

    return (
      <div className="nested-replies" style={{ marginLeft: '20px' }}>
        {replies && replies.map(reply => (
          <div key={reply._id} style={{ marginBottom: '10px' }}>
            <Card>
              <Card.Body>
                <Card.Subtitle className="mb-2 text-muted">
                  {reply.author} - {new Date(reply.createdAt).toLocaleString()}
                </Card.Subtitle>
                <Card.Text>{reply.content}</Card.Text>
                <div>
                  <Button variant="success" size="sm" onClick={() => console.log(`Upvote reply ${reply._id}`)}>+</Button>
                  <span style={{ margin: '0 8px' }}>{reply.votes}</span>
                  <Button variant="danger" size="sm" onClick={() => console.log(`Downvote reply ${reply._id}`)}>-</Button>
                </div>
                <Form.Group className="mt-2">
                  <Form.Control 
                    type="text" 
                    placeholder="Your name" 
                    value={replyAuthor[reply._id] || ''}
                    onChange={(e) => handleAuthorChange(reply._id, e.target.value)}
                  />
                  <Form.Control 
                    type="text" 
                    placeholder="Reply" 
                    value={replyInput[reply._id] || ''}
                    onChange={(e) => handleReplyChange(reply._id, e.target.value)}
                  />
                  <Button 
                    variant="primary" 
                    size="sm" 
                    onClick={() => {
                      addReply(postId, replyInput[reply._id], reply._id, replyAuthor[reply._id]);
                      setReplyInput(prev => ({ ...prev, [reply._id]: '' }));
                      setReplyAuthor(prev => ({ ...prev, [reply._id]: '' }));
                    }}
                    className="mt-1"
                  >
                    Reply
                  </Button>
                </Form.Group>
                {reply.replies && reply.replies.length > 0 && (
                  <RenderReplies replies={reply.replies} postId={postId} />
                )}
              </Card.Body>
            </Card>
          </div>
        ))}
      </div>
    );
  };

  return (
    <div>
      <h3>Community Blog</h3>
      {error && <Alert variant="danger">{error}</Alert>}
      <Form onSubmit={submitPost} className="mb-4">
        <Form.Group controlId="postTitle">
          <Form.Label>Title</Form.Label>
          <Form.Control 
            type="text" 
            name="title" 
            placeholder="Enter title" 
            value={newPost.title} 
            onChange={handlePostChange} 
          />
        </Form.Group>
        <Form.Group controlId="postContent" className="mt-2">
          <Form.Label>Content</Form.Label>
          <Form.Control 
            as="textarea" 
            name="content" 
            placeholder="Enter your blog content" 
            value={newPost.content} 
            onChange={handlePostChange} 
          />
        </Form.Group>
        <Form.Group controlId="postAuthor" className="mt-2">
          <Form.Label>Your Name</Form.Label>
          <Form.Control 
            type="text" 
            name="author" 
            placeholder="Enter your name" 
            value={newPost.author} 
            onChange={handlePostChange} 
          />
        </Form.Group>
        <Button variant="primary" type="submit" className="mt-3">
          Post
        </Button>
      </Form>

      {posts.map(post => (
        <Card key={post._id} className="mb-3">
          <Card.Body>
            <Card.Title>{post.title}</Card.Title>
            <Card.Subtitle className="mb-2 text-muted">
              {post.author} - {new Date(post.createdAt).toLocaleString()}
            </Card.Subtitle>
            <Card.Text>{post.content}</Card.Text>
            <div className="d-flex align-items-center">
              <Button variant="success" size="sm" onClick={() => votePost(post._id, 'up')}>Upvote</Button>
              <span className="mx-2">{post.votes}</span>
              <Button variant="danger" size="sm" onClick={() => votePost(post._id, 'down')}>Downvote</Button>
            </div>
            {/* Reply Section */}
            <div className="mt-3">
              <h6>Replies</h6>
              <Form.Group className="mb-2">
                <Form.Control 
                  type="text" 
                  placeholder="Your name" 
                  id={`author-${post._id}`} 
                />
              </Form.Group>
              <Form.Group className="mb-2">
                <Form.Control 
                  type="text" 
                  placeholder="Add a reply..." 
                  id={`reply-${post._id}`} 
                />
              </Form.Group>
              <Button 
                variant="secondary" 
                size="sm" 
                onClick={() => {
                  const replyContent = document.getElementById(`reply-${post._id}`).value;
                  const replyAuthor = document.getElementById(`author-${post._id}`).value;
                  addReply(post._id, replyContent, null, replyAuthor);
                  document.getElementById(`reply-${post._id}`).value = '';
                  document.getElementById(`author-${post._id}`).value = '';
                }}
              >
                Reply
              </Button>
              {post.replies && post.replies.length > 0 && (
                <RenderReplies replies={post.replies} postId={post._id} />
              )}
            </div>
          </Card.Body>
        </Card>
      ))}
    </div>
  );
};

export default Community;

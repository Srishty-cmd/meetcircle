import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import io from 'socket.io-client';
import { JitsiMeeting } from '@jitsi/react-sdk';
import './Groups.css';

function Groups({ apiBase, getToken, getErrorMessage, currentUser, onNavigateLogin }) {
  const [groups, setGroups] = useState([]);
  const [activeGroup, setActiveGroup] = useState(null);
  const [messages, setMessages] = useState([]);
  const [messageInput, setMessageInput] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showMeeting, setShowMeeting] = useState(false);
  const [newGroupName, setNewGroupName] = useState('');
  const [newGroupDesc, setNewGroupDesc] = useState('');
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef(null);
  const socketRef = useRef(null);
  const messagesEndRef = useRef(null);

  const authHeaders = () => {
    const token = getToken();
    return token ? { Authorization: `Bearer ${token}` } : {};
  };

  const fetchGroups = async () => {
    const token = getToken();
    if (!token) {
      setLoading(false);
      return;
    }
    try {
      const res = await axios.get(`${apiBase}/api/groups`, { headers: authHeaders() });
      setGroups(res.data);
    } catch (err) {
      setError('Could not load groups.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchGroups();
  }, [apiBase, getToken]);

  useEffect(() => {
    if (activeGroup) {
      socketRef.current = io(apiBase);
      socketRef.current.emit('joinRoom', activeGroup._id);

      socketRef.current.on('message', (msg) => {
        setMessages((prev) => [...prev, msg]);
        scrollToBottom();
      });

      const fetchMessages = async () => {
        try {
          const res = await axios.get(`${apiBase}/api/groups/${activeGroup._id}/messages`, { headers: authHeaders() });
          setMessages(res.data);
          scrollToBottom();
        } catch (err) {
          console.error('Fetch messages failed');
        }
      };
      fetchMessages();

      return () => {
        socketRef.current.disconnect();
      };
    }
  }, [activeGroup, apiBase]);

  const scrollToBottom = () => {
    setTimeout(() => {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, 100);
  };

  const handleCreateGroup = async (e) => {
    e.preventDefault();
    if (!newGroupName.trim()) return;
    try {
      await axios.post(`${apiBase}/api/groups/create`, { name: newGroupName, description: newGroupDesc }, { headers: authHeaders() });
      setNewGroupName('');
      setNewGroupDesc('');
      fetchGroups();
    } catch (err) {
      setError(getErrorMessage(err, 'Failed to create group'));
    }
  };

  const handleJoinLeave = async (e, groupId, action) => {
    e.stopPropagation();
    try {
      const resp = await axios.post(`${apiBase}/api/groups/${groupId}/${action}`, {}, { headers: authHeaders() });
      if (action === 'leave' && activeGroup?._id === groupId) setActiveGroup(null);
      if (action === 'join') setActiveGroup(resp.data.group);
      fetchGroups();
    } catch (err) {
      setError(getErrorMessage(err, `Failed to ${action} group`));
    }
  };

  const handleSendMessage = (e) => {
    e.preventDefault();
    if (!messageInput.trim() || !socketRef.current) return;
    socketRef.current.emit('sendMessage', {
      groupId: activeGroup._id,
      sender: currentUser._id,
      text: messageInput
    });
    setMessageInput('');
  };

  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    if (file.size > 20 * 1024 * 1024) {
      setError("File exceeds 20MB limit.");
      return;
    }
    const formData = new FormData();
    formData.append('file', file);
    setUploading(true);
    try {
      const res = await axios.post(`${apiBase}/api/groups/${activeGroup._id}/messages/upload`, formData, {
        headers: { ...authHeaders(), 'Content-Type': 'multipart/form-data' }
      });
      socketRef.current.emit('sendMessage', res.data); // Dispatch the formatted message block globally
      fileInputRef.current.value = "";
    } catch (err) {
      setError(getErrorMessage(err, "Failed to upload file"));
    } finally {
      setUploading(false);
    }
  };

  if (!currentUser) {
    return (
      <section className="groups-page">
        <div className="alert-error" style={{ margin: '20px' }}>
          Please log in to participate in Group Chats.
        </div>
      </section>
    );
  }

  const renderFileAttachment = (msg) => {
    const serverUrl = apiBase;
    if (msg.fileType === 'image') return <img src={`${serverUrl}${msg.fileUrl}`} alt="attachment" className="chat-img-attachment" />;
    if (msg.fileType === 'video') return <video src={`${serverUrl}${msg.fileUrl}`} controls className="chat-video-attachment" />;
    if (msg.fileType === 'pdf') return <a href={`${serverUrl}${msg.fileUrl}`} target="_blank" rel="noreferrer" className="chat-file-attachment">⬇️ Download PDF: {msg.originalFileName}</a>;
    return null;
  };

  if (activeGroup) {
    if (showMeeting) {
      return (
        <div className="meeting-container">
          <button className="leave-meeting-btn" onClick={() => setShowMeeting(false)}>End / Leave Meeting</button>
          <JitsiMeeting
            roomName={`MeetCircle-Group-${activeGroup._id}`}
            configOverwrite={{ startWithAudioMuted: true, startWithVideoMuted: true }}
            interfaceConfigOverwrite={{ DISABLE_JOIN_LEAVE_NOTIFICATIONS: true }}
            userInfo={{ displayName: currentUser.name }}
            getIFrameRef={(iframeRef) => { iframeRef.style.height = '85vh'; iframeRef.style.width = '100%'; }}
          />
        </div>
      );
    }

    return (
      <section className="groups-page chat-layout">
        <div className="chat-header glass-card">
          <div className="chat-header-info">
            <button className="back-btn" onClick={() => setActiveGroup(null)}>← Back</button>
            <h2>{activeGroup.name}</h2>
            <span>{activeGroup.members.length} members</span>
          </div>
          <button className="jitsi-launch-btn" onClick={() => setShowMeeting(true)}>📹 Start Video Meeting</button>
        </div>
        
        <div className="chat-messages glass-card">
          {messages.map((m, idx) => (
            <div key={idx} className={`chat-bubble ${m.sender?._id === currentUser._id || m.sender === currentUser._id ? 'my-msg' : 'their-msg'}`}>
              <div className="chat-bubble-sender">{m.sender?.name || 'User'}</div>
              {m.text && <div className="chat-bubble-text">{m.text}</div>}
              {m.fileUrl && renderFileAttachment(m)}
            </div>
          ))}
          <div ref={messagesEndRef} />
        </div>

        <form className="chat-input-area glass-card" onSubmit={handleSendMessage}>
          <input type="file" ref={fileInputRef} onChange={handleFileUpload} style={{ display: 'none' }} accept="image/*,video/*,application/pdf" />
          <button type="button" className="attach-btn" onClick={() => fileInputRef.current.click()} disabled={uploading}>
            {uploading ? "⏳" : "📎"}
          </button>
          <input type="text" value={messageInput} onChange={(e) => setMessageInput(e.target.value)} placeholder="Type your message..." />
          <button type="submit" className="send-btn" disabled={!messageInput.trim()}>Send</button>
        </form>
      </section>
    );
  }

  const isCore = currentUser?.role === 'core';

  return (
    <section className="groups-page">
      <div className="groups-header">
        <h2 className="page-title">Community Chatbox</h2>
        <p className="page-subtitle">Join groups alongside other volunteers and core members to interact, arrange virtual meetings, and securely transfer files.</p>
      </div>

      {error && <div className="alert-error" style={{ marginBottom: '20px' }}>{error}</div>}

      {isCore && (
        <form className="create-group-form glass-card" onSubmit={handleCreateGroup}>
          <h3>Create New Group</h3>
          <input type="text" placeholder="Group Name" value={newGroupName} onChange={(e) => setNewGroupName(e.target.value)} required />
          <input type="text" placeholder="Brief Description" value={newGroupDesc} onChange={(e) => setNewGroupDesc(e.target.value)} />
          <button type="submit">Create</button>
        </form>
      )}

      <div className="groups-list">
        {loading ? <div className="spinner" /> : groups.length === 0 ? <p className="empty-text">No active groups.</p> : groups.map(g => {
          const isMember = g.members.includes(currentUser._id);
          return (
            <div key={g._id} className="group-card glass-card">
              <h3>{g.name}</h3>
              <p>{g.description || 'No description provided.'}</p>
              <div className="group-card-actions">
                {isMember ? (
                  <>
                    <button className="join-chat-btn" onClick={() => setActiveGroup(g)}>Enter Chat</button>
                    <button className="leave-group-btn" onClick={(e) => handleJoinLeave(e, g._id, 'leave')}>Leave</button>
                  </>
                ) : (
                  <button className="join-group-btn" onClick={(e) => handleJoinLeave(e, g._id, 'join')}>Join Group</button>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}

export default Groups;

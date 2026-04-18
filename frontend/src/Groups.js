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
  const [showMembers, setShowMembers] = useState(false);
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

      socketRef.current.on('messageDeleted', (messageId) => {
        setMessages((prev) => prev.filter(m => m._id !== messageId));
      });

      socketRef.current.on('memberRemoved', (memberId) => {
        fetchGroups();
        setActiveGroup(prev => {
          if (!prev) return prev;
          return {
            ...prev,
            members: prev.members.filter(m => (m._id || m) !== memberId)
          };
        });
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

  const handleDeleteMessage = async (messageId) => {
    if (!window.confirm("Delete this message?")) return;
    try {
      await axios.delete(`${apiBase}/api/groups/${activeGroup._id}/messages/${messageId}`, { headers: authHeaders() });
      setMessages((prev) => prev.filter(m => m._id !== messageId));
      socketRef.current.emit('messageDeleted', { groupId: activeGroup._id, messageId });
    } catch (err) {
      setError(getErrorMessage(err, "Failed to delete message"));
    }
  };

  const handleRemoveMember = async (memberId) => {
    if (!window.confirm("Remove this participant from the group?")) return;
    try {
      const resp = await axios.delete(`${apiBase}/api/groups/${activeGroup._id}/members/${memberId}`, { headers: authHeaders() });
      setActiveGroup(resp.data.group);
      fetchGroups();
      socketRef.current.emit('memberRemoved', { groupId: activeGroup._id, memberId });
    } catch (err) {
      setError(getErrorMessage(err, "Failed to remove participant"));
    }
  };

  const handleSendMessage = (e) => {
    e.preventDefault();
    if (!messageInput.trim() || !socketRef.current) return;
    socketRef.current.emit('sendMessage', {
      groupId: activeGroup._id,
      sender: currentUser.id || currentUser._id,
      text: messageInput
    });
    setMessageInput('');
    const ta = document.getElementById('chat-textarea');
    if (ta) ta.style.height = '48px';
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

  const rawRole = String(currentUser?.role || '').toLowerCase();
  const isCore = rawRole === 'core';
  const isParticipant = rawRole === 'participant';

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
          <button className="leave-meeting-btn" onClick={() => setShowMeeting(false)}>
            {isCore ? "End Meeting" : "Leave Meeting"}
          </button>
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
          <div className="chat-header-info" style={{ position: 'relative' }}>
            <button className="back-btn" onClick={() => setActiveGroup(null)}>← Back</button>
            <h2>{activeGroup.name}</h2>
            <div className="members-dropdown-container">
              <span 
                className="members-count-badge" 
                style={{ cursor: 'pointer', opacity: 0.8, textDecoration: 'underline' }} 
                onClick={() => setShowMembers(true)}
              >
                {activeGroup.members.length} members
              </span>
            </div>
          </div>
          <button className="jitsi-launch-btn" onClick={() => setShowMeeting(true)}>
            {isCore ? '📹 Host Video Meeting' : '📹 Join Video Meeting'}
          </button>
        </div>
        
        <div className="chat-messages glass-card">
          {messages.map((m, idx) => {
            const currentId = currentUser.id || currentUser._id;
            const senderId = m.sender?._id || m.sender?.id || m.sender;
            return (
              <div key={idx} className={`chat-bubble ${senderId === currentId ? 'my-msg' : 'their-msg'}`}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <div className="chat-bubble-sender">{m.sender?.name || 'User'}</div>
                  {isCore && (
                    <button 
                      onClick={() => handleDeleteMessage(m._id)}
                      style={{ background: 'none', border: 'none', color: senderId === currentId ? 'rgba(255,255,255,0.7)' : '#ef4444', fontSize: '13px', cursor: 'pointer', padding: '0 0 0 8px' }}
                      title="Delete message"
                    >
                      &times;
                    </button>
                  )}
                </div>
                {m.text && <div className="chat-bubble-text">{m.text}</div>}
                {m.fileUrl && renderFileAttachment(m)}
              </div>
            );
          })}
          <div ref={messagesEndRef} />
        </div>

        {showMembers && (
          <div className="members-modal-overlay" onClick={() => setShowMembers(false)} style={{
            position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)', zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center'
          }}>
            <div className="members-modal-content glass-card" onClick={e => e.stopPropagation()} style={{
              width: '90%', maxWidth: '400px', maxHeight: '70vh', display: 'flex', flexDirection: 'column', backgroundColor: '#ffffff', borderRadius: '16px', padding: '20px', boxShadow: '0 10px 25px rgba(0,0,0,0.2)'
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px' }}>
                <h3 style={{ margin: 0, color: '#1e293b' }}>Group Members</h3>
                <button onClick={() => setShowMembers(false)} style={{ background: 'none', border: 'none', fontSize: '24px', cursor: 'pointer', color: '#64748b' }}>&times;</button>
              </div>
              <ul style={{ listStyle: 'none', margin: 0, padding: 0, overflowY: 'auto' }}>
                {activeGroup.members.map(m => {
                  const currentId = currentUser.id || currentUser._id;
                  const mId = m._id || m;
                  return (
                    <li key={mId} style={{ padding: '12px 10px', borderBottom: '1px solid #f1f5f9', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <span style={{ fontWeight: '600', color: '#334155' }}>{m.name || 'Unknown User'}</span>
                        <span style={{ fontSize: '11px', color: '#64748b', backgroundColor: '#e2e8f0', padding: '2px 6px', borderRadius: '4px', textTransform: 'capitalize' }}>
                          {m.role || 'user'}
                        </span>
                      </div>
                      {isCore && currentId !== mId && (
                         <button 
                           onClick={() => handleRemoveMember(mId)}
                           style={{ background: 'rgba(239, 68, 68, 0.1)', color: '#ef4444', border: 'none', padding: '4px 8px', borderRadius: '4px', fontSize: '11px', cursor: 'pointer', fontWeight: 'bold' }}
                         >
                           Remove
                         </button>
                      )}
                    </li>
                  )
                })}
              </ul>
            </div>
          </div>
        )}

          <form className="chat-input-area glass-card" onSubmit={handleSendMessage}>
            <input type="file" ref={fileInputRef} onChange={handleFileUpload} style={{ display: 'none' }} accept="image/*,video/*,application/pdf" />
            <button type="button" className="attach-btn" onClick={() => fileInputRef.current.click()} disabled={uploading}>
              {uploading ? "⏳" : "📎"}
            </button>
            <textarea 
              id="chat-textarea"
              value={messageInput} 
              onChange={(e) => {
                setMessageInput(e.target.value);
                e.target.style.height = '48px';
                e.target.style.height = Math.min(e.target.scrollHeight, 120) + 'px';
              }} 
              placeholder="Type your message..." 
            />
            <button type="submit" className="send-btn" disabled={!messageInput.trim()}>Send</button>
          </form>
      </section>
    );
  }


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
          const currentId = currentUser.id || currentUser._id;
          const isMember = g.members.some(m => (m._id || m) === currentId);
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

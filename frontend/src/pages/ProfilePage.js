import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../services/supabase';
import './ProfilePage.css';

export default function ProfilePage() {
  const { currentUser, userProfile } = useAuth();
  const [userData, setUserData] = useState(null);
  const [bio, setBio] = useState('');
  const [newSkill, setNewSkill] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (userProfile) {
      setUserData(userProfile);
      setBio(userProfile.bio || '');
      setLoading(false);
    } else {
      if (currentUser) {
         setLoading(false);
      }
    }
  }, [userProfile, currentUser]);

  const handleBioSave = async () => {
    try {
      const { error } = await supabase
        .from('users')
        .update({ bio: bio })
        .eq('id', currentUser.id);
        
      if (error) throw error;
      alert('Bio updated successfully!');
    } catch (err) {
      setError('Failed to save bio.');
    }
  };

  const handleAddSkill = async (e) => {
    e.preventDefault();
    if (!newSkill.trim() || (userData.skills && userData.skills.includes(newSkill.trim()))) {
      setNewSkill('');
      return;
    }
    const updatedSkills = [...(userData.skills || []), newSkill.trim()];
    
    try {
      const { error } = await supabase
        .from('users')
        .update({ skills: updatedSkills })
        .eq('id', currentUser.id);
        
      if (error) throw error;
      setUserData({ ...userData, skills: updatedSkills });
      setNewSkill('');
    } catch (err) {
      console.error(err);
      setError('Failed to update skills.');
    }
  };

  const handleRemoveSkill = async (skillToRemove) => {
    const updatedSkills = userData.skills.filter(skill => skill !== skillToRemove);
    try {
      const { error } = await supabase
        .from('users')
        .update({ skills: updatedSkills })
        .eq('id', currentUser.id);
        
      if (error) throw error;
      setUserData({ ...userData, skills: updatedSkills });
    } catch (err) {
      console.error(err);
      setError('Failed to update skills.');
    }
  };

  if (loading) return <p className="loading-text">Loading profile...</p>;
  if (error) return <p className="error-text">{error}</p>;

  return (
    <div className="profile-page-container">
      <div className="profile-content-wrapper">
        <h2>My Profile</h2>
        {userData && (
          <>
            <div className="info-group">
              <p><span className="info-label">Name:</span> {userData.name}</p>
              <p><span className="info-label">Role:</span> {userData.role}</p>
              <p><span className="info-label">Phone No:</span> {userData.phoneNo}</p>
              <p><span className="info-label">Email:</span> {userData.email}</p>
            </div>

            <div className="info-group">
              <label htmlFor="bio" className="info-label">Bio:</label>
              <textarea
                id="bio"
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                className="bio-textarea"
                placeholder="Tell us about yourself..."
              />
              <button onClick={handleBioSave} className="profile-button" style={{ marginTop: '10px' }}>
                Save Bio
              </button>
            </div>

            <div className="info-group">
              <p className="info-label">My Skills:</p>
              <div className="skills-container">
                {userData.skills && userData.skills.length > 0 ? (
                  userData.skills.map(skill => (
                    <span key={skill} className="skill-tag">
                      {skill}
                      <button onClick={() => handleRemoveSkill(skill)} className="remove-skill-btn">x</button>
                    </span>
                  ))
                ) : (
                  <p>You haven't added any skills yet.</p>
                )}
              </div>
              <form onSubmit={handleAddSkill} className="input-group">
                <input
                  type="text"
                  value={newSkill}
                  onChange={(e) => setNewSkill(e.target.value)}
                  placeholder="Add a new skill"
                  className="skill-input"
                />
                <button type="submit" className="profile-button">Add Skill</button>
              </form>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
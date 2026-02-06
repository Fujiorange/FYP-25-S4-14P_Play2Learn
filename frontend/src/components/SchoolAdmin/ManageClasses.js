import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import authService from '../../services/authService';
import schoolAdminService from '../../services/schoolAdminService';

const GRADES = [
  { value: 'Primary 1', enabled: true },
  { value: 'Primary 2', enabled: false },
  { value: 'Primary 3', enabled: false },
  { value: 'Primary 4', enabled: false },
  { value: 'Primary 5', enabled: false },
  { value: 'Primary 6', enabled: false }
];

export default function ManageClasses() {
  const navigate = useNavigate();
  const [classes, setClasses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selectedClass, setSelectedClass] = useState(null);
  const [message, setMessage] = useState({ type: '', text: '' });
  const [teachers, setTeachers] = useState([]);
  const [students, setStudents] = useState([]);
  
  const [formData, setFormData] = useState({
    name: '',
    grade: 'Primary 1',
    subjects: ['Mathematics'],
    teachers: [],
    students: []
  });

  useEffect(() => {
    if (!authService.isAuthenticated()) {
      navigate('/login');
      return;
    }

    const currentUser = authService.getCurrentUser();
    if (currentUser.role !== 'School Admin') {
      navigate('/login');
      return;
    }

    loadClasses();
    loadTeachersAndStudents();
  }, [navigate]);

  const loadClasses = async () => {
    setLoading(true);
    try {
      const result = await schoolAdminService.getClasses();
      if (result.success) {
        setClasses(result.classes || []);
      } else {
        setMessage({ type: 'error', text: result.error || 'Failed to load classes' });
      }
    } catch (error) {
      console.error('Error loading classes:', error);
      setMessage({ type: 'error', text: 'Failed to load classes' });
    } finally {
      setLoading(false);
    }
  };

  const loadTeachersAndStudents = async () => {
    try {
      const [teachersResult, studentsResult] = await Promise.all([
        schoolAdminService.getAvailableTeachers(),
        schoolAdminService.getAvailableStudents(false) // Get ALL students
      ]);
      
      if (teachersResult.success) {
        setTeachers(teachersResult.teachers || []);
      }
      if (studentsResult.success) {
        setStudents(studentsResult.students || []);
      }
    } catch (error) {
      console.error('Error loading teachers/students:', error);
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      grade: 'Primary 1',
      subjects: ['Mathematics'],
      teachers: [],
      students: []
    });
  };

  const handleAddClass = async () => {
    if (!formData.name.trim()) {
      setMessage({ type: 'error', text: 'Class name is required' });
      return;
    }

    try {
      const result = await schoolAdminService.createClass(formData);
      
      if (result.success) {
        setMessage({ type: 'success', text: 'Class created successfully!' });
        setShowAddModal(false);
        resetForm();
        loadClasses();
        loadTeachersAndStudents();
        setTimeout(() => setMessage({ type: '', text: '' }), 3000);
      } else {
        setMessage({ type: 'error', text: result.error || 'Failed to create class' });
      }
    } catch (error) {
      console.error('Error creating class:', error);
      setMessage({ type: 'error', text: 'Failed to create class' });
    }
  };

  const handleEditClass = async () => {
    if (!formData.name.trim()) {
      setMessage({ type: 'error', text: 'Class name is required' });
      return;
    }

    try {
      const result = await schoolAdminService.updateClass(selectedClass.id, formData);
      
      if (result.success) {
        setMessage({ type: 'success', text: 'Class updated successfully!' });
        setShowEditModal(false);
        setSelectedClass(null);
        resetForm();
        loadClasses();
        loadTeachersAndStudents();
        setTimeout(() => setMessage({ type: '', text: '' }), 3000);
      } else {
        setMessage({ type: 'error', text: result.error || 'Failed to update class' });
      }
    } catch (error) {
      console.error('Error updating class:', error);
      setMessage({ type: 'error', text: 'Failed to update class' });
    }
  };

  const handleDeleteClass = async () => {
    try {
      const result = await schoolAdminService.deleteClass(selectedClass.id);
      
      if (result.success) {
        setMessage({ type: 'success', text: 'Class deleted successfully!' });
        setShowDeleteModal(false);
        setSelectedClass(null);
        loadClasses();
        loadTeachersAndStudents();
        setTimeout(() => setMessage({ type: '', text: '' }), 3000);
      } else {
        setMessage({ type: 'error', text: result.error || 'Failed to delete class' });
      }
    } catch (error) {
      console.error('Error deleting class:', error);
      setMessage({ type: 'error', text: 'Failed to delete class' });
    }
  };

  const openEditModal = async (cls) => {
    setSelectedClass(cls);
    setFormData({
      name: cls.name,
      grade: cls.grade || 'Primary 1',
      subjects: cls.subjects || ['Mathematics'],
      teachers: cls.teachers?.map(t => t.id || t._id) || [],
      students: cls.students?.map(s => s.id || s._id) || []
    });
    
    // Refresh teachers and students
    try {
      const [teachersResult, studentsResult] = await Promise.all([
        schoolAdminService.getAvailableTeachers(cls.id),
        schoolAdminService.getAvailableStudents(false, cls.id)
      ]);
      if (teachersResult.success) {
        setTeachers(teachersResult.teachers || []);
      }
      if (studentsResult.success) {
        setStudents(studentsResult.students || []);
      }
    } catch (err) {
      console.error('Error refreshing teachers/students for edit:', err);
    }
    
    setShowEditModal(true);
  };

  const openDeleteModal = (cls) => {
    setSelectedClass(cls);
    setShowDeleteModal(true);
  };

  const styles = {
    container: { minHeight: '100vh', background: 'linear-gradient(135deg, #e8eef5 0%, #dce4f0 100%)', padding: '32px' },
    content: { maxWidth: '1200px', margin: '0 auto' },
    header: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' },
    title: { fontSize: '28px', fontWeight: '700', color: '#1f2937' },
    addBtn: { padding: '12px 24px', background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)', color: 'white', border: 'none', borderRadius: '10px', fontWeight: '600', cursor: 'pointer' },
    backBtn: { padding: '10px 20px', background: '#f1f5f9', border: 'none', borderRadius: '10px', cursor: 'pointer', fontWeight: '500', marginBottom: '20px' },
    grid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '20px' },
    card: { background: 'white', borderRadius: '16px', padding: '24px', boxShadow: '0 2px 10px rgba(0,0,0,0.08)' },
    cardTitle: { fontSize: '20px', fontWeight: '600', color: '#1f2937', marginBottom: '12px' },
    cardInfo: { color: '#6b7280', fontSize: '14px', marginBottom: '8px' },
    cardActions: { display: 'flex', gap: '10px', marginTop: '16px', paddingTop: '16px', borderTop: '1px solid #e5e7eb' },
    editBtn: { flex: 1, padding: '10px', background: '#dbeafe', color: '#1d4ed8', border: 'none', borderRadius: '8px', fontWeight: '500', cursor: 'pointer' },
    deleteBtn: { flex: 1, padding: '10px', background: '#fee2e2', color: '#dc2626', border: 'none', borderRadius: '8px', fontWeight: '500', cursor: 'pointer' },
    modal: { position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 },
    modalContent: { background: 'white', borderRadius: '16px', padding: '32px', width: '90%', maxWidth: '500px', maxHeight: '80vh', overflow: 'auto' },
    modalTitle: { fontSize: '24px', fontWeight: '600', marginBottom: '24px' },
    formGroup: { marginBottom: '20px' },
    label: { display: 'block', marginBottom: '8px', fontWeight: '500', color: '#374151' },
    input: { width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid #d1d5db', fontSize: '14px' },
    select: { width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid #d1d5db', fontSize: '14px', minHeight: '120px' },
    btnGroup: { display: 'flex', gap: '12px', marginTop: '24px' },
    cancelBtn: { flex: 1, padding: '12px', background: '#f3f4f6', color: '#374151', border: 'none', borderRadius: '8px', fontWeight: '500', cursor: 'pointer' },
    submitBtn: { flex: 1, padding: '12px', background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)', color: 'white', border: 'none', borderRadius: '8px', fontWeight: '600', cursor: 'pointer' },
    message: { padding: '12px 16px', borderRadius: '8px', marginBottom: '20px' },
    emptyState: { textAlign: 'center', padding: '60px', color: '#6b7280' },
  };

  if (loading) {
    return (
      <div style={styles.container}>
        <div style={styles.content}>
          <div style={{ textAlign: 'center', padding: '60px' }}>Loading classes...</div>
        </div>
      </div>
    );
  }

  return (
    <div style={styles.container}>
      <div style={styles.content}>
        <button style={styles.backBtn} onClick={() => navigate('/school-admin')}>← Back to Dashboard</button>
        
        {message.text && (
          <div style={{ ...styles.message, background: message.type === 'success' ? '#dcfce7' : '#fee2e2', color: message.type === 'success' ? '#166534' : '#dc2626' }}>
            {message.text}
          </div>
        )}

        <div style={styles.header}>
          <h1 style={styles.title}>📚 Class Management</h1>
          <button style={styles.addBtn} onClick={() => { resetForm(); setShowAddModal(true); }}>+ Add Class</button>
        </div>

        {classes.length === 0 ? (
          <div style={styles.emptyState}>
            <p style={{ fontSize: '48px', marginBottom: '16px' }}>📚</p>
            <p style={{ fontSize: '18px', fontWeight: '500' }}>No classes yet</p>
            <p>Create your first class to get started</p>
          </div>
        ) : (
          <div style={styles.grid}>
            {classes.map(cls => (
              <div key={cls.id} style={styles.card}>
                <h3 style={styles.cardTitle}>{cls.name}</h3>
                <p style={styles.cardInfo}>📊 Grade: {cls.grade || 'Primary 1'}</p>
                <p style={styles.cardInfo}>📖 Subject: {cls.subjects?.join(', ') || 'Mathematics'}</p>
                <p style={styles.cardInfo}>👨‍🏫 Teachers: {cls.teachers?.length || 0}</p>
                <p style={styles.cardInfo}>👥 Students: {cls.students?.length || 0}</p>
                <div style={styles.cardActions}>
                  <button style={styles.editBtn} onClick={() => openEditModal(cls)}>Edit</button>
                  <button style={styles.deleteBtn} onClick={() => openDeleteModal(cls)}>Delete</button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Add Modal */}
        {showAddModal && (
          <div style={styles.modal}>
            <div style={styles.modalContent}>
              <h2 style={styles.modalTitle}>Add New Class</h2>
              <div style={styles.formGroup}>
                <label style={styles.label}>Class Name *</label>
                <input style={styles.input} value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} placeholder="e.g., 1A" />
              </div>
              <div style={styles.formGroup}>
                <label style={styles.label}>Grade</label>
                <select style={{...styles.input}} value={formData.grade} onChange={e => setFormData({...formData, grade: e.target.value})}>
                  {GRADES.map(g => <option key={g.value} value={g.value} disabled={!g.enabled}>{g.value}{!g.enabled ? ' (Coming Soon)' : ''}</option>)}
                </select>
              </div>
              <div style={styles.formGroup}>
                <label style={styles.label}>Assign Teachers</label>
                <select multiple style={styles.select} value={formData.teachers} onChange={e => setFormData({...formData, teachers: Array.from(e.target.selectedOptions, o => o.value)})}>
                  {teachers.map(t => <option key={t.id} value={t.id}>{t.name} ({t.email})</option>)}
                </select>
              </div>
              <div style={styles.formGroup}>
                <label style={styles.label}>Assign Students</label>
                <select multiple style={styles.select} value={formData.students} onChange={e => setFormData({...formData, students: Array.from(e.target.selectedOptions, o => o.value)})}>
                  {students.map(s => <option key={s.id} value={s.id}>{s.name} ({s.email}){s.currentClass ? ` - Currently: ${s.currentClass}` : ''}</option>)}
                </select>
              </div>
              <div style={styles.btnGroup}>
                <button style={styles.cancelBtn} onClick={() => setShowAddModal(false)}>Cancel</button>
                <button style={styles.submitBtn} onClick={handleAddClass}>Create Class</button>
              </div>
            </div>
          </div>
        )}

        {/* Edit Modal */}
        {showEditModal && (
          <div style={styles.modal}>
            <div style={styles.modalContent}>
              <h2 style={styles.modalTitle}>Edit Class</h2>
              <div style={styles.formGroup}>
                <label style={styles.label}>Class Name *</label>
                <input style={styles.input} value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} />
              </div>
              <div style={styles.formGroup}>
                <label style={styles.label}>Grade</label>
                <select style={{...styles.input}} value={formData.grade} onChange={e => setFormData({...formData, grade: e.target.value})}>
                  {GRADES.map(g => <option key={g.value} value={g.value} disabled={!g.enabled}>{g.value}{!g.enabled ? ' (Coming Soon)' : ''}</option>)}
                </select>
              </div>
              <div style={styles.formGroup}>
                <label style={styles.label}>Assign Teachers</label>
                <select multiple style={styles.select} value={formData.teachers} onChange={e => setFormData({...formData, teachers: Array.from(e.target.selectedOptions, o => o.value)})}>
                  {teachers.map(t => <option key={t.id} value={t.id}>{t.name} ({t.email})</option>)}
                </select>
              </div>
              <div style={styles.formGroup}>
                <label style={styles.label}>Assign Students</label>
                <select multiple style={styles.select} value={formData.students} onChange={e => setFormData({...formData, students: Array.from(e.target.selectedOptions, o => o.value)})}>
                  {students.map(s => <option key={s.id} value={s.id}>{s.name} ({s.email}){s.currentClass ? ` - Currently: ${s.currentClass}` : ''}</option>)}
                </select>
              </div>
              <div style={styles.btnGroup}>
                <button style={styles.cancelBtn} onClick={() => setShowEditModal(false)}>Cancel</button>
                <button style={styles.submitBtn} onClick={handleEditClass}>Save Changes</button>
              </div>
            </div>
          </div>
        )}

        {/* Delete Modal */}
        {showDeleteModal && (
          <div style={styles.modal}>
            <div style={styles.modalContent}>
              <h2 style={styles.modalTitle}>Delete Class</h2>
              <p>Are you sure you want to delete <strong>{selectedClass?.name}</strong>?</p>
              <p style={{ color: '#6b7280', marginTop: '8px' }}>This will unassign all teachers and students from this class.</p>
              <div style={styles.btnGroup}>
                <button style={styles.cancelBtn} onClick={() => setShowDeleteModal(false)}>Cancel</button>
                <button style={{...styles.submitBtn, background: 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)'}} onClick={handleDeleteClass}>Delete</button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// Example: Using Parent Service in React Component
// This demonstrates how to integrate the new parent service

import React, { useState, useEffect } from 'react';
import parentService from '../services/parentService';

/**
 * Example Parent Dashboard Component
 * Demonstrates integration with the newly added parent service
 */
export default function ParentDashboardExample() {
  const [loading, setLoading] = useState(true);
  const [dashboard, setDashboard] = useState(null);
  const [selectedChild, setSelectedChild] = useState(null);
  const [childStats, setChildStats] = useState(null);
  const [error, setError] = useState(null);

  // Load dashboard on component mount
  useEffect(() => {
    loadDashboard();
  }, []);

  // Load child stats when a child is selected
  useEffect(() => {
    if (selectedChild) {
      loadChildStats(selectedChild);
    }
  }, [selectedChild]);

  const loadDashboard = async () => {
    try {
      setLoading(true);
      setError(null);

      // Use the new parent service
      const result = await parentService.getDashboard();

      if (result.success) {
        setDashboard(result);
        // Auto-select first child if available
        if (result.defaultChild) {
          setSelectedChild(result.defaultChild._id);
        }
      } else {
        setError(result.error || 'Failed to load dashboard');
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const loadChildStats = async (studentId) => {
    try {
      // Get detailed statistics for selected child
      const stats = await parentService.getChildStats(studentId);
      
      if (stats.success) {
        setChildStats(stats);
      } else {
        console.error('Failed to load child stats:', stats.error);
      }
    } catch (err) {
      console.error('Error loading child stats:', err);
    }
  };

  const loadChildActivities = async (studentId, limit = 10) => {
    try {
      // Get recent activities
      const activities = await parentService.getChildActivities(studentId, limit);
      
      if (activities.success) {
        console.log('Recent activities:', activities.activities);
        return activities.activities;
      }
    } catch (err) {
      console.error('Error loading activities:', err);
    }
  };

  const loadChildPerformance = async (studentId) => {
    try {
      // Get performance data
      const performance = await parentService.getChildPerformance(studentId);
      
      if (performance.success) {
        console.log('Performance data:', performance.performance);
        return performance.performance;
      }
    } catch (err) {
      console.error('Error loading performance:', err);
    }
  };

  const loadAllChildrenSummary = async () => {
    try {
      // Get summary for all children
      const summary = await parentService.getChildrenSummary();
      
      if (summary.success) {
        console.log('All children summary:', summary.children);
        return summary.children;
      }
    } catch (err) {
      console.error('Error loading summary:', err);
    }
  };

  if (loading) {
    return <div>Loading...</div>;
  }

  if (error) {
    return <div>Error: {error}</div>;
  }

  if (!dashboard) {
    return <div>No data available</div>;
  }

  return (
    <div style={{ padding: '20px' }}>
      <h1>Parent Dashboard Example</h1>
      
      {/* Parent Info */}
      <div style={{ marginBottom: '20px' }}>
        <h2>Welcome, {dashboard.parent?.name}</h2>
        <p>Email: {dashboard.parent?.email}</p>
      </div>

      {/* Linked Children */}
      <div style={{ marginBottom: '20px' }}>
        <h3>Your Children</h3>
        {dashboard.parent?.linkedStudents?.length > 0 ? (
          <ul>
            {dashboard.parent.linkedStudents.map((studentId) => (
              <li key={studentId}>
                <button onClick={() => setSelectedChild(studentId)}>
                  View Stats for {studentId}
                </button>
              </li>
            ))}
          </ul>
        ) : (
          <p>No children linked to this account</p>
        )}
      </div>

      {/* Selected Child Stats */}
      {selectedChild && childStats && (
        <div style={{ marginBottom: '20px' }}>
          <h3>Selected Child Statistics</h3>
          <pre>{JSON.stringify(childStats, null, 2)}</pre>
        </div>
      )}

      {/* Action Buttons */}
      <div>
        <button onClick={() => loadDashboard()}>
          Refresh Dashboard
        </button>
        
        <button onClick={() => loadAllChildrenSummary()}>
          View All Children Summary
        </button>
        
        {selectedChild && (
          <>
            <button onClick={() => loadChildActivities(selectedChild, 20)}>
              View Recent Activities
            </button>
            
            <button onClick={() => loadChildPerformance(selectedChild)}>
              View Performance Report
            </button>
          </>
        )}
      </div>
    </div>
  );
}

/**
 * Alternative Example: Using Parent Service with Hooks
 */
export function useParentDashboard() {
  const [dashboard, setDashboard] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchDashboard = async () => {
      const result = await parentService.getDashboard();
      
      if (result.success) {
        setDashboard(result);
      } else {
        setError(result.error);
      }
      
      setLoading(false);
    };

    if (parentService.isParentAuthenticated()) {
      fetchDashboard();
    } else {
      setError('Not authenticated');
      setLoading(false);
    }
  }, []);

  return { dashboard, loading, error, refetch: () => window.location.reload() };
}

/**
 * Usage of the custom hook:
 * 
 * function MyComponent() {
 *   const { dashboard, loading, error } = useParentDashboard();
 *   
 *   if (loading) return <div>Loading...</div>;
 *   if (error) return <div>Error: {error}</div>;
 *   
 *   return <div>{dashboard.parent.name}</div>;
 * }
 */

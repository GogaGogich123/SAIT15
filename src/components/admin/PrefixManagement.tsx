import React, { useState, useEffect } from 'react';
import { Plus, Edit, Trash2, Users, Award } from 'lucide-react';
import { Button } from '../ui/Button';
import { Card } from '../ui/Card';
import { Badge } from '../ui/Badge';
import { PrefixModal } from './modals/PrefixModal';
import { AssignPrefixModal } from './modals/AssignPrefixModal';
import { supabase } from '../../lib/supabase';
import { useToast } from '../../hooks/useToast';

interface CadetPrefix {
  id: string;
  name: string;
  display_name: string;
  description: string | null;
  color: string;
  sort_order: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

interface AssignedPrefix {
  id: string;
  cadet_id: string;
  prefix_id: string;
  assigned_at: string;
  is_active: boolean;
  cadet: {
    name: string;
    email: string;
  };
  prefix: CadetPrefix;
}

export function PrefixManagement() {
  const [prefixes, setPrefixes] = useState<CadetPrefix[]>([]);
  const [assignedPrefixes, setAssignedPrefixes] = useState<AssignedPrefix[]>([]);
  const [loading, setLoading] = useState(true);
  const [showPrefixModal, setShowPrefixModal] = useState(false);
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [selectedPrefix, setSelectedPrefix] = useState<CadetPrefix | null>(null);
  const { showToast } = useToast();

  useEffect(() => {
    loadPrefixes();
    loadAssignedPrefixes();
  }, []);

  const loadPrefixes = async () => {
    try {
      const { data, error } = await supabase
        .from('cadet_prefixes')
        .select('*')
        .order('sort_order', { ascending: true });

      if (error) throw error;
      setPrefixes(data || []);
    } catch (error) {
      console.error('Error loading prefixes:', error);
      showToast('Failed to load prefixes', 'error');
    }
  };

  const loadAssignedPrefixes = async () => {
    try {
      const { data, error } = await supabase
        .from('cadet_assigned_prefixes')
        .select(`
          *,
          cadet:cadets(name, email),
          prefix:cadet_prefixes(*)
        `)
        .eq('is_active', true)
        .order('assigned_at', { ascending: false });

      if (error) throw error;
      setAssignedPrefixes(data || []);
    } catch (error) {
      console.error('Error loading assigned prefixes:', error);
      showToast('Failed to load assigned prefixes', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleCreatePrefix = () => {
    setSelectedPrefix(null);
    setShowPrefixModal(true);
  };

  const handleEditPrefix = (prefix: CadetPrefix) => {
    setSelectedPrefix(prefix);
    setShowPrefixModal(true);
  };

  const handleDeletePrefix = async (prefixId: string) => {
    if (!confirm('Are you sure you want to delete this prefix?')) return;

    try {
      const { error } = await supabase
        .from('cadet_prefixes')
        .delete()
        .eq('id', prefixId);

      if (error) throw error;
      
      showToast('Prefix deleted successfully', 'success');
      loadPrefixes();
      loadAssignedPrefixes();
    } catch (error) {
      console.error('Error deleting prefix:', error);
      showToast('Failed to delete prefix', 'error');
    }
  };

  const handlePrefixSaved = () => {
    loadPrefixes();
    setShowPrefixModal(false);
  };

  const handleAssignmentSaved = () => {
    loadAssignedPrefixes();
    setShowAssignModal(false);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Prefix Management</h2>
          <p className="text-gray-600">Manage cadet prefixes and assignments</p>
        </div>
        <div className="flex gap-2">
          <Button onClick={() => setShowAssignModal(true)} className="flex items-center gap-2">
            <Users className="w-4 h-4" />
            Assign Prefix
          </Button>
          <Button onClick={handleCreatePrefix} className="flex items-center gap-2">
            <Plus className="w-4 h-4" />
            Create Prefix
          </Button>
        </div>
      </div>

      {/* Prefixes Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {prefixes.map((prefix) => (
          <Card key={prefix.id} className="p-4">
            <div className="flex items-start justify-between mb-3">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <Badge className={`bg-gradient-to-r ${prefix.color} text-white`}>
                    {prefix.display_name}
                  </Badge>
                  {!prefix.is_active && (
                    <Badge variant="secondary">Inactive</Badge>
                  )}
                </div>
                <p className="text-sm text-gray-600">{prefix.description}</p>
              </div>
              <div className="flex gap-1">
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => handleEditPrefix(prefix)}
                >
                  <Edit className="w-4 h-4" />
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => handleDeletePrefix(prefix.id)}
                  className="text-red-600 hover:text-red-700"
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
            </div>
            
            <div className="text-xs text-gray-500">
              Sort Order: {prefix.sort_order}
            </div>
          </Card>
        ))}
      </div>

      {/* Assigned Prefixes */}
      <div>
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Current Assignments</h3>
        <div className="bg-white rounded-lg border overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Cadet
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Prefix
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Assigned Date
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {assignedPrefixes.map((assignment) => (
                  <tr key={assignment.id}>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div>
                        <div className="text-sm font-medium text-gray-900">
                          {assignment.cadet.name}
                        </div>
                        <div className="text-sm text-gray-500">
                          {assignment.cadet.email}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <Badge className={`bg-gradient-to-r ${assignment.prefix.color} text-white`}>
                        {assignment.prefix.display_name}
                      </Badge>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {new Date(assignment.assigned_at).toLocaleDateString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Modals */}
      {showPrefixModal && (
        <PrefixModal
          prefix={selectedPrefix}
          onClose={() => setShowPrefixModal(false)}
          onSave={handlePrefixSaved}
        />
      )}

      {showAssignModal && (
        <AssignPrefixModal
          onClose={() => setShowAssignModal(false)}
          onSave={handleAssignmentSaved}
        />
      )}
    </div>
  );
}
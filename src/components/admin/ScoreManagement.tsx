import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import Button from '../ui/Button';
import { Input } from '../ui';
import Card from '../ui/Card';
import { Badge } from '../ui';
import { Search, Plus, Edit, Trash2, Award, Users } from 'lucide-react';
import ScoreModal from './modals/ScoreModal';
import { useToast } from '../../hooks/useToast';

interface Cadet {
  id: string;
  name: string;
  email: string;
  platoon: string;
  squad: number;
  rank: number;
  total_score: number;
}

interface ScoreHistory {
  id: string;
  category: string;
  points: number;
  description: string;
  created_at: string;
  awarded_by: string;
}

export function ScoreManagement() {
  const [cadets, setCadets] = useState<Cadet[]>([]);
  const [scoreHistory, setScoreHistory] = useState<ScoreHistory[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCadet, setSelectedCadet] = useState<Cadet | null>(null);
  const [isScoreModalOpen, setIsScoreModalOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const { showToast } = useToast();

  useEffect(() => {
    fetchCadets();
    fetchScoreHistory();
  }, []);

  const fetchCadets = async () => {
    try {
      const { data, error } = await supabase
        .from('cadets')
        .select('*')
        .order('total_score', { ascending: false });

      if (error) throw error;
      setCadets(data || []);
    } catch (error) {
      console.error('Error fetching cadets:', error);
      showToast('Failed to fetch cadets', 'error');
    } finally {
      setLoading(false);
    }
  };

  const fetchScoreHistory = async () => {
    try {
      const { data, error } = await supabase
        .from('score_history')
        .select(`
          *,
          cadets(name, platoon)
        `)
        .order('created_at', { ascending: false })
        .limit(50);

      if (error) throw error;
      setScoreHistory(data || []);
    } catch (error) {
      console.error('Error fetching score history:', error);
    }
  };

  const handleAddScore = (cadet: Cadet) => {
    setSelectedCadet(cadet);
    setIsScoreModalOpen(true);
  };

  const handleScoreAdded = () => {
    fetchCadets();
    fetchScoreHistory();
    setIsScoreModalOpen(false);
    setSelectedCadet(null);
  };

  const filteredCadets = cadets.filter(cadet =>
    cadet.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    cadet.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    cadet.platoon.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'study': return 'bg-blue-100 text-blue-800';
      case 'discipline': return 'bg-green-100 text-green-800';
      case 'events': return 'bg-purple-100 text-purple-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-gray-900">Score Management</h2>
        <div className="flex items-center space-x-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <Input
              type="text"
              placeholder="Search cadets..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 w-64"
            />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Cadets List */}
        <Card className="p-6">
          <div className="flex items-center space-x-2 mb-4">
            <Users className="w-5 h-5 text-blue-600" />
            <h3 className="text-lg font-semibold">Cadets</h3>
          </div>
          
          <div className="space-y-3 max-h-96 overflow-y-auto">
            {filteredCadets.map((cadet) => (
              <div
                key={cadet.id}
                className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
              >
                <div className="flex-1">
                  <div className="flex items-center space-x-3">
                    <div>
                      <p className="font-medium text-gray-900">{cadet.name}</p>
                      <p className="text-sm text-gray-500">
                        {cadet.platoon} - Squad {cadet.squad}
                      </p>
                    </div>
                  </div>
                </div>
                
                <div className="flex items-center space-x-3">
                  <div className="text-right">
                    <p className="font-semibold text-gray-900">{cadet.total_score} pts</p>
                    <p className="text-sm text-gray-500">Rank #{cadet.rank}</p>
                  </div>
                  
                  <Button
                    onClick={() => handleAddScore(cadet)}
                    size="sm"
                    className="bg-blue-600 hover:bg-blue-700"
                  >
                    <Award className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </Card>

        {/* Recent Score History */}
        <Card className="p-6">
          <div className="flex items-center space-x-2 mb-4">
            <Award className="w-5 h-5 text-green-600" />
            <h3 className="text-lg font-semibold">Recent Score Changes</h3>
          </div>
          
          <div className="space-y-3 max-h-96 overflow-y-auto">
            {scoreHistory.map((entry) => (
              <div
                key={entry.id}
                className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
              >
                <div className="flex-1">
                  <div className="flex items-center space-x-2 mb-1">
                    <Badge className={getCategoryColor(entry.category)}>
                      {entry.category}
                    </Badge>
                    <span className={`font-semibold ${entry.points >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                      {entry.points >= 0 ? '+' : ''}{entry.points} pts
                    </span>
                  </div>
                  <p className="text-sm text-gray-600">{entry.description}</p>
                  <p className="text-xs text-gray-500 mt-1">
                    {new Date(entry.created_at).toLocaleDateString()}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </Card>
      </div>

      {/* Score Modal */}
      {isScoreModalOpen && selectedCadet && (
        <ScoreModal
          cadet={selectedCadet}
          onClose={() => {
            setIsScoreModalOpen(false);
            setSelectedCadet(null);
          }}
          onScoreAdded={handleScoreAdded}
        />
      )}
    </div>
  );
}
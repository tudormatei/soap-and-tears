'use client';

import { useState, useEffect } from 'react';

interface User {
  id: string;
  name: string;
}

interface Chore {
  id: string;
  name: string;
  description: string;
  frequency: string;
}

interface Contract {
  id: string;
  uid: string;
  cid: string;
  completed_date: string;
  user_name?: string;
  chore_name?: string;
}

interface GroceryItem {
  id: string;
  name: string;
  completed: boolean;
  added_by?: string;
  created_at: string | { seconds: number; nanoseconds: number };
}

export default function Home() {
  const [users, setUsers] = useState<User[]>([]);
  const [chores, setChores] = useState<Chore[]>([]);
  const [contracts, setContracts] = useState<Contract[]>([]);
  const [groceries, setGroceries] = useState<GroceryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedChore, setSelectedChore] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [newGroceryItem, setNewGroceryItem] = useState('');

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [usersRes, choresRes, contractsRes, groceriesRes] = await Promise.all([
        fetch('/api/users'),
        fetch('/api/chores'),
        fetch('/api/contracts'),
        fetch('/api/groceries')
      ]);

      const usersData = await usersRes.json();
      const choresData = await choresRes.json();
      const contractsData = await contractsRes.json();
      const groceriesData = await groceriesRes.json();

      setUsers(usersData.users);
      setChores(choresData.chores);
      setContracts(contractsData.contracts);
      setGroceries(groceriesData.groceries);
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleChoreClick = (choreId: string) => {
    setSelectedChore(selectedChore === choreId ? null : choreId);
  };

  const handleUserSelect = async (userId: string) => {
    if (!selectedChore) return;
    
    setIsSubmitting(true);
    try {
      const today = new Date().toISOString().split('T')[0];
      
      const response = await fetch('/api/contracts', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          uid: userId,
          cid: selectedChore,
          completedDate: today,
        }),
      });

      if (response.ok) {
        // Refresh data to show the new contract
        await fetchData();
        setSelectedChore(null);
      } else {
        console.error('Failed to create contract');
      }
    } catch (error) {
      console.error('Error creating contract:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleAddGroceryItem = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newGroceryItem.trim()) return;

    try {
      const response = await fetch('/api/groceries', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: newGroceryItem,
        }),
      });

      if (response.ok) {
        await fetchData();
        setNewGroceryItem('');
      } else {
        console.error('Failed to add grocery item');
      }
    } catch (error) {
      console.error('Error adding grocery item:', error);
    }
  };

  const handleDeleteGroceryItem = async (id: string) => {
    try {
      const response = await fetch('/api/groceries', {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ id }),
      });

      if (response.ok) {
        await fetchData();
      } else {
        console.error('Failed to delete grocery item');
      }
    } catch (error) {
      console.error('Error deleting grocery item:', error);
    }
  };

  const getFrequencyColor = (frequency: string) => {
    switch (frequency.toLowerCase()) {
      case 'daily':
        return 'bg-red-100 text-red-800 border-red-200';
      case 'weekly':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'bi-weekly':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto mb-4"></div>
          <div className="text-lg text-gray-600">Loading chores...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="max-w-7xl mx-auto p-6">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">
            🧽 Soap and Tears
          </h1>
          <p className="text-lg text-gray-600">Chore Coordination Hub</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Chores Section */}
          <div className="bg-white rounded-xl shadow-lg p-6">
            <h2 className="text-2xl font-semibold mb-6 text-gray-800 flex items-center">
              <span className="mr-2">📋</span>
              Available Chores
            </h2>
            <div className="space-y-3">
              {chores.map((chore) => (
                <div key={chore.id} className="relative">
                  <div
                    onClick={() => handleChoreClick(chore.id)}
                    className={`p-4 rounded-lg border-2 cursor-pointer transition-all duration-200 hover:shadow-md ${
                      selectedChore === chore.id
                        ? 'border-indigo-500 bg-indigo-50'
                        : 'border-gray-200 bg-gray-50 hover:border-gray-300'
                    }`}
                  >
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <h3 className="font-semibold text-gray-900 text-lg">
                          {chore.name}
                        </h3>
                        <p className="text-gray-600 text-sm mt-1">
                          {chore.description}
                        </p>
                      </div>
                      <span className={`px-3 py-1 rounded-full text-xs font-medium border ${getFrequencyColor(chore.frequency)}`}>
                        {chore.frequency}
                      </span>
                    </div>
                  </div>

                  {/* User Selection Dropdown */}
                  {selectedChore === chore.id && (
                    <div className="mt-3 p-4 bg-indigo-50 rounded-lg border border-indigo-200">
                      <p className="text-sm text-indigo-800 mb-3 font-medium">
                        Who completed this chore?
                      </p>
                      <div className="flex flex-wrap gap-2">
                        {users.map((user) => (
                          <button
                            key={user.id}
                            onClick={() => handleUserSelect(user.id)}
                            disabled={isSubmitting}
                            className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200 text-sm font-medium"
                          >
                            {isSubmitting ? '...' : user.name}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* History Section */}
          <div className="bg-white rounded-xl shadow-lg p-6">
            <h2 className="text-2xl font-semibold mb-6 text-gray-800 flex items-center">
              <span className="mr-2">📊</span>
              Completion History
            </h2>
            
            {contracts.length === 0 ? (
              <div className="text-center py-12">
                <div className="text-6xl mb-4">🏠</div>
                <p className="text-gray-500 text-lg">No chores completed yet</p>
                <p className="text-gray-400 text-sm mt-2">
                  Click on a chore to mark it as complete!
                </p>
              </div>
            ) : (
              <div className="space-y-3 max-h-96 overflow-y-auto">
                {contracts.map((contract) => (
                  <div
                    key={contract.id}
                    className="p-4 bg-green-50 rounded-lg border border-green-200 hover:bg-green-100 transition-colors duration-200"
                  >
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <div className="flex items-center mb-1">
                          <span className="text-lg mr-2">✅</span>
                          <span className="font-semibold text-gray-900">
                            {contract.user_name}
                          </span>
                        </div>
                        <p className="text-gray-700 text-sm">
                          completed <span className="font-medium">{contract.chore_name}</span>
                        </p>
                      </div>
                      <div className="text-right">
                        <div className="text-xs text-green-600 font-medium">
                          {new Date(contract.completed_date).toLocaleDateString('en-US', {
                            month: 'short',
                            day: 'numeric',
                            year: 'numeric'
                          })}
                        </div>
                        <div className="text-xs text-gray-500">
                          {new Date(contract.completed_date).toLocaleDateString('en-US', {
                            weekday: 'short'
                          })}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Grocery List Section */}
        <div className="mt-8 bg-white rounded-xl shadow-lg p-6">
          <h2 className="text-2xl font-semibold mb-6 text-gray-800 flex items-center">
            <span className="mr-2">🛒</span>
            Grocery List
          </h2>
          
          {/* Add New Item Form */}
          <form onSubmit={handleAddGroceryItem} className="mb-6">
            <div className="flex gap-3">
              <input
                type="text"
                value={newGroceryItem}
                onChange={(e) => setNewGroceryItem(e.target.value)}
                placeholder="Add a grocery item..."
                className="flex-1 px-4 py-3 border-2 border-gray-300 rounded-lg focus:outline-none focus:border-indigo-500 transition-colors"
              />
              <button
                type="submit"
                className="px-6 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors duration-200 font-medium"
              >
                Add
              </button>
            </div>
          </form>

          {/* Grocery Items List */}
          {groceries.length === 0 ? (
            <div className="text-center py-8">
              <div className="text-4xl mb-3">🍎</div>
              <p className="text-gray-500">No items on the grocery list</p>
              <p className="text-gray-400 text-sm mt-1">Add items above to get started!</p>
            </div>
          ) : (
            <div className="space-y-2">
              {groceries.map((item) => (
                <div
                  key={item.id}
                  className="flex items-center justify-between p-4 bg-gray-50 rounded-lg border border-gray-200 hover:bg-gray-100 transition-colors"
                >
                  <div className="flex items-center gap-3 flex-1">
                    <span className="text-lg">📦</span>
                    <span className="text-gray-900 font-medium">{item.name}</span>
                  </div>
                  <button
                    onClick={() => handleDeleteGroceryItem(item.id)}
                    className="px-4 py-2 text-sm bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors duration-200"
                  >
                    ✓ Got it
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Stats Footer */}
        <div className="mt-8 bg-white rounded-xl shadow-lg p-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 text-center">
            <div className="p-4 bg-blue-50 rounded-lg">
              <div className="text-2xl font-bold text-blue-600">{users.length}</div>
              <div className="text-sm text-blue-800">Team Members</div>
            </div>
            <div className="p-4 bg-green-50 rounded-lg">
              <div className="text-2xl font-bold text-green-600">{chores.length}</div>
              <div className="text-sm text-green-800">Total Chores</div>
            </div>
            <div className="p-4 bg-purple-50 rounded-lg">
              <div className="text-2xl font-bold text-purple-600">{contracts.length}</div>
              <div className="text-sm text-purple-800">Completions</div>
            </div>
            <div className="p-4 bg-orange-50 rounded-lg">
              <div className="text-2xl font-bold text-orange-600">{groceries.length}</div>
              <div className="text-sm text-orange-800">Grocery Items</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

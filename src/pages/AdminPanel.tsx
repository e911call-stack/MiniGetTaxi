import { useState, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { supabase, isSupabaseConfigured } from '../lib/supabase'

interface AdminPanelProps {
  onBack: () => void
}

interface Driver {
  id: string
  uid: string
  driver_name: string
  plate_number: string
  car_make_model: string
  phone: string
  is_online: boolean
  verified: boolean
  no_show_count: number
  created_at: string
}

interface Request {
  id: string
  status: string
  passenger_name: string
  driver_id?: string
  created_at: string
  completed_at?: string
}

interface Stats {
  activeDrivers: number
  pendingRequests: number
  completedTrips: number
  todayEarnings: number
}

export default function AdminPanel({ onBack }: AdminPanelProps) {
  const { t } = useTranslation()
  const [activeTab, setActiveTab] = useState<'dashboard' | 'drivers' | 'requests'>('dashboard')
  const [drivers, setDrivers] = useState<Driver[]>([])
  const [requests, setRequests] = useState<Request[]>([])
  const [stats, setStats] = useState<Stats>({
    activeDrivers: 0,
    pendingRequests: 0,
    completedTrips: 0,
    todayEarnings: 0
  })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    setLoading(true)
    
    if (!isSupabaseConfigured()) {
      setLoading(false)
      return
    }

    try {
      // Load drivers
      const { data: driversData } = await supabase!
        .from('taxis')
        .select('*')
        .order('created_at', { ascending: false })
      setDrivers(driversData || [])

      // Load requests
      const { data: requestsData } = await supabase!
        .from('requests')
        .select('*')
        .order('created_at', { ascending: false })
      setRequests(requestsData || [])

      // Calculate stats
      const activeDrivers = (driversData || []).filter(d => d.is_online).length
      const pendingRequests = (requestsData || []).filter(r => r.status === 'pending' || r.status === 'accepted').length
      const completedTrips = (requestsData || []).filter(r => r.status === 'completed').length
      const todayEarnings = completedTrips * 2.5

      setStats({
        activeDrivers,
        pendingRequests,
        completedTrips,
        todayEarnings
      })
    } catch (error) {
      console.error('Error loading data:', error)
    } finally {
      setLoading(false)
    }
  }

  const verifyDriver = async (driverId: string) => {
    if (!supabase || !isSupabaseConfigured()) return
    try {
      await supabase
        .from('taxis')
        .update({ verified: true })
        .eq('id', driverId)
      loadData()
    } catch (error) {
      console.error('Error verifying driver:', error)
    }
  }

  const suspendDriver = async (driverId: string) => {
    if (!supabase || !isSupabaseConfigured()) return
    try {
      await supabase
        .from('taxis')
        .update({ is_online: false, verified: false })
        .eq('id', driverId)
      loadData()
    } catch (error) {
      console.error('Error suspending driver:', error)
    }
  }

  const tabs = [
    { id: 'dashboard', label: t('admin.dashboard.title') },
    { id: 'drivers', label: t('admin.drivers.title') },
    { id: 'requests', label: t('admin.requests.title') }
  ]

  return (
    <div className="min-h-screen bg-jordan-black">
      {/* Header */}
      <header className="bg-jordan-gray/80 backdrop-blur-sm border-b border-gray-700 p-4 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <button
            onClick={onBack}
            className="flex items-center gap-2 text-jordan-yellow hover:text-jordan-yellow-dark transition-colors"
          >
            <svg className="w-6 h-6" viewBox="0 0 24 24" fill="currentColor" style={{ transform: 'scaleX(-1)' }}>
              <path d="M20 11H7.83l5.59-5.59L12 4l-8 8 8 8 1.41-1.41L7.83 13H20v-2z"/>
            </svg>
            <span className="font-medium">{t('common.back')}</span>
          </button>
          <h1 className="text-xl font-bold text-white">{t('admin.title')}</h1>
          <div className="w-20" />
        </div>
      </header>

      {/* Tabs */}
      <div className="bg-jordan-gray/50 border-b border-gray-700">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex gap-1">
            {tabs.map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`px-6 py-4 font-medium transition-colors ${
                  activeTab === tab.id
                    ? 'text-jordan-yellow border-b-2 border-jordan-yellow'
                    : 'text-gray-400 hover:text-white'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto p-4">
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="animate-spin w-12 h-12 border-4 border-jordan-yellow border-t-transparent rounded-full" />
          </div>
        ) : (
          <>
            {/* Dashboard Tab */}
            {activeTab === 'dashboard' && (
              <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
                <div className="bg-jordan-gray/50 rounded-xl p-6">
                  <div className="flex items-center gap-4 mb-4">
                    <div className="w-12 h-12 bg-green-500/20 rounded-xl flex items-center justify-center">
                      <svg className="w-6 h-6 text-green-500" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/>
                      </svg>
                    </div>
                    <div>
                      <p className="text-gray-400 text-sm">{t('admin.dashboard.activeDrivers')}</p>
                      <p className="text-3xl font-bold text-white">{stats.activeDrivers}</p>
                    </div>
                  </div>
                </div>

                <div className="bg-jordan-gray/50 rounded-xl p-6">
                  <div className="flex items-center gap-4 mb-4">
                    <div className="w-12 h-12 bg-yellow-500/20 rounded-xl flex items-center justify-center">
                      <svg className="w-6 h-6 text-yellow-500" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm0 16H5V5h14v14z"/>
                      </svg>
                    </div>
                    <div>
                      <p className="text-gray-400 text-sm">{t('admin.dashboard.pendingRequests')}</p>
                      <p className="text-3xl font-bold text-white">{stats.pendingRequests}</p>
                    </div>
                  </div>
                </div>

                <div className="bg-jordan-gray/50 rounded-xl p-6">
                  <div className="flex items-center gap-4 mb-4">
                    <div className="w-12 h-12 bg-blue-500/20 rounded-xl flex items-center justify-center">
                      <svg className="w-6 h-6 text-blue-500" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z"/>
                      </svg>
                    </div>
                    <div>
                      <p className="text-gray-400 text-sm">{t('admin.dashboard.completedTrips')}</p>
                      <p className="text-3xl font-bold text-white">{stats.completedTrips}</p>
                    </div>
                  </div>
                </div>

                <div className="bg-jordan-gray/50 rounded-xl p-6">
                  <div className="flex items-center gap-4 mb-4">
                    <div className="w-12 h-12 bg-jordan-yellow/20 rounded-xl flex items-center justify-center">
                      <svg className="w-6 h-6 text-jordan-yellow" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M11.8 10.9c-2.27-.59-3-1.2-3-2.15 0-1.09 1.01-1.85 2.7-1.85 1.78 0 2.44.85 2.5 2.1h2.21c-.07-1.72-1.12-3.3-3.21-3.81V3h-3v2.16c-1.94.42-3.5 1.68-3.5 3.61 0 2.31 1.91 3.46 4.7 4.13 2.5.6 3 1.48 3 2.41 0 .69-.49 1.79-2.7 1.79-2.06 0-2.87-.92-2.98-2.1h-2.2c.12 2.19 1.76 3.42 3.68 3.83V21h3v-2.15c1.95-.37 3.5-1.5 3.5-3.55 0-2.84-2.43-3.81-4.7-4.4z"/>
                      </svg>
                    </div>
                    <div>
                      <p className="text-gray-400 text-sm">{t('admin.dashboard.todayEarnings')}</p>
                      <p className="text-3xl font-bold text-jordan-yellow">{stats.todayEarnings.toFixed(2)} JOD</p>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Drivers Tab */}
            {activeTab === 'drivers' && (
              <div className="bg-jordan-gray/50 rounded-xl overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-gray-800/50">
                      <tr>
                        <th className="px-6 py-4 text-right text-sm font-medium text-gray-400">{t('passenger.driver.name')}</th>
                        <th className="px-6 py-4 text-right text-sm font-medium text-gray-400">{t('passenger.driver.plate')}</th>
                        <th className="px-6 py-4 text-right text-sm font-medium text-gray-400">{t('passenger.driver.car')}</th>
                        <th className="px-6 py-4 text-right text-sm font-medium text-gray-400">{t('passenger.driver.phone')}</th>
                        <th className="px-6 py-4 text-right text-sm font-medium text-gray-400">Status</th>
                        <th className="px-6 py-4 text-right text-sm font-medium text-gray-400">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-700">
                      {drivers.map(driver => (
                        <tr key={driver.id} className="hover:bg-gray-800/30 transition-colors">
                          <td className="px-6 py-4">
                            <div>
                              <p className="text-white font-medium">{driver.driver_name}</p>
                              <p className="text-gray-400 text-sm">{new Date(driver.created_at).toLocaleDateString()}</p>
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <span className="text-jordan-yellow font-bold">{driver.plate_number}</span>
                          </td>
                          <td className="px-6 py-4 text-gray-300">{driver.car_make_model}</td>
                          <td className="px-6 py-4 text-gray-300">{driver.phone}</td>
                          <td className="px-6 py-4">
                            <div className="flex gap-2">
                              {driver.verified && (
                                <span className="px-2 py-1 bg-green-500/20 text-green-500 rounded text-xs">Verified</span>
                              )}
                              {driver.is_online && (
                                <span className="px-2 py-1 bg-blue-500/20 text-blue-500 rounded text-xs">Online</span>
                              )}
                              {driver.no_show_count > 0 && (
                                <span className="px-2 py-1 bg-red-500/20 text-red-500 rounded text-xs">
                                  {driver.no_show_count} No-shows
                                </span>
                              )}
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <div className="flex gap-2">
                              {!driver.verified && (
                                <button
                                  onClick={() => verifyDriver(driver.id)}
                                  className="px-3 py-1 bg-green-600 text-white rounded text-sm hover:bg-green-700 transition-colors"
                                >
                                  {t('admin.drivers.verify')}
                                </button>
                              )}
                              <button
                                onClick={() => suspendDriver(driver.id)}
                                className="px-3 py-1 bg-red-600 text-white rounded text-sm hover:bg-red-700 transition-colors"
                              >
                                {t('admin.drivers.suspend')}
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                {drivers.length === 0 && (
                  <div className="text-center py-12">
                    <p className="text-gray-400">No drivers registered yet</p>
                  </div>
                )}
              </div>
            )}

            {/* Requests Tab */}
            {activeTab === 'requests' && (
              <div className="space-y-4">
                {/* Filter */}
                <div className="flex gap-2">
                  {['all', 'pending', 'completed', 'cancelled'].map(filter => (
                    <button
                      key={filter}
                      className="px-4 py-2 bg-jordan-gray/50 text-gray-300 rounded-lg hover:bg-jordan-gray transition-colors capitalize"
                    >
                      {t(`admin.requests.${filter}`)}
                    </button>
                  ))}
                </div>

                {/* Requests List */}
                <div className="bg-jordan-gray/50 rounded-xl overflow-hidden">
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead className="bg-gray-800/50">
                        <tr>
                          <th className="px-6 py-4 text-right text-sm font-medium text-gray-400">ID</th>
                          <th className="px-6 py-4 text-right text-sm font-medium text-gray-400">{t('passenger.driver.name')}</th>
                          <th className="px-6 py-4 text-right text-sm font-medium text-gray-400">Status</th>
                          <th className="px-6 py-4 text-right text-sm font-medium text-gray-400">Date</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-700">
                        {requests.map(request => (
                          <tr key={request.id} className="hover:bg-gray-800/30 transition-colors">
                            <td className="px-6 py-4 text-gray-400 text-sm font-mono">{request.id.slice(0, 8)}</td>
                            <td className="px-6 py-4 text-white">{request.passenger_name}</td>
                            <td className="px-6 py-4">
                              <span className={`px-3 py-1 rounded-full text-sm ${
                                request.status === 'completed' ? 'bg-green-500/20 text-green-500' :
                                request.status === 'pending' ? 'bg-yellow-500/20 text-yellow-500' :
                                request.status === 'cancelled' ? 'bg-red-500/20 text-red-500' :
                                'bg-blue-500/20 text-blue-500'
                              }`}>
                                {request.status}
                              </span>
                            </td>
                            <td className="px-6 py-4 text-gray-400 text-sm">
                              {new Date(request.created_at).toLocaleString()}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                  {requests.length === 0 && (
                    <div className="text-center py-12">
                      <p className="text-gray-400">No requests yet</p>
                    </div>
                  )}
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}

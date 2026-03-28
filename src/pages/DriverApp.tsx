import { useState, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { MapContainer, TileLayer, Marker, Popup, useMapEvents } from 'react-leaflet'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import { supabase, isSupabaseConfigured } from '../lib/supabase'

interface DriverAppProps {
  onBack: () => void
}

interface Location {
  lat: number
  lng: number
  address?: string
}

interface Request {
  id: string
  status: string
  passenger_name: string
  passenger_phone?: string
  pickup_location: string
  destination_location: string
  created_at: string
  digital_hide: boolean
}

// Custom taxi icon
const taxiIcon = new L.Icon({
  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-yellow.png',
  iconRetinaUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-yellow.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41]
})

const AMMAN_CENTER: [number, number] = [31.9539, 35.9106]

function LocationMarker({ position, setPosition }: { position: Location | null, setPosition: (loc: Location) => void }) {
  useMapEvents({
    click(e) {
      setPosition({ lat: e.latlng.lat, lng: e.latlng.lng })
    },
  })

  return position === null ? null : (
    <Marker position={[position.lat, position.lng]} icon={taxiIcon}>
      <Popup>Your Location</Popup>
    </Marker>
  )
}

export default function DriverApp({ onBack }: DriverAppProps) {
  const { t } = useTranslation()
  const [isOnline, setIsOnline] = useState(false)
  const [currentLocation, setCurrentLocation] = useState<Location | null>(null)
  const [pendingRequests, setPendingRequests] = useState<Request[]>([])
  const [activeRequest, setActiveRequest] = useState<Request | null>(null)
  const [chatMessages, setChatMessages] = useState<{ sender: 'driver' | 'passenger'; text: string }[]>([])
  const [newMessage, setNewMessage] = useState('')
  const [earnings] = useState({ today: 0, week: 0, total: 0 })
  const [demoMode] = useState(!isSupabaseConfigured())

  // Get current location
  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setCurrentLocation({
            lat: position.coords.latitude,
            lng: position.coords.longitude
          })
        },
        (error) => {
          console.error('Error getting location:', error)
        }
      )
    }
  }, [])

  const toggleOnlineStatus = () => {
    setIsOnline(!isOnline)
  }

  const acceptRequest = async (requestId: string) => {
    if (demoMode) {
      const request = pendingRequests.find(r => r.id === requestId)
      if (request) {
        setActiveRequest({ ...request, status: 'accepted' })
      }
      setPendingRequests(prev => prev.filter(r => r.id !== requestId))
      return
    }

    if (!supabase) return

    try {
      await supabase
        .from('requests')
        .update({
          status: 'accepted'
        })
        .eq('id', requestId)

      const request = pendingRequests.find(r => r.id === requestId)
      if (request) {
        setActiveRequest({ ...request, status: 'accepted' })
      }
      setPendingRequests(prev => prev.filter(r => r.id !== requestId))
    } catch (error) {
      console.error('Error accepting request:', error)
    }
  }

  const rejectRequest = (requestId: string) => {
    setPendingRequests(prev => prev.filter(r => r.id !== requestId))
  }

  const updateRequestStatus = async (status: string) => {
    if (!activeRequest) return

    if (demoMode) {
      setActiveRequest(prev => prev ? { ...prev, status } : null)
      return
    }

    if (!supabase) return

    try {
      await supabase
        .from('requests')
        .update({ status })
        .eq('id', activeRequest.id)

      setActiveRequest(prev => prev ? { ...prev, status } : null)
    } catch (error) {
      console.error('Error updating status:', error)
    }
  }

  const sendMessage = () => {
    if (!newMessage.trim() || !activeRequest) return

    setChatMessages(prev => [...prev, { sender: 'driver', text: newMessage }])
    setNewMessage('')

    // Demo mode - simulate passenger response
    if (demoMode) {
      setTimeout(() => {
        setChatMessages(prev => [...prev, { sender: 'passenger', text: 'شكراً!' }])
      }, 1000)
    }
  }

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
          <h1 className="text-xl font-bold text-white">{t('driver.title')}</h1>
          <div className="flex items-center gap-2">
            <div className={`w-3 h-3 rounded-full ${isOnline ? 'bg-green-500' : 'bg-gray-500'}`} />
            <span className={`text-sm ${isOnline ? 'text-green-500' : 'text-gray-500'}`}>
              {t(`driver.status.${isOnline ? 'online' : 'offline'}`)}
            </span>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto p-4">
        {/* Demo Mode Banner */}
        {demoMode && (
          <div className="bg-blue-900/50 border border-blue-700 rounded-xl p-4 mb-6">
            <p className="text-blue-300 text-center text-sm">
              وضع تجريبي - Demo Mode | قم بتكوين Supabase للاستخدام الفعلي
            </p>
          </div>
        )}

        {/* Online/Offline Toggle */}
        <div className="bg-jordan-gray/50 rounded-xl p-6 mb-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold text-white">
                {isOnline ? t('driver.status.online') : t('driver.status.offline')}
              </h3>
              <p className="text-gray-400 text-sm">
                {isOnline ? 'You are visible to passengers' : 'You are hidden from passengers'}
              </p>
            </div>
            <button
              onClick={toggleOnlineStatus}
              className={`relative w-20 h-10 rounded-full transition-colors ${
                isOnline ? 'bg-green-500' : 'bg-gray-600'
              }`}
            >
              <div className={`absolute top-1 w-8 h-8 bg-white rounded-full transition-transform ${isOnline ? 'right-1' : 'left-1'}`} />
            </button>
          </div>
        </div>

        {/* Map */}
        <div className="mb-6">
          <div className="h-64 rounded-xl overflow-hidden border-2 border-jordan-yellow/30">
            <MapContainer
              center={currentLocation ? [currentLocation.lat, currentLocation.lng] : AMMAN_CENTER}
              zoom={13}
              className="h-full w-full"
            >
              <TileLayer
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              />
              <LocationMarker position={currentLocation} setPosition={setCurrentLocation} />
            </MapContainer>
          </div>
        </div>

        {/* Active Request */}
        {activeRequest ? (
          <div className="bg-jordan-gray/50 rounded-xl p-6 mb-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-white">{t('driver.trip.inProgress')}</h3>
              <span className="px-3 py-1 bg-jordan-yellow text-jordan-black rounded-full text-sm font-medium">
                {activeRequest.status}
              </span>
            </div>

            {/* Passenger Info */}
            <div className="border-t border-gray-700 pt-4 mb-4">
              <h4 className="font-medium text-white mb-2">{t('driver.passenger.info')}</h4>
              <p className="text-jordan-yellow text-lg font-bold">{activeRequest.passenger_name}</p>
              {!activeRequest.digital_hide && activeRequest.passenger_phone && (
                <div className="flex gap-2 mt-2">
                  <a href={`tel:${activeRequest.passenger_phone}`} className="px-4 py-2 bg-gray-700 rounded-lg text-white text-sm hover:bg-gray-600">
                    {t('passenger.driver.call')}
                  </a>
                  <a href={`https://wa.me/${activeRequest.passenger_phone}`} target="_blank" rel="noopener noreferrer" className="px-4 py-2 bg-green-600 rounded-lg text-white text-sm hover:bg-green-700">
                    {t('passenger.driver.whatsapp')}
                  </a>
                </div>
              )}
            </div>

            {/* Action Buttons */}
            <div className="grid grid-cols-2 gap-3">
              {activeRequest.status === 'accepted' && (
                <button
                  onClick={() => updateRequestStatus('arriving')}
                  className="col-span-2 py-3 bg-jordan-yellow text-jordan-black rounded-xl font-bold hover:bg-jordan-yellow-dark transition-colors"
                >
                  {t('driver.actions.imHere')}
                </button>
              )}
              {activeRequest.status === 'arriving' && (
                <button
                  onClick={() => updateRequestStatus('arrived')}
                  className="col-span-2 py-3 bg-green-600 text-white rounded-xl font-bold hover:bg-green-700 transition-colors"
                >
                  {t('driver.actions.imHere')}
                </button>
              )}
              {activeRequest.status === 'arrived' && (
                <button
                  onClick={() => updateRequestStatus('in_progress')}
                  className="col-span-2 py-3 bg-blue-600 text-white rounded-xl font-bold hover:bg-blue-700 transition-colors"
                >
                  {t('driver.actions.startTrip')}
                </button>
              )}
              {activeRequest.status === 'in_progress' && (
                <button
                  onClick={() => updateRequestStatus('completed')}
                  className="col-span-2 py-3 bg-green-600 text-white rounded-xl font-bold hover:bg-green-700 transition-colors"
                >
                  {t('driver.actions.endTrip')}
                </button>
              )}
              {activeRequest.status === 'completed' && (
                <div className="col-span-2 py-3 bg-green-500 text-white rounded-xl font-bold text-center">
                  {t('driver.trip.completed')}
                </div>
              )}
            </div>

            {/* Chat */}
            {(activeRequest.status === 'arrived' || activeRequest.status === 'in_progress' || demoMode) && (
              <div className="mt-6 border-t border-gray-700 pt-4">
                <h4 className="font-medium text-white mb-3">{t('passenger.chat.title')}</h4>
                <div className="h-32 overflow-y-auto mb-3 space-y-2">
                  {chatMessages.map((msg, idx) => (
                    <div key={idx} className={`flex ${msg.sender === 'driver' ? 'justify-end' : 'justify-start'}`}>
                      <div className={`max-w-xs px-3 py-2 rounded-xl text-sm ${msg.sender === 'driver' ? 'bg-jordan-yellow text-jordan-black' : 'bg-gray-700 text-white'}`}>
                        {msg.text}
                      </div>
                    </div>
                  ))}
                </div>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
                    placeholder={t('passenger.chat.placeholder')}
                    className="flex-1 px-4 py-2 bg-gray-700 text-white rounded-xl focus:outline-none focus:ring-2 focus:ring-jordan-yellow text-sm"
                  />
                  <button
                    onClick={sendMessage}
                    className="px-4 py-2 bg-jordan-yellow text-jordan-black rounded-xl font-medium hover:bg-jordan-yellow-dark transition-colors"
                  >
                    {t('passenger.chat.send')}
                  </button>
                </div>
              </div>
            )}
          </div>
        ) : (
          <>
            {/* Pending Requests */}
            <div className="bg-jordan-gray/50 rounded-xl p-6 mb-6">
              <h3 className="text-lg font-semibold text-white mb-4">{t('driver.requests.title')}</h3>
              
              {pendingRequests.length === 0 ? (
                <div className="text-center py-8">
                  <svg className="w-16 h-16 text-gray-500 mx-auto mb-4" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm0 16H5V5h14v14z"/>
                    <path d="M7 12h2v5H7zm4-3h2v8h-2zm4-3h2v11h-2z"/>
                  </svg>
                  <p className="text-gray-400">{t('driver.requests.noRequests')}</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {pendingRequests.map(request => (
                    <div key={request.id} className="border border-gray-700 rounded-xl p-4 hover:border-jordan-yellow transition-colors">
                      <div className="flex items-center justify-between mb-3">
                        <p className="text-white font-bold text-lg">{request.passenger_name}</p>
                        <span className="text-gray-400 text-sm">
                          {new Date(request.created_at).toLocaleTimeString()}
                        </span>
                      </div>
                      <div className="flex gap-3">
                        <button
                          onClick={() => acceptRequest(request.id)}
                          className="flex-1 py-3 bg-jordan-yellow text-jordan-black rounded-xl font-bold hover:bg-jordan-yellow-dark transition-colors"
                        >
                          {t('driver.actions.accept')}
                        </button>
                        <button
                          onClick={() => rejectRequest(request.id)}
                          className="px-6 py-3 bg-gray-700 text-white rounded-xl font-medium hover:bg-gray-600 transition-colors"
                        >
                          {t('driver.actions.reject')}
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Earnings Summary */}
            <div className="bg-jordan-gray/50 rounded-xl p-6">
              <h3 className="text-lg font-semibold text-white mb-4">{t('driver.earnings.title')}</h3>
              <div className="grid grid-cols-3 gap-4">
                <div className="text-center">
                  <p className="text-gray-400 text-sm mb-1">{t('driver.earnings.today')}</p>
                  <p className="text-2xl font-bold text-jordan-yellow">{earnings.today.toFixed(2)}</p>
                </div>
                <div className="text-center">
                  <p className="text-gray-400 text-sm mb-1">{t('driver.earnings.week')}</p>
                  <p className="text-2xl font-bold text-jordan-yellow">{earnings.week.toFixed(2)}</p>
                </div>
                <div className="text-center">
                  <p className="text-gray-400 text-sm mb-1">{t('driver.earnings.total')}</p>
                  <p className="text-2xl font-bold text-jordan-yellow">{earnings.total.toFixed(2)}</p>
                </div>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  )
}

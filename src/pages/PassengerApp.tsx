import { useState, useEffect, useRef } from 'react'
import { useTranslation } from 'react-i18next'
import { MapContainer, TileLayer, Marker, Popup, useMapEvents } from 'react-leaflet'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import { supabase, isSupabaseConfigured, mockTaxis, mockRequest } from '../lib/supabase'

interface PassengerAppProps {
  onBack: () => void
}

interface Location {
  lat: number
  lng: number
  address?: string
}

interface Driver {
  id: string
  name: string
  plate: string
  car: string
  phone: string
  distance?: number
}

interface Request {
  id: string
  status: 'pending' | 'accepted' | 'arriving' | 'arrived' | 'in_progress' | 'completed' | 'cancelled'
  driver?: Driver
  passenger_location: Location
  destination_location: Location
  created_at: string
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

// Default Amman center
const AMMAN_CENTER: [number, number] = [31.9539, 35.9106]

function LocationMarker({ position, setPosition }: { position: Location | null, setPosition: (loc: Location) => void }) {
  const map = useMapEvents({
    click(e) {
      setPosition({ lat: e.latlng.lat, lng: e.latlng.lng })
      map.flyTo(e.latlng, map.getZoom())
    },
  })

  return position === null ? null : (
    <Marker position={[position.lat, position.lng]} icon={taxiIcon}>
      <Popup>Your Location</Popup>
    </Marker>
  )
}

export default function PassengerApp({ onBack }: PassengerAppProps) {
  const { t } = useTranslation()
  const [pickupLocation, setPickupLocation] = useState<Location | null>(null)
  const [destinationLocation, setDestinationLocation] = useState<Location | null>(null)
  const [digitalHide, setDigitalHide] = useState(false)
  const [currentRequest, setCurrentRequest] = useState<Request | null>(null)
  const [availableDrivers, setAvailableDrivers] = useState<Driver[]>([])
  const [chatMessages, setChatMessages] = useState<{ sender: 'passenger' | 'driver'; text: string }[]>([])
  const [newMessage, setNewMessage] = useState('')
  const [isSearching, setIsSearching] = useState(false)
  const [demoMode] = useState(!isSupabaseConfigured())
  const chatEndRef = useRef<HTMLDivElement>(null)

  // Get user location on mount
  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setPickupLocation({
            lat: position.coords.latitude,
            lng: position.coords.longitude
          })
        },
        () => {
          // Default to Amman center if geolocation fails
          setPickupLocation({ lat: AMMAN_CENTER[0], lng: AMMAN_CENTER[1] })
        }
      )
    }
  }, [])

  // Auto-scroll chat
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [chatMessages])

  const handleGetLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setPickupLocation({
            lat: position.coords.latitude,
            lng: position.coords.longitude
          })
        },
        (error) => {
          console.error('Error getting location:', error)
          alert(t('errors.locationNotFound'))
        }
      )
    }
  }

  const searchForTaxis = async () => {
    if (!pickupLocation) return

    setIsSearching(true)
    
    if (demoMode) {
      // Demo mode - show mock taxis
      setTimeout(() => {
        setAvailableDrivers(mockTaxis.map(t => ({
          id: t.id,
          name: t.driver_name,
          plate: t.plate_number,
          car: t.car_make_model,
          phone: t.phone,
          distance: t.distance
        })))
        setIsSearching(false)
      }, 1500)
      return
    }

    if (!supabase) return

    try {
      const { data, error } = await supabase.rpc('find_nearby_taxis', {
        passenger_lat: pickupLocation.lat,
        passenger_lng: pickupLocation.lng,
        radius_meters: 2000
      })

      if (error) throw error

      const drivers: Driver[] = (data || []).map((taxi: any) => ({
        id: taxi.id,
        name: taxi.driver_name,
        plate: taxi.plate_number,
        car: taxi.car_make_model,
        phone: taxi.phone,
        distance: taxi.distance
      }))

      setAvailableDrivers(drivers)
    } catch (error) {
      console.error('Error searching for taxis:', error)
    } finally {
      setIsSearching(false)
    }
  }

  const requestTaxi = async (driverId: string) => {
    if (!pickupLocation || !destinationLocation) return

    if (demoMode) {
      // Demo mode - simulate request
      setCurrentRequest({
        ...mockRequest,
        driver: availableDrivers.find(d => d.id === driverId),
        passenger_location: pickupLocation,
        destination_location: destinationLocation
      })
      return
    }

    if (!supabase) return

    try {
      const { data, error } = await supabase
        .from('requests')
        .insert({
          driver_id: driverId,
          passenger_location: `POINT(${pickupLocation.lng} ${pickupLocation.lat})`,
          destination_location: `POINT(${destinationLocation.lng} ${destinationLocation.lat})`,
          status: 'pending',
          digital_hide: digitalHide,
          passenger_name: digitalHide ? 'راكب مجهول' : 'راكب'
        })
        .select()
        .single()

      if (error) throw error

      setCurrentRequest({
        id: data.id,
        status: 'pending',
        passenger_location: pickupLocation,
        destination_location: destinationLocation,
        created_at: data.created_at
      })
    } catch (error) {
      console.error('Error requesting taxi:', error)
      alert(t('errors.requestFailed'))
    }
  }

  const sendMessage = () => {
    if (!newMessage.trim()) return

    setChatMessages(prev => [...prev, { sender: 'passenger', text: newMessage }])
    setNewMessage('')

    // Demo mode - simulate driver response
    if (demoMode && currentRequest?.status === 'arrived') {
      setTimeout(() => {
        setChatMessages(prev => [...prev, { sender: 'driver', text: 'أنا في الانتظار!' }])
      }, 1000)
    }
  }

  const cancelRequest = () => {
    if (confirm(t('passenger.cancel.confirm'))) {
      setCurrentRequest(null)
      setChatMessages([])
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
          <h1 className="text-xl font-bold text-white">{t('passenger.title')}</h1>
          <div className="w-20" />
        </div>
      </header>

      <div className="max-w-7xl mx-auto p-4">
        {!currentRequest ? (
          <>
            {/* Demo Mode Banner */}
            {demoMode && (
              <div className="bg-blue-900/50 border border-blue-700 rounded-xl p-4 mb-6">
                <p className="text-blue-300 text-center text-sm">
                  وضع تجريبي - Demo Mode | قم بتكوين Supabase للاستخدام الفعلي
                </p>
              </div>
            )}

            {/* Map Section */}
            <div className="mb-6">
              <div className="h-64 md:h-96 rounded-xl overflow-hidden border-2 border-jordan-yellow/30">
                <MapContainer
                  center={pickupLocation ? [pickupLocation.lat, pickupLocation.lng] : AMMAN_CENTER}
                  zoom={13}
                  className="h-full w-full"
                >
                  <TileLayer
                    attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
                    url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                  />
                  <LocationMarker position={pickupLocation} setPosition={setPickupLocation} />
                  {destinationLocation && (
                    <Marker position={[destinationLocation.lat, destinationLocation.lng]} icon={taxiIcon}>
                      <Popup>Destination</Popup>
                    </Marker>
                  )}
                </MapContainer>
              </div>
            </div>

            {/* Location Selection */}
            <div className="space-y-4 mb-6">
              <div className="bg-jordan-gray/50 rounded-xl p-4">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="font-semibold text-white">{t('passenger.location.title')}</h3>
                  <button
                    onClick={handleGetLocation}
                    className="px-4 py-2 bg-jordan-yellow text-jordan-black rounded-lg text-sm font-medium hover:bg-jordan-yellow-dark transition-colors"
                  >
                    {t('passenger.location.selectLocation')}
                  </button>
                </div>
                {pickupLocation && (
                  <p className="text-gray-400 text-sm">
                    {pickupLocation.lat.toFixed(6)}, {pickupLocation.lng.toFixed(6)}
                  </p>
                )}
              </div>

              <div className="bg-jordan-gray/50 rounded-xl p-4">
                <h3 className="font-semibold text-white mb-3">{t('passenger.destination.title')}</h3>
                <p className="text-gray-400 text-sm mb-3">{t('passenger.destination.selectOnMap')}</p>
                {destinationLocation ? (
                  <p className="text-gray-400 text-sm">
                    {destinationLocation.lat.toFixed(6)}, {destinationLocation.lng.toFixed(6)}
                  </p>
                ) : (
                  <button
                    onClick={() => setDestinationLocation({ lat: AMMAN_CENTER[0] + 0.01, lng: AMMAN_CENTER[1] + 0.01 })}
                    className="px-4 py-2 bg-gray-700 text-white rounded-lg text-sm font-medium hover:bg-gray-600 transition-colors"
                  >
                    {t('passenger.destination.selectOnMap')}
                  </button>
                )}
              </div>
            </div>

            {/* Options */}
            <div className="bg-jordan-gray/50 rounded-xl p-4 mb-6">
              <h3 className="font-semibold text-white mb-4">{t('passenger.options.title')}</h3>
              
              <div className="flex items-center justify-between mb-4">
                <div>
                  <p className="text-white font-medium">{t('passenger.options.digitalHide.label')}</p>
                  <p className="text-gray-400 text-sm">{t('passenger.options.digitalHide.description')}</p>
                </div>
                <button
                  onClick={() => setDigitalHide(!digitalHide)}
                  className={`relative w-14 h-8 rounded-full transition-colors ${digitalHide ? 'bg-jordan-yellow' : 'bg-gray-600'}`}
                >
                  <div className={`absolute top-1 w-6 h-6 bg-white rounded-full transition-transform ${digitalHide ? 'right-1' : 'left-1'}`} />
                </button>
              </div>
            </div>

            {/* Request Button */}
            <button
              onClick={pickupLocation && destinationLocation ? searchForTaxis : undefined}
              disabled={!pickupLocation || !destinationLocation || isSearching}
              className={`w-full py-4 rounded-xl font-bold text-lg transition-all ${
                pickupLocation && destinationLocation
                  ? 'bg-jordan-yellow text-jordan-black hover:bg-jordan-yellow-dark'
                  : 'bg-gray-700 text-gray-400 cursor-not-allowed'
              }`}
            >
              {isSearching ? t('passenger.request.searching') : t('passenger.request.button')}
            </button>

            {/* Available Drivers */}
            {availableDrivers.length > 0 && (
              <div className="mt-6">
                <h3 className="text-lg font-semibold text-white mb-4">
                  {availableDrivers.length} {t('driver.requests.title')}
                </h3>
                <div className="space-y-3">
                  {availableDrivers.map(driver => (
                    <div key={driver.id} className="bg-jordan-gray/50 rounded-xl p-4 border border-gray-700 hover:border-jordan-yellow transition-colors">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-white font-medium">{driver.name}</p>
                          <p className="text-gray-400 text-sm">{driver.car}</p>
                          <p className="text-jordan-yellow text-sm">{driver.plate}</p>
                          {driver.distance && (
                            <p className="text-gray-500 text-xs">
                              {t('driver.requests.distance')}: {(driver.distance / 1000).toFixed(1)} {t('common.km')}
                            </p>
                          )}
                        </div>
                        <button
                          onClick={() => requestTaxi(driver.id)}
                          className="px-6 py-3 bg-jordan-yellow text-jordan-black rounded-xl font-bold hover:bg-jordan-yellow-dark transition-colors"
                        >
                          {t('driver.actions.accept')}
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </>
        ) : (
          <>
            {/* Active Request Status */}
            <div className="bg-jordan-gray/50 rounded-xl p-6 mb-6">
              <div className="flex items-center gap-4 mb-4">
                <div className="w-16 h-16 bg-jordan-yellow rounded-xl flex items-center justify-center">
                  <svg className="w-10 h-10 text-jordan-black" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M18.92 6.01C18.72 5.42 18.16 5 17.5 5h-11c-.66 0-1.21.42-1.42 1.01L3 12v8c0 .55.45 1 1 1h1c.55 0 1-.45 1-1v-1h12v1c0 .55.45 1 1 1h1c.55 0 1-.45 1-1v-8l-2.08-5.99zM6.5 16c-.83 0-1.5-.67-1.5-1.5S5.67 13 6.5 13s1.5.67 1.5 1.5S7.33 16 6.5 16zm11 0c-.83 0-1.5-.67-1.5-1.5s.67-1.5 1.5-1.5 1.5.67 1.5 1.5-.67 1.5-1.5 1.5zM5 11l1.5-4.5h11L19 11H5z"/>
                  </svg>
                </div>
                <div>
                  <p className="text-2xl font-bold text-jordan-yellow">
                    {t(`passenger.status.${currentRequest.status}`)}
                  </p>
                  <p className="text-gray-400 text-sm">
                    {new Date(currentRequest.created_at).toLocaleTimeString()}
                  </p>
                </div>
              </div>

              {/* Driver Details */}
              {currentRequest.driver && (
                <div className="border-t border-gray-700 pt-4 mt-4">
                  <h4 className="font-semibold text-white mb-3">{t('passenger.driver.details')}</h4>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-gray-400 text-sm">{t('passenger.driver.name')}</p>
                      <p className="text-white">{currentRequest.driver.name}</p>
                    </div>
                    <div>
                      <p className="text-gray-400 text-sm">{t('passenger.driver.plate')}</p>
                      <p className="text-jordan-yellow font-bold">{currentRequest.driver.plate}</p>
                    </div>
                    <div>
                      <p className="text-gray-400 text-sm">{t('passenger.driver.car')}</p>
                      <p className="text-white">{currentRequest.driver.car}</p>
                    </div>
                    <div>
                      <p className="text-gray-400 text-sm">{t('passenger.driver.phone')}</p>
                      <div className="flex gap-2">
                        <a href={`tel:${currentRequest.driver.phone}`} className="px-3 py-1 bg-gray-700 rounded-lg text-white text-sm hover:bg-gray-600">
                          {t('passenger.driver.call')}
                        </a>
                        <a href={`https://wa.me/${currentRequest.driver.phone}`} target="_blank" rel="noopener noreferrer" className="px-3 py-1 bg-green-600 rounded-lg text-white text-sm hover:bg-green-700">
                          {t('passenger.driver.whatsapp')}
                        </a>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              <button onClick={cancelRequest} className="w-full mt-4 py-3 bg-red-600 text-white rounded-xl font-bold hover:bg-red-700 transition-colors">
                {t('passenger.cancel.button')}
              </button>
            </div>

            {/* Chat Section */}
            {(currentRequest.status === 'arrived' || currentRequest.status === 'in_progress' || demoMode) ? (
              <div className="bg-jordan-gray/50 rounded-xl p-4">
                <h4 className="font-semibold text-white mb-4">{t('passenger.chat.title')}</h4>
                <div className="h-48 overflow-y-auto mb-4 space-y-2">
                  {chatMessages.length === 0 && (
                    <p className="text-gray-500 text-center py-8">{t('passenger.chat.locked')}</p>
                  )}
                  {chatMessages.map((msg, idx) => (
                    <div key={idx} className={`flex ${msg.sender === 'passenger' ? 'justify-end' : 'justify-start'}`}>
                      <div className={`max-w-xs px-4 py-2 rounded-xl ${msg.sender === 'passenger' ? 'bg-jordan-yellow text-jordan-black' : 'bg-gray-700 text-white'}`}>
                        {msg.text}
                      </div>
                    </div>
                  ))}
                  <div ref={chatEndRef} />
                </div>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
                    placeholder={t('passenger.chat.placeholder')}
                    className="flex-1 px-4 py-2 bg-gray-700 text-white rounded-xl focus:outline-none focus:ring-2 focus:ring-jordan-yellow"
                  />
                  <button onClick={sendMessage} className="px-6 py-2 bg-jordan-yellow text-jordan-black rounded-xl font-bold hover:bg-jordan-yellow-dark transition-colors">
                    {t('passenger.chat.send')}
                  </button>
                </div>
              </div>
            ) : (
              <div className="bg-jordan-gray/50 rounded-xl p-4 text-center">
                <svg className="w-12 h-12 text-gray-500 mx-auto mb-2" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M20 2H4c-1.1 0-2 .9-2 2v18l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zm0 14H5.17L4 17.17V4h16v12z"/>
                </svg>
                <p className="text-gray-400">{t('passenger.chat.locked')}</p>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}

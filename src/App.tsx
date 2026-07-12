import { Routes, Route } from 'react-router-dom'
import Landing from './routes/Landing'
import JoinRoom from './routes/JoinRoom'
import StageRoom from './routes/StageRoom'
import PlayerRoom from './routes/PlayerRoom'

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Landing />} />
      <Route path="/join/:roomCode" element={<JoinRoom />} />
      <Route path="/room/:roomCode/stage" element={<StageRoom />} />
      <Route path="/room/:roomCode/player/:playerId" element={<PlayerRoom />} />
    </Routes>
  )
}
